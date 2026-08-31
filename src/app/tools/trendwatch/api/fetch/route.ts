import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Server-side feed fetcher for the trend digest tool. Exists because browsers
// cannot fetch cross-origin RSS directly (CORS). Fetches every requested feed
// in parallel under a hard time budget so the handler finishes well inside the
// shortest common serverless function limit, whatever plan tier this deploys
// to. One bad feed must never fail the request - per-feed results carry their
// own ok/error.

export const runtime = 'nodejs'

const FEED_TIMEOUT_MS = 6000
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
  const { urls, sinceDays } = (body ?? {}) as {
    urls?: unknown
    sinceDays?: unknown
  }
  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json(
      { error: 'urls must be a non-empty array' },
      { status: 400 }
    )
  }
  const cleanUrls = urls
    .filter((u): u is string => typeof u === 'string')
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u))
    .slice(0, MAX_FEEDS)
  if (cleanUrls.length === 0) {
    return NextResponse.json(
      { error: 'no valid http(s) urls supplied' },
      { status: 400 }
    )
  }
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

  return NextResponse.json({
    results: ordered,
    items: deduped,
    sinceDays: days,
    elapsedMs: Date.now() - startedAt,
  })
}
