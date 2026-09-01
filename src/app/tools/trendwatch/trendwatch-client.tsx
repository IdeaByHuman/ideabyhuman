'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  MessageSquare,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

// Trend digest tool, two-stage flow:
//   TOPIC sources (mental health and psychology publications) supply
//   vocabulary - their items become suggested filter terms, never results.
//   TARGET sources (internet culture and social media publications) supply
//   the items actually shown and copied.
// Keywords from topic items filter target items. Sources and preferences
// persist in localStorage only - no backend storage by design. The API route
// exists solely to get around CORS. No AI calls here: the tool gathers and
// formats, something else does the thinking.

type Group = 'topic' | 'target'
type Kind = 'feed' | 'page'

type Source = {
  id: string
  label: string
  url: string
  enabled: boolean
  group: Group
  kind: Kind
}

type PageResult = {
  url: string
  ok: boolean
  title: string
  headings: string[]
  contentHash: string
  extractedFrom: 'article' | 'main' | 'body'
  error: string | null
}

type PageReport = PageResult & {
  status: 'first' | 'unchanged' | 'changed' | 'error'
  newHeadings: string[]
}

type WatchBaseline = Record<
  string,
  { hash: string; headings: string[]; checkedAt: string }
>

type FeedResult = {
  url: string
  ok: boolean
  itemCount: number
  error: string | null
}

type DigestItem = {
  title: string
  link: string
  sourceUrl: string
  date: string | null
  dateUnknown: boolean
  description: string
}

type Prefs = {
  filter: string
  compact: boolean
  itemCap: number // 0 means All
  collapsed: string[]
}

const STORAGE_KEY = 'ibh-trendwatch-sources-v1'
const PREFS_KEY = 'ibh-trendwatch-prefs-v1'
const WATCH_KEY = 'ibh-trendwatch-watch-v1'
const CHIP_LIMIT = 20
const MAX_WATCHED_PAGES = 10

const DEFAULT_PREFS: Prefs = { filter: '', compact: true, itemCap: 5, collapsed: [] }

const DEFAULT_SOURCES: Omit<Source, 'id' | 'kind'>[] = [
  // TOPIC - vocabulary suppliers.
  // ScienceDaily publishes ~4 items/month and Mental Health America's feed is
  // currently stale; both parse correctly and legitimately show 0 items on
  // short lookbacks. They stay.
  { group: 'topic', label: 'Psychology Today', url: 'https://www.psychologytoday.com/us/front/feed', enabled: true },
  { group: 'topic', label: 'PsyPost', url: 'https://www.psypost.org/feed/', enabled: true },
  { group: 'topic', label: 'ScienceDaily Mental Health', url: 'https://www.sciencedaily.com/rss/mind_brain/mental_health.xml', enabled: true },
  { group: 'topic', label: 'Mental Health America', url: 'https://mhanational.org/blog/feed/', enabled: true },
  // reddit rate-limits back-to-back requests from one IP; both ship disabled.
  { group: 'topic', label: 'r/mentalhealth', url: 'https://www.reddit.com/r/mentalhealth/new/.rss', enabled: false },
  { group: 'topic', label: 'r/therapy', url: 'https://www.reddit.com/r/therapy/new/.rss', enabled: false },
  // TARGET - the items she actually reads.
  { group: 'target', label: 'Know Your Meme', url: 'https://knowyourmeme.com/newsfeed.rss', enabled: true },
  { group: 'target', label: 'Dexerto Entertainment', url: 'https://www.dexerto.com/entertainment/feed/', enabled: true },
  { group: 'target', label: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/', enabled: true },
  { group: 'target', label: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/', enabled: true },
  { group: 'target', label: 'Sprout Social', url: 'https://sproutsocial.com/insights/feed/', enabled: true },
  { group: 'target', label: 'Hootsuite Blog', url: 'https://blog.hootsuite.com/feed/', enabled: true },
  { group: 'target', label: 'Buffer Blog', url: 'https://buffer.com/resources/rss/', enabled: true },
  { group: 'target', label: 'Influencer Marketing Hub', url: 'https://influencermarketinghub.com/feed/', enabled: true },
  { group: 'target', label: 'Google Trends US', url: 'https://trends.google.com/trending/rss?geo=US', enabled: true },
  { group: 'target', label: 'New Engen', url: 'https://newengen.com/feed.xml', enabled: true },
]

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function coerceGroup(g: unknown): Group {
  // Anything without an explicit topic marking defaults to target - applies
  // to imports and to source lists stored by earlier versions of this tool.
  return g === 'topic' ? 'topic' : 'target'
}

function coerceKind(k: unknown): Kind {
  // Sources without a kind (older stored lists, older exports) are feeds.
  return k === 'page' ? 'page' : 'feed'
}

function defaultsWithIds(): Source[] {
  return DEFAULT_SOURCES.map((s) => ({ ...s, id: newId(), kind: 'feed' as Kind }))
}

function loadSources(): Source[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultsWithIds()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultsWithIds()
    const cleaned = parsed
      .filter(
        (s): s is Source =>
          !!s &&
          typeof s === 'object' &&
          typeof (s as Source).url === 'string' &&
          typeof (s as Source).label === 'string'
      )
      .map((s) => ({
        id: typeof s.id === 'string' ? s.id : newId(),
        label: s.label,
        url: s.url,
        enabled: s.enabled !== false,
        group: coerceGroup((s as { group?: unknown }).group),
        kind: coerceKind((s as { kind?: unknown }).kind),
      }))
    return cleaned.length > 0 ? cleaned : defaultsWithIds()
  } catch {
    return defaultsWithIds()
  }
}

function loadWatchBaselines(): WatchBaseline {
  try {
    const raw = window.localStorage.getItem(WATCH_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as WatchBaseline
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function loadPrefs(): Prefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_PREFS
    const p = JSON.parse(raw) as Partial<Prefs>
    return {
      filter: typeof p.filter === 'string' ? p.filter : '',
      compact: p.compact !== false,
      itemCap: typeof p.itemCap === 'number' ? p.itemCap : 5,
      collapsed: Array.isArray(p.collapsed)
        ? p.collapsed.filter((c): c is string => typeof c === 'string')
        : [],
    }
  } catch {
    return DEFAULT_PREFS
  }
}

function parseFilterTerms(filter: string): string[] {
  return filter
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t.length > 0)
}

// Common English stopwords (~100) plus feed boilerplate that would otherwise
// dominate the suggested terms ("submitted by /u/..." appears in every reddit
// item). Purely mechanical - no scoring cleverness.
const STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'also', 'am', 'an',
  'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being',
  'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do', 'does',
  'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had',
  'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'him', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'like', 'me',
  'more', 'most', 'my', 'no', 'nor', 'not', 'now', 'of', 'off', 'on', 'once',
  'only', 'or', 'other', 'our', 'out', 'over', 'own', 'same', 'she', 'should',
  'so', 'some', 'such', 'than', 'that', 'the', 'their', 'them', 'then',
  'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under',
  'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'while', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
  'yours', 'onto', 'upon', 'still', 'even', 'ever',
  'much', 'many', 'every', 'really', 'thing', 'things', 'youre', 'dont',
  'cant', 'wont', 'didnt', 'doesnt', 'thats', 'whats', 'submitted', 'comments',
  'https', 'href', 'nbsp',
])

