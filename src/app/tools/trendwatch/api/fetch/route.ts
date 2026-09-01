import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Server-side feed fetcher for the trend digest tool. Exists because browsers
// cannot fetch cross-origin RSS directly (CORS). Fetches every requested feed
// in parallel under a hard time budget so the handler finishes well inside the
// shortest common serverless function limit, whatever plan tier this deploys
// to. One bad feed must never fail the request - per-feed results carry their
// own ok/error.

export const runtime = 'nodejs'
// Watched pages are heavier than feeds; give the function explicit headroom
// on the Pro plan rather than relying on the default.
export const maxDuration = 60

const FEED_TIMEOUT_MS = 6000
const PAGE_TIMEOUT_MS = 10000
const MAX_PAGES = 10
const GLOBAL_BUDGET_MS = 8000
const MIN_FEED_BUDGET_MS = 750
const CONCURRENCY = 8
const MAX_FEEDS = 30
const DESCRIPTION_LIMIT = 300
// Some feeds reject default fetch user agents outright - send a normal browser UA.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

type FeedStatus = {
  url: string
  ok: boolean
  itemCount: number
  error: string | null
}

export type DigestItem = {
  title: string
  link: string
  sourceUrl: string
  date: string | null // ISO string when parseable
  dateUnknown: boolean
  description: string
}

type ExtraItemFields = { summary?: string }

const parser: Parser<Record<string, never>, ExtraItemFields> = new Parser({
  customFields: { item: [['summary', 'summary']] },
})

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim()
}

function normalizeLink(link: string): string {
  // Ignore tracking params and trailing slashes when deduping by link.
  try {
    const u = new URL(link)
    u.hash = ''
    const params = new URLSearchParams()
    u.searchParams.forEach((v, k) => {
      if (!/^utm_|^fbclid$|^gclid$/i.test(k)) params.append(k, v)
    })
    u.search = params.toString()
    return u.toString().replace(/\/+$/, '').toLowerCase()
  } catch {
    return link.trim().toLowerCase()
  }
}

// ── Watched pages ─────────────────────────────────────────────────────────
// Trend content is often a living article that gets refreshed in place; RSS
// cannot see that. A watched page is fetched as HTML, the main content region
// is chosen heuristically (no dependency: <article>, else <main>, else the
// stripped body), and its h2/h3 headings are extracted - on a trend listicle
// the headings ARE the trends. The client owns baselines and change
// detection; this handler just reports current content + a stable hash.

export type PageResult = {
  url: string
  ok: boolean
  title: string
  headings: string[]
  contentHash: string
  extractedFrom: 'article' | 'main' | 'body'
  error: string | null
}

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;|&#8217;/g, "'")
    .replace(/&quot;|&#8220;|&#8221;/g, '"')
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => {
      try {
        return String.fromCodePoint(parseInt(n, 16))
      } catch {
        return ' '
      }
    })
    .replace(/&#(\d+);/g, (_, n) => {
      try {
        return String.fromCodePoint(Number(n))
      } catch {
        return ' '
      }
    })
}

function extractPage(html: string): {
  title: string
  headings: string[]
  contentHash: string
  extractedFrom: 'article' | 'main' | 'body'
} {
  const title = decodeEntities(
    (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ??
      html.match(/property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1] ??
      '')
      .replace(/\s+/g, ' ')
      .trim()
  )

  // Remove non-content blocks before choosing a region.
  let cleaned = html
  for (const tag of ['script', 'style', 'noscript', 'template', 'svg',
                     'nav', 'header', 'footer', 'aside', 'form']) {
    cleaned = cleaned.replace(
      new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi'),
      ' '
    )
  }

  // Region preference: <article> (largest when several), then <main>, then
  // the whole cleaned body - but a region only wins if it actually holds
  // content. Real pages ship decorative <article> shells (socialbee's is
  // 2.3KB with zero headings while the trends live outside it), so each
  // candidate must contain at least one h2/h3 and substantial text or the
  // next one is tried.
  const headingCount = (s: string) =>
    (s.match(/<h[23]\b/gi) ?? []).length
  const textLen = (s: string) =>
    s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().length
  const candidates: { html: string; from: 'article' | 'main' | 'body' }[] = []
  const articles = cleaned.match(/<article\b[\s\S]*?<\/article>/gi) ?? []
  if (articles.length > 0) {
    candidates.push({
      html: articles.reduce((a, b) => (b.length > a.length ? b : a), ''),
      from: 'article',
    })
  }
  const main = cleaned.match(/<main\b[\s\S]*?<\/main>/i)?.[0]
  if (main) candidates.push({ html: main, from: 'main' })
  candidates.push({ html: cleaned, from: 'body' })

  const chosen =
    candidates.find((c) => headingCount(c.html) > 0 && textLen(c.html) > 500) ??
    candidates[candidates.length - 1]
  const region = chosen.html
  const extractedFrom = chosen.from

  const headings: string[] = []
  const seen = new Set<string>()
  for (const m of region.matchAll(/<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi)) {
    const text = decodeEntities(m[2].replace(/<[^>]*>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim()
    if (!text || text.length > 200) continue
    const key = text.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    headings.push(text)
    if (headings.length >= 60) break
  }

  const contentText = region.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  const contentHash = createHash('sha256').update(contentText).digest('hex')

  return { title, headings, contentHash, extractedFrom }
}

async function fetchOnePage(url: string): Promise<PageResult> {
  const result: PageResult = {
    url, ok: false, title: '', headings: [], contentHash: '',
    extractedFrom: 'body', error: null,
  }
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept: 'text/html, application/xhtml+xml, */*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(PAGE_TIMEOUT_MS),
      cache: 'no-store',
    })
    if (!res.ok) {
      result.error = `HTTP ${res.status}`
      return result
    }
    const html = await res.text()
    const extracted = extractPage(html)
    result.ok = true
    result.title = extracted.title
    result.headings = extracted.headings
    result.contentHash = extracted.contentHash
    result.extractedFrom = extracted.extractedFrom
  } catch (e) {
    const err = e as Error
    result.error =
      err.name === 'TimeoutError' || err.name === 'AbortError'
        ? `timed out after ${Math.round(PAGE_TIMEOUT_MS / 1000)}s`
        : err.message || String(e)
  }
  return result
}


