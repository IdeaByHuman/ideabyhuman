import { NextResponse } from 'next/server'
import Parser from 'rss-parser'

// Feed resolution for user-typed input. The user types "later.com"; the tool
// does the discovery work: scheme guessing, <link rel="alternate"> in the
// page head, then common feed paths. Server-side because every step is a
// cross-origin fetch. Bounded: 6s per attempt, a hard attempt cap, and a
// global deadline, so a dead domain cannot hang the request.

export const runtime = 'nodejs'

const ATTEMPT_TIMEOUT_MS = 6000
const GLOBAL_BUDGET_MS = 25000
const MAX_ATTEMPTS = 12
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const COMMON_PATHS = [
  '/feed',
  '/rss',
  '/feed/',
  '/rss.xml',
  '/feed.xml',
  '/atom.xml',
  '/index.xml',
  '/blog/feed',
]

const NO_FEED_MESSAGE =
  'This site does not appear to publish an RSS feed - many sites no longer do.'

const parser = new Parser()

function pathSegments(u: string): string[] {
  try {
    const url = new URL(/^https?:\/\//i.test(u) ? u : `https://${u}`)
    return url.pathname.split('/').filter(Boolean)
  } catch {
    return []
  }
}

// Deep-page inputs get an honest answer instead of a quiet substitution: a
// single evergreen article usually declares the SITE-WIDE feed in its head,
// and silently adding that delivers the whole marketing blog when the user
// asked about one page. Rule: typed path of 2+ segments resolving to a feed
// nearer the site root is site-level - offer it, do not auto-add.
function isSiteLevelFeed(typedInput: string, feedUrl: string): boolean {
  const typed = pathSegments(typedInput)
  if (typed.length < 2) return false
  const feed = pathSegments(feedUrl)
  const feedDir =
    feed.length > 0 && feed[feed.length - 1].includes('.')
      ? feed.length - 1 // strip the filename (rss.xml, feed.xml)
      : feed.length
  return typed.length > feedDir
}

type Attempt = {
  remaining: () => number
  count: { n: number }
}

async function fetchText(
  url: string,
  a: Attempt
): Promise<{ ok: boolean; text: string; finalUrl: string } | null> {
  if (a.count.n >= MAX_ATTEMPTS || a.remaining() < 800) return null
  a.count.n++
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': USER_AGENT,
        accept:
          'application/rss+xml, application/atom+xml, application/xml, text/xml, text/html, */*;q=0.8',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(Math.min(ATTEMPT_TIMEOUT_MS, a.remaining())),
      cache: 'no-store',
    })
    if (!res.ok) return null
    const text = await res.text()
    return { ok: true, text, finalUrl: res.url || url }
  } catch {
    return null
  }
}

async function parsesAsFeed(text: string): Promise<{ title: string } | null> {
  try {
    const feed = await parser.parseString(text)
    // A parseable document with an items array is a feed; HTML never parses.
    if (!Array.isArray(feed.items)) return null
    return { title: (feed.title ?? '').trim() }
  } catch {
    return null
  }
}

function headFeedLinks(html: string, baseUrl: string): string[] {
  // <link rel="alternate" type="application/rss+xml" href="..."> and the
  // atom+xml equivalent, head-ish region only, relative hrefs resolved
  // against the page URL.
  const head = html.slice(0, 200_000)
  const links: string[] = []
  const linkTags = head.match(/<link\b[^>]*>/gi) ?? []
  for (const tag of linkTags) {
    if (!/rel=["']?alternate["']?/i.test(tag)) continue
    if (!/type=["']?application\/(rss|atom)\+xml["']?/i.test(tag)) continue
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1]
    if (!href) continue
    try {
      links.push(new URL(href, baseUrl).toString())
    } catch {
      // unresolvable href - skip
    }
  }
  return links.slice(0, 3)
}

export async function POST(request: Request) {
  const startedAt = Date.now()
  const attempt: Attempt = {
    remaining: () => startedAt + GLOBAL_BUDGET_MS - Date.now(),
    count: { n: 0 },
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }
  const input = String((body as { input?: unknown })?.input ?? '').trim()
  if (!input) {
    return NextResponse.json({ error: 'input is required' }, { status: 400 })
  }
  if (/\s/.test(input)) {
    return NextResponse.json({
      ok: false,
      message: 'That does not look like a web address.',
    })
  }

  // No scheme: try https first, then http.
  const bases = /^https?:\/\//i.test(input)
    ? [input]
    : [`https://${input}`, `http://${input}`]

  for (const base of bases) {
    let baseUrl: URL
    try {
      baseUrl = new URL(base)
    } catch {
      continue
    }
    const page = await fetchText(baseUrl.toString(), attempt)
    if (page) {
      // 1) The typed URL is itself a feed.
      const direct = await parsesAsFeed(page.text)
      if (direct) {
        // The typed URL parsed as a feed itself - by definition the feed FOR
        // what she typed, never site-level.
        return NextResponse.json({
          ok: true,
          feedUrl: page.finalUrl,
          title: direct.title,
          resolvedFrom: input,
          siteLevel: false,
        })
      }
      // 2) HTML page - follow its advertised feed links.
      for (const link of headFeedLinks(page.text, page.finalUrl)) {
        const candidate = await fetchText(link, attempt)
        if (!candidate) continue
        const feed = await parsesAsFeed(candidate.text)
        if (feed) {
          return NextResponse.json({
            ok: true,
            feedUrl: candidate.finalUrl,
            title: feed.title,
            resolvedFrom: input,
            siteLevel: isSiteLevelFeed(input, candidate.finalUrl),
          })
        }
      }
    }
    // 3) Common feed paths against the site origin.
    for (const path of COMMON_PATHS) {
      const candidate = await fetchText(new URL(path, baseUrl).toString(), attempt)
      if (!candidate) continue
      const feed = await parsesAsFeed(candidate.text)
      if (feed) {
        return NextResponse.json({
          ok: true,
          feedUrl: candidate.finalUrl,
          title: feed.title,
          resolvedFrom: input,
          siteLevel: isSiteLevelFeed(input, candidate.finalUrl),
        })
      }
    }
    // Only fall through to the http:// base when https produced NOTHING
    // fetchable at all; if the site answered over https without a feed,
    // trying http would just repeat the same misses.
    if (page) break
  }

  return NextResponse.json({ ok: false, message: NO_FEED_MESSAGE })
}