function extractCommonTerms(items: DigestItem[], limit: number): string[] {
  // Frequency across all occurrences, gated on appearing in at least 2
  // distinct items so a single verbose post cannot dominate. Words and
  // two-word bigrams both count; bigrams are usually the valuable ones.
  const freq = new Map<string, number>()
  const itemCount = new Map<string, number>()
  const good = (t: string) =>
    t.length >= 4 && !STOPWORDS.has(t) && !/^\d+$/.test(t)
  for (const item of items) {
    const tokens = (item.title + ' ' + item.description)
      .toLowerCase()
      // WordPress feeds append "The post X appeared first on Y." to every
      // description - without this, "appeared first" and the blog's own name
      // top the suggestions. Term extraction only; the digest keeps the raw text.
      .replace(/the post .{0,120}?appeared first on [^.]*\.?/g, ' ')
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
    const inThisItem = new Set<string>()
    for (let i = 0; i < tokens.length; i++) {
      const w = tokens[i]
      if (good(w)) {
        freq.set(w, (freq.get(w) ?? 0) + 1)
        inThisItem.add(w)
      }
      if (i + 1 < tokens.length && good(w) && good(tokens[i + 1])) {
        const bg = w + ' ' + tokens[i + 1]
        freq.set(bg, (freq.get(bg) ?? 0) + 1)
        inThisItem.add(bg)
      }
    }
    for (const t of inThisItem) {
      itemCount.set(t, (itemCount.get(t) ?? 0) + 1)
    }
  }
  return Array.from(freq.entries())
    .filter(([t]) => (itemCount.get(t) ?? 0) >= 2)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([t]) => t)
}