async function fetchOneFeed(
  url: string,
  timeoutMs: number,
  sinceMs: number
): Promise<{ status: FeedStatus; items: DigestItem[] }> {
  const status: FeedStatus = { url, ok: false, itemCount: 0, error: null }
  const items: DigestItem[] = []
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, */*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
      cache: 'no-store',
    })
    if (!res.ok) {
      status.error = `HTTP ${res.status}`
      return { status, items }
    }
    const xml = await res.text()
    const feed = await parser.parseString(xml)
    for (const item of feed.items ?? []) {
      const title = (item.title ?? '').trim()
      const link = (item.link ?? '').trim()
      if (!title && !link) continue
      const rawDate = item.isoDate ?? item.pubDate ?? null
      const parsed = rawDate ? Date.parse(rawDate) : NaN
      const dateUnknown = Number.isNaN(parsed)
      // Unparseable dates are included and flagged, never dropped.
      if (!dateUnknown && parsed < sinceMs) continue
      const summaryField = typeof item.summary === 'string' ? item.summary : ''
      const rawDesc = item.contentSnippet ?? item.content ?? summaryField
      let description = stripHtml(rawDesc)
      if (description.length > DESCRIPTION_LIMIT) {
        description = description.slice(0, DESCRIPTION_LIMIT - 1).trimEnd() + '…'
      }
      items.push({
        title: title || '(untitled)',
        link,
        sourceUrl: url,
        date: dateUnknown ? null : new Date(parsed).toISOString(),
        dateUnknown,
        description,
      })
    }
    status.ok = true
    status.itemCount = items.length
  } catch (e) {
    const err = e as Error
    status.error =
      err.name === 'TimeoutError' || err.name === 'AbortError'
        ? `timed out after ${Math.round(timeoutMs / 1000)}s`
        : err.message || String(e)
  }
  return { status, items }
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const deadline = startedAt + GLOBAL_BUDGET_MS

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }
  const { urls, pages, sinceDays } = (body ?? {}) as {
    urls?: unknown
    pages?: unknown
    sinceDays?: unknown
  }
  const cleanUrls = (Array.isArray(urls) ? urls : [])
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_FEEDS)
  const cleanPages = (Array.isArray(pages) ? pages : [])
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_PAGES)
  if (cleanUrls.length === 0 && cleanPages.length === 0) {
    return NextResponse.json(
      { error: 'no valid http(s) urls supplied' },
      { status: 400 }
    )
  }
  // Watched pages run concurrently with the feed pool; each has its own 10s
  // timeout and the count is capped, so worst case stays well inside
  // maxDuration.
  const pagesPromise = Promise.all(cleanPages.map(fetchOnePage))
  const days =
    typeof sinceDays === 'number' && Number.isFinite(sinceDays)
      ? Math.min(Math.max(Math.round(sinceDays), 1), 30)
      : 7
  const sinceMs = startedAt - days * 24 * 60 * 60 * 1000

  // Worker pool: parallel, capped, and every feed start re-checks the global
  // budget so a long list degrades to visible per-feed "budget exhausted"
  // failures instead of a platform timeout that loses everything.
  const statuses: FeedStatus[] = []
  const allItems: DigestItem[] = []
  let next = 0
  async function worker() {
    while (next < cleanUrls.length) {
      const url = cleanUrls[next++]
      const remaining = deadline - Date.now()
      if (remaining < MIN_FEED_BUDGET_MS) {
        statuses.push({
          url,
          ok: false,
          itemCount: 0,
          error: 'skipped - time budget exhausted',
        })
        continue
      }
      const { status, items } = await fetchOneFeed(
        url,
        Math.min(FEED_TIMEOUT_MS, remaining),
        sinceMs
      )
      statuses.push(status)
      allItems.push(...items)
    }
  }
  await Promise.allSettled(
    Array.from({ length: Math.min(CONCURRENCY, cleanUrls.length) }, worker)
  )

  // Dedupe across feeds by normalized title AND by normalized link.
  const seenTitles = new Set<string>()
  const seenLinks = new Set<string>()
  const deduped: DigestItem[] = []
  for (const item of allItems) {
    const t = normalizeTitle(item.title)
    const l = item.link ? normalizeLink(item.link) : ''
    if ((t && seenTitles.has(t)) || (l && seenLinks.has(l))) continue
    if (t) seenTitles.add(t)
    if (l) seenLinks.add(l)
    deduped.push(item)
  }
  // Newest first; unknown-date items sort to the end, still flagged.
  deduped.sort((a, b) => {
    if (a.dateUnknown && b.dateUnknown) return 0
    if (a.dateUnknown) return 1
    if (b.dateUnknown) return -1
    return (b.date as string).localeCompare(a.date as string)
  })

  // Order statuses to match the request order for a stable UI.
  const byUrl = new Map(statuses.map((s) => [s.url, s]))
  const ordered = cleanUrls.map(
    (u) =>
      byUrl.get(u) ?? { url: u, ok: false, itemCount: 0, error: 'not attempted' }
  )

  const pageResults = await pagesPromise

  return NextResponse.json({
    results: ordered,
    items: deduped,
    pageResults,
    sinceDays: days,
    elapsedMs: Date.now() - startedAt,
  })
}