export default function TrendwatchClient() {
  const [sources, setSources] = useState<Source[] | null>(null)
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [sinceDays, setSinceDays] = useState<number>(7)
  const [fetching, setFetching] = useState(false)
  const [results, setResults] = useState<FeedResult[] | null>(null)
  const [items, setItems] = useState<DigestItem[]>([])
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null)
  const [elapsedMs, setElapsedMs] = useState<number | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [pageReports, setPageReports] = useState<PageReport[]>([])
  const [watchBase, setWatchBase] = useState<WatchBaseline | null>(null)
  const importRef = useRef<HTMLInputElement>(null)

  // localStorage is browser-only - hydrate after mount.
  useEffect(() => {
    setSources(loadSources())
    setPrefs(loadPrefs())
    setWatchBase(loadWatchBaselines())
  }, [])

  useEffect(() => {
    if (watchBase !== null) {
      try {
        window.localStorage.setItem(WATCH_KEY, JSON.stringify(watchBase))
      } catch {
        // Storage full or blocked - change detection degrades, page still works.
      }
    }
  }, [watchBase])

  useEffect(() => {
    if (sources !== null) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sources))
      } catch {
        // Storage full or blocked - the page still works for this visit.
      }
    }
  }, [sources])

  useEffect(() => {
    if (prefs !== null) {
      try {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
      } catch {
        // Same as above.
      }
    }
  }, [prefs])

  const filter = prefs?.filter ?? ''
  const compact = prefs?.compact ?? true
  const itemCap = prefs?.itemCap ?? 5
  const collapsed = useMemo(() => new Set(prefs?.collapsed ?? []), [prefs])

  function patchPrefs(patch: Partial<Prefs>) {
    setPrefs((prev) => ({ ...(prev ?? DEFAULT_PREFS), ...patch }))
  }

  const labelFor = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of sources ?? []) m.set(s.url, s.label)
    return (url: string) => m.get(url) ?? url
  }, [sources])

  const groupFor = useMemo(() => {
    const m = new Map<string, Group>()
    for (const s of sources ?? []) m.set(s.url.trim(), s.group)
    return (url: string) => m.get(url) ?? 'target'
  }, [sources])

  function update(id: string, patch: Partial<Source>) {
    setSources((prev) =>
      (prev ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  // ── Add-with-resolution: the user types anything ("later.com"), the server
  // does the discovery. Validation happens on ADD, never per keystroke.
  const [addInput, setAddInput] = useState<Record<Group, string>>({ topic: '', target: '' })
  const [resolving, setResolving] = useState<Group | null>(null)
  // Site-level feed found for a deep-path input, or no feed found at all -
  // both become an explicit choice instead of a silent outcome.
  const [pending, setPending] = useState<{
    group: Group
    typed: string
    feedUrl: string | null // null = no feed found; watch is the only offer
    feedTitle: string
  } | null>(null)

  function normalizeTypedUrl(typed: string): string {
    return /^https?:\/\//i.test(typed) ? typed : `https://${typed}`
  }

  function watchedPageCount(): number {
    return (sources ?? []).filter((s) => s.kind === 'page').length
  }

  function addResolvedFeed(group: Group, feedUrl: string, title: string) {
    const host = (() => {
      try {
        return new URL(feedUrl).hostname.replace(/^www\./, '')
      } catch {
        return feedUrl
      }
    })()
    setSources((prev) => [
      ...(prev ?? []),
      { id: newId(), label: title || host, url: feedUrl, enabled: true, group, kind: 'feed' },
    ])
  }

  function addWatchedPage(group: Group, typed: string) {
    if (watchedPageCount() >= MAX_WATCHED_PAGES) {
      setNotice(`Watched pages are capped at ${MAX_WATCHED_PAGES} - remove one first.`)
      setPending(null)
      return
    }
    const url = normalizeTypedUrl(typed)
    const label = (() => {
      try {
        const u = new URL(url)
        const tail = u.pathname.split('/').filter(Boolean).pop()
        return tail
          ? `${u.hostname.replace(/^www\./, '')} - ${tail.replace(/[-_]/g, ' ')}`
          : u.hostname.replace(/^www\./, '')
      } catch {
        return typed
      }
    })()
    setSources((prev) => [
      ...(prev ?? []),
      { id: newId(), label, url, enabled: true, group, kind: 'page' },
    ])
    setNotice(`Watching ${url.replace(/^https?:\/\//, '')} - headings are checked for changes on each fetch.`)
    setPending(null)
    setAddInput((p) => ({ ...p, [group]: '' }))
  }

  async function resolveAndAdd(group: Group) {
    const input = addInput[group].trim()
    if (!input || resolving !== null) return
    setResolving(group)
    try {
      const res = await fetch('/tools/trendwatch/api/resolve', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ input }),
      })
      const data = (await res.json()) as {
        ok?: boolean
        feedUrl?: string
        title?: string
        siteLevel?: boolean
        message?: string
        error?: string
      }
      if (data.ok && data.feedUrl) {
        if (data.siteLevel) {
          // A deep page resolving to the site's root feed is NOT the feed for
          // that page. Offer, label honestly, make her choose - never auto-add.
          setPending({
            group,
            typed: input,
            feedUrl: data.feedUrl,
            feedTitle: data.title ?? '',
          })
        } else {
          addResolvedFeed(group, data.feedUrl, data.title ?? '')
          const display = data.feedUrl.replace(/^https?:\/\//, '')
          setNotice(data.feedUrl === input ? `Added ${display}` : `Found feed at ${display}`)
          setAddInput((p) => ({ ...p, [group]: '' }))
        }
      } else {
        // No feed anywhere - offer to watch the page instead when the input
        // is URL-shaped.
        const watchable = /^[^\s]+\.[^\s]{2,}/.test(input)
        if (watchable) {
          setPending({ group, typed: input, feedUrl: null, feedTitle: '' })
        } else {
          setNotice(data.message ?? data.error ?? 'No feed found.')
        }
      }
    } catch (e) {
      setNotice(`Could not check that address - ${(e as Error).message}`)
    } finally {
      setResolving(null)
    }
  }

  // ── Feedback panel state ───────────────────────────────────────────────────
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackStatus, setFeedbackStatus] = useState<
    { kind: 'idle' } | { kind: 'sending' } | { kind: 'sent' } | { kind: 'error'; message: string }
  >({ kind: 'idle' })

  async function sendFeedback() {
    const message = feedbackText.trim()
    if (!message || feedbackStatus.kind === 'sending') return
    setFeedbackStatus({ kind: 'sending' })
    try {
      const res = await fetch('/tools/trendwatch/api/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message,
          // The state is what makes "this didn't work" actionable - collected
          // automatically, nothing asked of the user.
          state: {
            sources: (sources ?? []).map(({ label, url, enabled, group }) => ({
              label, url, enabled, group,
            })),
            filter,
            lookbackDays: sinceDays,
            itemCap,
            lastFetch: (results ?? []).map((r) => ({
              source: labelFor(r.url), ok: r.ok, itemCount: r.itemCount, error: r.error,
            })),
            fetchedAt: fetchedAt ? fetchedAt.toISOString() : null,
          },
        }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null
      if (res.ok && data?.ok) {
        setFeedbackStatus({ kind: 'sent' })
        setFeedbackText('')
      } else {
        setFeedbackStatus({
          kind: 'error',
          message: data?.error ?? `Send failed - HTTP ${res.status}`,
        })
      }
    } catch (e) {
      setFeedbackStatus({ kind: 'error', message: `Send failed - ${(e as Error).message}` })
    }
  }

  function removeSource(id: string) {
    setSources((prev) => (prev ?? []).filter((s) => s.id !== id))
  }

  function resetDefaults() {
    if (window.confirm('Replace the current source list and preferences with the defaults?')) {
      setSources(defaultsWithIds())
      setPrefs({ ...DEFAULT_PREFS })
      setWatchBase({})
      setPageReports([])
      setNotice('Source list and preferences reset to defaults.')
    }
  }

  function exportJson() {
    const data = JSON.stringify(
      {
        sources: (sources ?? []).map(({ label, url, enabled, group, kind }) => ({
          label,
          url,
          enabled,
          group,
          kind,
        })),
        filter,
        display: { compact, itemCap },
        // Watched-page baselines travel with the setup so change detection
        // survives a hand-off or a reset+import round trip.
        watch: watchBase ?? {},
      },
      null,
      2
    )
    const blob = new Blob([data], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'trendwatch-sources.json'
    a.click()
    URL.revokeObjectURL(a.href)
    setNotice('Exported trendwatch-sources.json.')
  }

  function importJson(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        // Accept both shapes: the current { sources, filter, display } object
        // and the original bare-array export.
        const rawList: unknown = Array.isArray(parsed)
          ? parsed
          : (parsed as { sources?: unknown })?.sources
        if (!Array.isArray(rawList)) throw new Error('no sources found in file')
        const imported: Source[] = rawList
          .filter(
            (s): s is { label?: string; url?: string; enabled?: boolean; group?: unknown } =>
              !!s && typeof s === 'object' && typeof (s as { url?: unknown }).url === 'string'
          )
          .map((s) => ({
            id: newId(),
            label: typeof s.label === 'string' ? s.label : (s.url as string),
            url: s.url as string,
            enabled: s.enabled !== false,
            group: coerceGroup(s.group),
            kind: coerceKind((s as { kind?: unknown }).kind),
          }))
        if (imported.length === 0) throw new Error('no sources found in file')
        setSources(imported)
        if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
          const obj = parsed as {
            filter?: unknown
            display?: { compact?: unknown; itemCap?: unknown }
            watch?: unknown
          }
          if (obj.watch && typeof obj.watch === 'object') {
            setWatchBase(obj.watch as WatchBaseline)
          }
          patchPrefs({
            ...(typeof obj.filter === 'string' ? { filter: obj.filter } : {}),
            ...(typeof obj.display?.compact === 'boolean'
              ? { compact: obj.display.compact }
              : {}),
            ...(typeof obj.display?.itemCap === 'number'
              ? { itemCap: obj.display.itemCap }
              : {}),
          })
        }
        setNotice(`Imported ${imported.length} sources.`)
      } catch (e) {
        setNotice(`Import failed - ${(e as Error).message}`)
      }
    }
    reader.readAsText(file)
  }

  async function fetchLatest() {
    const enabled = (sources ?? []).filter(
      (s) => s.enabled && /^https?:\/\//i.test(s.url.trim())
    )
    const feedUrls = enabled.filter((s) => s.kind === 'feed').map((s) => s.url.trim())
    const pageUrls = enabled
      .filter((s) => s.kind === 'page')
      .map((s) => s.url.trim())
      .slice(0, MAX_WATCHED_PAGES)
    if (feedUrls.length === 0 && pageUrls.length === 0) {
      setFetchError('No enabled sources with a valid http(s) URL.')
      return
    }
    setFetching(true)
    setFetchError(null)
    setCopied(false)
    try {
      const res = await fetch('/tools/trendwatch/api/fetch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ urls: feedUrls, pages: pageUrls, sinceDays }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as {
        results: FeedResult[]
        items: DigestItem[]
        pageResults?: PageResult[]
        elapsedMs: number
      }
      setResults(data.results)
      setItems(data.items)
      setElapsedMs(data.elapsedMs)
      setFetchedAt(new Date())

      // Change detection for watched pages: compare against the stored
      // baseline, surface what is NEW, then advance the baseline.
      const base = watchBase ?? {}
      const nextBase: WatchBaseline = { ...base }
      const reports: PageReport[] = (data.pageResults ?? []).map((p) => {
        if (!p.ok) return { ...p, status: 'error' as const, newHeadings: [] }
        const prev = base[p.url]
        let status: PageReport['status']
        let newHeadings: string[] = []
        if (!prev) {
          status = 'first'
        } else if (prev.hash === p.contentHash) {
          status = 'unchanged'
        } else {
          status = 'changed'
          const prevSet = new Set(prev.headings.map((h) => h.toLowerCase()))
          newHeadings = p.headings.filter((h) => !prevSet.has(h.toLowerCase()))
        }
        nextBase[p.url] = {
          hash: p.contentHash,
          headings: p.headings,
          checkedAt: new Date().toISOString(),
        }
        return { ...p, status, newHeadings }
      })
      setPageReports(reports)
      setWatchBase(nextBase)
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setFetching(false)
    }
  }

  // ── Stage 1: topic items supply vocabulary ─────────────────────────────────
  const topicItems = useMemo(
    () => items.filter((i) => groupFor(i.sourceUrl) === 'topic'),
    [items, groupFor]
  )
  const targetItems = useMemo(
    () => items.filter((i) => groupFor(i.sourceUrl) === 'target'),
    [items, groupFor]
  )

  // Chips derive ONLY from topic sources. Recomputes per fetch (and on group
  // reassignment), never per keystroke.
  const commonTerms = useMemo(
    () => extractCommonTerms(topicItems, CHIP_LIMIT),
    [topicItems]
  )
  const activeTerms = useMemo(() => new Set(parseFilterTerms(filter)), [filter])

  function toggleTerm(term: string) {
    const terms = parseFilterTerms(filter)
    const next = terms.includes(term)
      ? terms.filter((t) => t !== term)
      : [...terms, term]
    patchPrefs({ filter: next.join(', ') })
  }

  // ── Stage 2: filter applies ONLY to target items ───────────────────────────
  // Pipeline: fetch -> keyword filter -> per-source cap. Capping before
  // filtering would throw away matches, so the order is load-bearing.
  const filteredTargets = useMemo(() => {
    const terms = parseFilterTerms(filter)
    if (terms.length === 0) return targetItems
    return targetItems.filter((item) => {
      const hay = (item.title + ' ' + item.description).toLowerCase()
      return terms.some((t) => hay.includes(t))
    })
  }, [targetItems, filter])

  const cappedGroups = useMemo(() => {
    const groups = new Map<string, DigestItem[]>()
    for (const item of filteredTargets) {
      const list = groups.get(item.sourceUrl) ?? []
      list.push(item)
      groups.set(item.sourceUrl, list)
    }
    // Items arrive globally sorted newest-first with unknown dates last, and
    // grouping preserves that order, so slicing keeps the most recent.
    return Array.from(groups.entries()).map(([url, group]) => ({
      url,
      total: group.length,
      visible: itemCap > 0 ? group.slice(0, itemCap) : group,
    }))
  }, [filteredTargets, itemCap])

  const visibleCount = useMemo(
    () => cappedGroups.reduce((n, g) => n + g.visible.length, 0),
    [cappedGroups]
  )
  const filterActive = parseFilterTerms(filter).length > 0

  const topicSourceCount = useMemo(
    () => new Set(topicItems.map((i) => i.sourceUrl)).size,
    [topicItems]
  )
  const targetSourceCount = useMemo(
    () => (results ?? []).filter((r) => groupFor(r.url) === 'target').length,
    [results, groupFor]
  )

  // Watched-page headings pass through the same keyword filter as feed item
  // titles. A page with no matching headings drops out of display and digest.
  const visiblePages = useMemo(() => {
    const terms = parseFilterTerms(filter)
    return pageReports
      .filter((p) => p.ok)
      .map((p) => ({
        ...p,
        visibleHeadings:
          terms.length === 0
            ? p.headings
            : p.headings.filter((h) =>
                terms.some((t) => h.toLowerCase().includes(t))
              ),
      }))
      .filter((p) => p.visibleHeadings.length > 0)
  }, [pageReports, filter])

  const digestText = useMemo(() => {
    if (visibleCount === 0 && visiblePages.length === 0) return ''
    const end = fetchedAt ?? new Date()
    const start = new Date(end.getTime() - sinceDays * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const lines: string[] = [
      `Trend digest - ${fmt(start)} to ${fmt(end)} - ${visibleCount} items from ${targetSourceCount} sources` +
        (visiblePages.length > 0
          ? ` - ${visiblePages.length} watched page${visiblePages.length === 1 ? '' : 's'}`
          : ''),
    ]
    const terms = parseFilterTerms(filter)
    if (terms.length > 0) lines.push(`Filtered on: ${terms.join(', ')}`)
    lines.push('')
    // Target items only. The digest matches what is on screen (filter + cap
    // applied), with two deliberate exceptions - compact mode and collapsed
    // sections are display-only. The digest always carries descriptions and
    // every source: it is input for analysis elsewhere, and the descriptions
    // are the substance.
    for (const g of cappedGroups) {
      if (g.visible.length === 0) continue
      lines.push(`=== ${labelFor(g.url)} ===`)
      for (const item of g.visible) {
        lines.push(`- ${item.title}`)
        const when = item.dateUnknown
          ? 'date unknown'
          : new Date(item.date as string).toISOString().slice(0, 10)
        lines.push(`  ${when} | ${item.link}`)
        if (item.description) lines.push(`  ${item.description}`)
      }
      lines.push('')
    }
    // Watched pages: title, URL, headings with new ones flagged - high-value
    // context for downstream analysis.
    for (const p of visiblePages) {
      const newSet = new Set(p.newHeadings.map((h) => h.toLowerCase()))
      lines.push(`=== Watched: ${p.title || labelFor(p.url)} ===`)
      lines.push(p.url)
      if (p.status === 'unchanged') lines.push('(no change since last check)')
      if (p.status === 'first') lines.push('(first check - no baseline yet)')
      for (const h of p.visibleHeadings) {
        lines.push(`- ${h}${newSet.has(h.toLowerCase()) ? ' [NEW]' : ''}`)
      }
      lines.push('')
    }
    return lines.join('\n').trimEnd() + '\n'
  }, [cappedGroups, visibleCount, targetSourceCount, sinceDays, fetchedAt, labelFor, filter, visiblePages])

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(digestText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setNotice('Clipboard blocked - use the digest text preview below to copy manually.')
    }
  }

  function toggleCollapsed(url: string) {
    const next = new Set(collapsed)
    if (next.has(url)) next.delete(url)
    else next.add(url)
    patchPrefs({ collapsed: Array.from(next) })
  }

  // Contrast notes (WCAG AA, measured not guessed): primary buttons are white
  // on #5c4620 (8.9:1), status green #3d6332 (6.5:1) and red #9a3a24 (6.5:1)
  // on the page background, placeholders forced to full-opacity #6e6455
  // (5.8:1 on white) because the framework default renders them at 50%
  // opacity. color-scheme:light pins native controls in dark-mode browsers.
  const inputCls =
    'rounded-md border border-[#c9bda9] bg-white px-2.5 py-1.5 text-sm text-[#2a2620] outline-none placeholder:text-[#6e6455] placeholder:opacity-100 focus:border-[#8a6d3b]'
  const btnCls =
    'inline-flex items-center gap-1.5 rounded-md border border-[#c9bda9] bg-white px-3 py-1.5 text-sm font-medium text-[#2a2620] hover:bg-[#f3ede2] disabled:opacity-60'
  const primaryBtnCls =
    'inline-flex items-center gap-1.5 rounded-md border border-[#5c4620] bg-[#5c4620] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4a3819] disabled:opacity-70'

  function sourceRows(group: Group, heading: string, sub: string) {
    const list = (sources ?? []).filter((s) => s.group === group)
    return (
      <div className="mt-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[#4a443a]">
          {heading}
        </h3>
        <p className="text-xs text-[#6e6455]">{sub}</p>
        <ul className="mt-2 space-y-2">
          {list.map((s) => (
            <li key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={s.enabled}
                onChange={(e) => update(s.id, { enabled: e.target.checked })}
                className="h-4 w-4 accent-[#5c4620]"
                title={s.enabled ? 'Enabled' : 'Disabled'}
              />
              <input
                className={`${inputCls} w-44 shrink-0`}
                value={s.label}
                placeholder="Label"
                onChange={(e) => update(s.id, { label: e.target.value })}
              />
              <input
                className={`${inputCls} min-w-0 flex-1`}
                value={s.url}
                placeholder="https://example.com/feed.xml"
                onChange={(e) => update(s.id, { url: e.target.value })}
              />
              <select
                className={`${inputCls} shrink-0`}
                value={s.group}
                title="Topic sources supply filter vocabulary; target sources supply the items shown"
                onChange={(e) => update(s.id, { group: coerceGroup(e.target.value) })}
              >
                <option value="topic">Topic</option>
                <option value="target">Target</option>
              </select>
              <button
                type="button"
                className="rounded-md p-1.5 text-[#7a4636] hover:bg-[#f3e5df]"
                onClick={() => removeSource(s.id)}
                title="Remove source"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex items-center gap-2">
          <input
            className={`${inputCls} min-w-0 flex-1`}
            value={addInput[group]}
            placeholder="Add a site or feed URL - e.g. example.com"
            onChange={(e) => setAddInput((p) => ({ ...p, [group]: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') resolveAndAdd(group)
            }}
          />
          <button
            type="button"
            className={btnCls}
            onClick={() => resolveAndAdd(group)}
            disabled={resolving !== null || !addInput[group].trim()}
          >
            {resolving === group ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <Plus size={14} />
            )}
            {resolving === group ? 'Checking…' : 'Add'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <main
      className="min-h-screen bg-[#faf7f1] px-6 py-10 text-[#2a2620]"
      style={{ colorScheme: 'light' }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Trendwatch</h1>
        <p className="mt-1 text-sm text-[#6e6455]">
          Topic sources supply vocabulary - target sources supply the items.
          Fetch both, pick terms, copy the filtered digest into the AI
          assistant of your choice for analysis. Everything is saved in this
          browser only - export the JSON to share a setup.
        </p>

        {notice && (
          <p className="mt-4 rounded-md border border-[#e3d9c8] bg-[#f5efe3] px-3 py-2 text-sm">
            {notice}
          </p>
        )}

        {pending && (
          <div className="mt-4 rounded-md border border-[#d9c9a8] bg-[#f5efe3] px-3 py-2.5 text-sm text-[#2a2620]">
            {pending.feedUrl ? (
              <p>
                <span className="font-medium">{pending.typed}</span> does not
                publish its own feed. The site-wide feed at{' '}
                <span className="font-medium">
                  {pending.feedUrl.replace(/^https?:\/\//, '')}
                </span>{' '}
                is available instead - it covers the whole site rather than
                this page. Add it anyway?
              </p>
            ) : (
              <p>
                No feed found for{' '}
                <span className="font-medium">{pending.typed}</span> - many
                sites no longer publish one. You can watch the page itself:
                its headings are captured on each fetch and changes are
                flagged.
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {pending.feedUrl && (
                <button
                  type="button"
                  className={btnCls}
                  onClick={() => {
                    addResolvedFeed(pending.group, pending.feedUrl as string, pending.feedTitle)
                    setNotice(`Added site-wide feed ${(pending.feedUrl as string).replace(/^https?:\/\//, '')}`)
                    setPending(null)
                    setAddInput((p) => ({ ...p, [pending.group]: '' }))
                  }}
                >
                  Add site feed anyway
                </button>
              )}
              <button
                type="button"
                className={primaryBtnCls}
                onClick={() => addWatchedPage(pending.group, pending.typed)}
              >
                Watch this page instead
              </button>
              <button
                type="button"
                className={btnCls}
                onClick={() => setPending(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* A. Sources */}
        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Sources</h2>
            <div className="flex gap-2">
              <button type="button" className={btnCls} onClick={exportJson} title="Download sources, filter, and display preferences as JSON">
                <Download size={14} /> Export JSON
              </button>
              <button type="button" className={btnCls} onClick={() => importRef.current?.click()} title="Load sources and preferences from JSON">
                <Upload size={14} /> Import JSON
              </button>
              <input
                ref={importRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) importJson(f)
                  e.target.value = ''
                }}
              />
              <button type="button" className={btnCls} onClick={resetDefaults}>
                <RotateCcw size={14} /> Reset to defaults
              </button>
            </div>
          </div>

          {sourceRows('topic', 'Topic sources', 'Vocabulary only - their items become suggested terms, never results.')}
          {sourceRows('target', 'Target sources', 'The items shown and copied, filtered by the terms.')}
        </section>

        {/* B. Fetch */}
        <section className="mt-10">
          <h2 className="text-lg font-medium">Fetch</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-[#6e6455]" htmlFor="lookback">
              Lookback
            </label>
            <select
              id="lookback"
              className={inputCls}
              value={sinceDays}
              onChange={(e) => setSinceDays(Number(e.target.value))}
            >
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
            <button
              type="button"
              className={primaryBtnCls}
              onClick={fetchLatest}
              disabled={fetching || sources === null}
            >
              <RefreshCw size={14} className={fetching ? 'animate-spin' : ''} />
              {fetching ? 'Fetching…' : 'Fetch latest'}
            </button>
            {elapsedMs !== null && !fetching && (
              <span className="text-xs text-[#6e6455]">
                fetched in {(elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="text-sm text-[#6e6455]" htmlFor="keyword-filter">
              Filter
            </label>
            <input
              id="keyword-filter"
              className={`${inputCls} min-w-0 flex-1`}
              value={filter}
              placeholder="Comma-separated terms - applies to target items only"
              onChange={(e) => patchPrefs({ filter: e.target.value })}
            />
          </div>

          {commonTerms.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-[#6e6455]">
                Topics from mental health sources
              </span>
              {commonTerms.map((term) => {
                const active = activeTerms.has(term)
                return (
                  <button
                    key={term}
                    type="button"
                    onClick={() => toggleTerm(term)}
                    title={active ? 'Remove from filter' : 'Add to filter'}
                    className={
                      active
                        ? 'rounded-full border border-[#5c4620] bg-[#5c4620] px-2.5 py-0.5 text-sm font-medium text-white hover:bg-[#4a3819]'
                        : 'rounded-full border border-[#c9bda9] bg-white px-2.5 py-0.5 text-sm text-[#4a443a] hover:bg-[#f3ede2]'
                    }
                  >
                    {term}
                  </button>
                )
              })}
            </div>
          )}

          {fetchError && (
            <p className="mt-3 rounded-md border border-[#c99b8f] bg-[#f7e9e5] px-3 py-2 text-sm font-medium text-[#8f3520]">
              Fetch failed - {fetchError}
            </p>
          )}

          {(results || pageReports.length > 0) && (
            <ul className="mt-4 space-y-1">
              {(results ?? []).map((r) => (
                <li key={r.url} className="flex items-baseline gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${r.ok ? 'bg-[#3d6332]' : 'bg-[#9a3a24]'}`}
                  />
                  <span className="font-medium">{labelFor(r.url)}</span>
                  <span className="text-xs uppercase text-[#6e6455]">
                    {groupFor(r.url)}
                  </span>
                  {r.ok ? (
                    <span className="text-[#3d6332]">
                      {r.itemCount} item{r.itemCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="font-medium text-[#9a3a24]">failed - {r.error}</span>
                  )}
                </li>
              ))}
              {pageReports.map((p) => (
                <li key={p.url} className="flex items-baseline gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${p.ok ? 'bg-[#3d6332]' : 'bg-[#9a3a24]'}`}
                  />
                  <span className="font-medium">{p.title || labelFor(p.url)}</span>
                  <span className="text-xs uppercase text-[#6e6455]">watched page</span>
                  {p.ok ? (
                    <span className="text-[#3d6332]">
                      {p.headings.length} heading{p.headings.length === 1 ? '' : 's'}
                      {p.status === 'changed' && ` - ${p.newHeadings.length} new`}
                      {p.status === 'unchanged' && ' - no change'}
                      {p.status === 'first' && ' - first check'}
                    </span>
                  ) : (
                    <span className="font-medium text-[#9a3a24]">failed - {p.error}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* C. Digest */}
        <section className="mt-10 pb-16">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Digest</h2>
            {(targetItems.length > 0 || pageReports.length > 0) && (
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm text-[#4a443a]">
                  <input
                    type="checkbox"
                    checked={compact}
                    onChange={(e) => patchPrefs({ compact: e.target.checked })}
                    className="h-4 w-4 accent-[#5c4620]"
                  />
                  Compact
                </label>
                <label className="flex items-center gap-1.5 text-sm text-[#4a443a]">
                  Per source
                  <select
                    className={inputCls}
                    value={itemCap}
                    onChange={(e) => patchPrefs({ itemCap: Number(e.target.value) })}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={0}>All</option>
                  </select>
                </label>
                <button
                  type="button"
                  className={btnCls}
                  onClick={() => patchPrefs({ collapsed: cappedGroups.map((g) => g.url) })}
                >
                  Collapse all
                </button>
                <button
                  type="button"
                  className={btnCls}
                  onClick={() => patchPrefs({ collapsed: [] })}
                >
                  Expand all
                </button>
                {(visibleCount > 0 || visiblePages.length > 0) && (
                  <button type="button" className={primaryBtnCls} onClick={copyDigest}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copied' : 'Copy digest'}
                  </button>
                )}
              </div>
            )}
          </div>

          {items.length > 0 && (
            <p className="mt-2 text-sm text-[#4a443a]">
              {commonTerms.length} topic{commonTerms.length === 1 ? '' : 's'} from{' '}
              {topicSourceCount} source{topicSourceCount === 1 ? '' : 's'} - showing{' '}
              {visibleCount} of {targetItems.length} item
              {targetItems.length === 1 ? '' : 's'} from {targetSourceCount} source
              {targetSourceCount === 1 ? '' : 's'}
              {pageReports.length > 0 &&
                ` - ${pageReports.length} watched page${pageReports.length === 1 ? '' : 's'}`}
              {!filterActive && targetItems.length > 0 && ' - nothing is filtered yet'}
            </p>
          )}

          {/* Watched pages - their own visually distinct groups. Headings ARE
              the trends on a listicle; new ones since the last check are
              flagged. */}
          {visiblePages.length > 0 && (
            <div className="mt-4 space-y-4">
              {visiblePages.map((p) => {
                const newSet = new Set(p.newHeadings.map((h) => h.toLowerCase()))
                return (
                  <div
                    key={p.url}
                    className="rounded-lg border border-dashed border-[#b09a72] bg-[#f8f4ea] p-3"
                  >
                    <p className="text-sm font-semibold uppercase tracking-wide text-[#4a443a]">
                      <span className="mr-1.5 rounded bg-[#5c4620] px-1.5 py-0.5 text-xs font-medium normal-case text-white">
                        watched
                      </span>
                      {p.title || labelFor(p.url)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#6e6455]">
                      <a href={p.url} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                        {p.url.replace(/^https?:\/\//, '')}
                      </a>
                      {' · '}
                      {p.status === 'first' && 'first check - no baseline yet'}
                      {p.status === 'unchanged' && 'no change since last check'}
                      {p.status === 'changed' &&
                        `changed - ${p.newHeadings.length} new heading${p.newHeadings.length === 1 ? '' : 's'}`}
                      {' · '}extracted from {'<'}{p.extractedFrom}{'>'}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {p.visibleHeadings.map((h) => (
                        <li key={h} className="text-sm text-[#2a2620]">
                          {newSet.has(h.toLowerCase()) && (
                            <span className="mr-1.5 rounded bg-[#3d6332] px-1.5 py-0.5 text-xs font-medium text-white">
                              NEW
                            </span>
                          )}
                          {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}

          {items.length === 0 && pageReports.length === 0 ? (
            <p className="mt-3 text-sm text-[#6e6455]">
              {results
                ? 'No items in the selected window.'
                : 'Fetch to build a digest.'}
            </p>
          ) : targetItems.length === 0 && visiblePages.length === 0 && pageReports.length === 0 ? (
            <p className="mt-3 rounded-md border border-[#e3d9c8] bg-[#f5efe3] px-3 py-2 text-sm text-[#4a443a]">
              The fetch succeeded, but no target-source items are in the
              selected window. Topic items supply vocabulary only and are not
              shown here. Widen the lookback or enable more target sources.
            </p>
          ) : visibleCount === 0 && filterActive && visiblePages.length === 0 ? (
            <p className="mt-3 rounded-md border border-[#e3d9c8] bg-[#f5efe3] px-3 py-2 text-sm text-[#4a443a]">
              The fetch succeeded - {targetItems.length} target item
              {targetItems.length === 1 ? '' : 's'} retrieved - but none match
              the current filter. That is a real finding: mental health
              vocabulary and social media vocabulary overlap less than you
              would expect. Loosen or remove terms, or widen the lookback.
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-4">
                {cappedGroups.map((g) =>
                  g.visible.length === 0 ? null : (
                    <div key={g.url}>
                      <button
                        type="button"
                        onClick={() => toggleCollapsed(g.url)}
                        className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left text-sm font-semibold uppercase tracking-wide text-[#4a443a] hover:bg-[#f3ede2]"
                      >
                        {collapsed.has(g.url) ? (
                          <ChevronRight size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )}
                        {labelFor(g.url)}
                        <span className="font-normal normal-case text-[#6e6455]">
                          {g.visible.length < g.total
                            ? `showing ${g.visible.length} of ${g.total}`
                            : `${g.total} item${g.total === 1 ? '' : 's'}`}
                        </span>
                      </button>
                      {!collapsed.has(g.url) && (
                        <div className="mt-2 space-y-2">
                          {g.visible.map((item, i) => (
                            <article
                              key={`${item.link || item.title}-${i}`}
                              className={`rounded-lg border border-[#e3dccd] bg-white ${compact ? 'px-3 py-2' : 'p-3'}`}
                            >
                              <a
                                href={item.link || undefined}
                                target="_blank"
                                rel="noreferrer"
                                className="font-medium text-[#2a2620] underline decoration-[#b09a72] underline-offset-2 hover:decoration-[#5c4620]"
                              >
                                {item.title}
                              </a>
                              <p className="mt-0.5 text-xs text-[#6e6455]">
                                {labelFor(item.sourceUrl)}
                                {' · '}
                                {item.dateUnknown
                                  ? 'date unknown'
                                  : new Date(item.date as string).toLocaleDateString()}
                              </p>
                              {!compact && item.description && (
                                <p className="mt-1.5 text-sm leading-snug text-[#4a443a]">
                                  {item.description}
                                </p>
                              )}
                            </article>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>

              <details className="mt-6">
                <summary className="cursor-pointer text-sm text-[#6e6455]">
                  View digest as plain text
                </summary>
                <textarea
                  readOnly
                  value={digestText}
                  data-testid="digest-text"
                  className="mt-2 h-64 w-full rounded-md border border-[#e3dccd] bg-white p-3 font-mono text-xs"
                />
              </details>
            </>
          )}
        </section>
      </div>

      {/* Feedback - small, persistent, bottom-right. State rides along
          automatically; the only thing asked of the user is the note. */}
      <div className="fixed bottom-4 right-4 z-50">
        {feedbackOpen ? (
          <div className="w-80 rounded-lg border border-[#c9bda9] bg-white p-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-[#2a2620]">Send feedback</span>
              <button
                type="button"
                className="rounded-md p-1 text-[#4a443a] hover:bg-[#f3ede2]"
                onClick={() => {
                  setFeedbackOpen(false)
                  setFeedbackStatus({ kind: 'idle' })
                }}
                title="Close"
              >
                <X size={15} />
              </button>
            </div>
            <textarea
              className={`${inputCls} mt-2 h-28 w-full resize-none`}
              value={feedbackText}
              placeholder="What happened, or what would help?"
              onChange={(e) => setFeedbackText(e.target.value)}
            />
            <p className="mt-1 text-xs text-[#6e6455]">
              Your source list, filter, lookback, and last fetch results are
              included automatically so this is actionable.
            </p>
            {feedbackStatus.kind === 'sent' && (
              <p className="mt-2 rounded-md border border-[#a8c49b] bg-[#eef4ea] px-2 py-1.5 text-sm font-medium text-[#3d6332]">
                Sent - thank you.
              </p>
            )}
            {feedbackStatus.kind === 'error' && (
              <p className="mt-2 rounded-md border border-[#c99b8f] bg-[#f7e9e5] px-2 py-1.5 text-sm font-medium text-[#8f3520]">
                {feedbackStatus.message}
              </p>
            )}
            <button
              type="button"
              className={`${primaryBtnCls} mt-2 w-full justify-center`}
              onClick={sendFeedback}
              disabled={feedbackStatus.kind === 'sending' || !feedbackText.trim()}
            >
              {feedbackStatus.kind === 'sending' ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <MessageSquare size={14} />
              )}
              {feedbackStatus.kind === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-[#c9bda9] bg-white px-3 py-2 text-sm font-medium text-[#2a2620] shadow-md hover:bg-[#f3ede2]"
            onClick={() => setFeedbackOpen(true)}
            title="Send feedback"
          >
            <MessageSquare size={15} /> Feedback
          </button>
        )}
      </div>
    </main>
  )
}
