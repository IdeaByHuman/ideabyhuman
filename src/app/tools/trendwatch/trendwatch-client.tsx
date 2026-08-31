'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'

// Trend digest tool. Sources and display preferences persist in localStorage
// only - no backend storage by design. The API route exists solely to get
// around CORS. No AI calls here: the tool gathers and formats, something
// else does the thinking.

type Source = {
  id: string
  label: string
  url: string
  enabled: boolean
}

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

const DEFAULT_PREFS: Prefs = { filter: '', compact: true, itemCap: 5, collapsed: [] }

const DEFAULT_SOURCES: Omit<Source, 'id'>[] = [
  { label: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/', enabled: true },
  { label: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/', enabled: true },
  { label: 'Buffer Blog', url: 'https://buffer.com/resources/rss/', enabled: true },
  { label: 'Hootsuite Blog', url: 'https://blog.hootsuite.com/feed/', enabled: true },
  { label: 'Sprout Social', url: 'https://sproutsocial.com/insights/feed/', enabled: true },
  { label: 'Google Trends US', url: 'https://trends.google.com/trending/rss?geo=US', enabled: true },
  // Note: reddit rate-limits back-to-back requests from one IP - with both
  // subreddit feeds enabled, one may intermittently report HTTP 429. That is
  // reddit, not a broken source; it appears in the per-source status.
  // Both ship disabled - turn them on as needed.
  { label: 'r/mentalhealth', url: 'https://www.reddit.com/r/mentalhealth/new/.rss', enabled: false },
  { label: 'r/therapy', url: 'https://www.reddit.com/r/therapy/new/.rss', enabled: false },
]

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function defaultsWithIds(): Source[] {
  return DEFAULT_SOURCES.map((s) => ({ ...s, id: newId() }))
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
      }))
    return cleaned.length > 0 ? cleaned : defaultsWithIds()
  } catch {
    return defaultsWithIds()
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
  const importRef = useRef<HTMLInputElement>(null)

  // localStorage is browser-only - hydrate after mount.
  useEffect(() => {
    setSources(loadSources())
    setPrefs(loadPrefs())
  }, [])

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

  function update(id: string, patch: Partial<Source>) {
    setSources((prev) =>
      (prev ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s))
    )
  }

  function addSource() {
    setSources((prev) => [
      ...(prev ?? []),
      { id: newId(), label: '', url: '', enabled: true },
    ])
  }

  function removeSource(id: string) {
    setSources((prev) => (prev ?? []).filter((s) => s.id !== id))
  }

  function resetDefaults() {
    if (window.confirm('Replace the current source list and preferences with the defaults?')) {
      setSources(defaultsWithIds())
      setPrefs({ ...DEFAULT_PREFS })
      setNotice('Source list and preferences reset to defaults.')
    }
  }

  function exportJson() {
    const data = JSON.stringify(
      {
        sources: (sources ?? []).map(({ label, url, enabled }) => ({ label, url, enabled })),
        filter,
        display: { compact, itemCap },
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
            (s): s is { label?: string; url?: string; enabled?: boolean } =>
              !!s && typeof s === 'object' && typeof (s as { url?: unknown }).url === 'string'
          )
          .map((s) => ({
            id: newId(),
            label: typeof s.label === 'string' ? s.label : (s.url as string),
            url: s.url as string,
            enabled: s.enabled !== false,
          }))
        if (imported.length === 0) throw new Error('no sources found in file')
        setSources(imported)
        if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
          const obj = parsed as {
            filter?: unknown
            display?: { compact?: unknown; itemCap?: unknown }
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
    if (enabled.length === 0) {
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
        body: JSON.stringify({
          urls: enabled.map((s) => s.url.trim()),
          sinceDays,
        }),
      })
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error ?? `HTTP ${res.status}`)
      }
      const data = (await res.json()) as {
        results: FeedResult[]
        items: DigestItem[]
        elapsedMs: number
      }
      setResults(data.results)
      setItems(data.items)
      setElapsedMs(data.elapsedMs)
      setFetchedAt(new Date())
    } catch (e) {
      setFetchError((e as Error).message)
    } finally {
      setFetching(false)
    }
  }

  // Pipeline: fetch -> keyword filter -> per-source cap. Capping before
  // filtering would throw away matches, so the order is load-bearing.
  const filteredItems = useMemo(() => {
    const terms = parseFilterTerms(filter)
    if (terms.length === 0) return items
    return items.filter((item) => {
      const hay = (item.title + ' ' + item.description).toLowerCase()
      return terms.some((t) => hay.includes(t))
    })
  }, [items, filter])

  const cappedGroups = useMemo(() => {
    const groups = new Map<string, DigestItem[]>()
    for (const item of filteredItems) {
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
  }, [filteredItems, itemCap])

  const visibleCount = useMemo(
    () => cappedGroups.reduce((n, g) => n + g.visible.length, 0),
    [cappedGroups]
  )
  const filterActive = parseFilterTerms(filter).length > 0

  const digestText = useMemo(() => {
    if (visibleCount === 0) return ''
    const end = fetchedAt ?? new Date()
    const start = new Date(end.getTime() - sinceDays * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const okCount = (results ?? []).filter((r) => r.ok).length
    const lines: string[] = [
      `Trend digest - ${fmt(start)} to ${fmt(end)} - ${okCount} sources, ${visibleCount} items`,
      '',
    ]
    // The digest matches what is on screen (filter + cap applied), with two
    // deliberate exceptions - compact mode and collapsed sections are
    // display-only. The digest always carries descriptions and every source:
    // it is input for analysis elsewhere, and the descriptions are the
    // substance.
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
    return lines.join('\n').trimEnd() + '\n'
  }, [cappedGroups, visibleCount, results, sinceDays, fetchedAt, labelFor])

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

  return (
    <main
      className="min-h-screen bg-[#faf7f1] px-6 py-10 text-[#2a2620]"
      style={{ colorScheme: 'light' }}
    >
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Trendwatch</h1>
        <p className="mt-1 text-sm text-[#6e6455]">
          Pull recent items from your feed list, then copy the digest into the
          AI assistant of your choice for analysis. Sources are saved in this
          browser only - export the JSON to share a list.
        </p>

        {notice && (
          <p className="mt-4 rounded-md border border-[#e3d9c8] bg-[#f5efe3] px-3 py-2 text-sm">
            {notice}
          </p>
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

          <ul className="mt-3 space-y-2">
            {(sources ?? []).map((s) => (
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
          <button type="button" className={`${btnCls} mt-3`} onClick={addSource}>
            <Plus size={14} /> Add source
          </button>
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
              placeholder="Comma-separated terms, e.g. video, algorithm, engagement"
              onChange={(e) => patchPrefs({ filter: e.target.value })}
            />
          </div>

          {fetchError && (
            <p className="mt-3 rounded-md border border-[#c99b8f] bg-[#f7e9e5] px-3 py-2 text-sm font-medium text-[#8f3520]">
              Fetch failed - {fetchError}
            </p>
          )}

          {results && (
            <ul className="mt-4 space-y-1">
              {results.map((r) => (
                <li key={r.url} className="flex items-baseline gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${r.ok ? 'bg-[#3d6332]' : 'bg-[#9a3a24]'}`}
                  />
                  <span className="font-medium">{labelFor(r.url)}</span>
                  {r.ok ? (
                    <span className="text-[#3d6332]">
                      {r.itemCount} item{r.itemCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="font-medium text-[#9a3a24]">failed - {r.error}</span>
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
            {items.length > 0 && (
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
                {visibleCount > 0 && (
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
              Showing {visibleCount} of {items.length} items
            </p>
          )}

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-[#6e6455]">
              {results
                ? 'No items in the selected window.'
                : 'Fetch to build a digest.'}
            </p>
          ) : visibleCount === 0 && filterActive ? (
            <p className="mt-3 rounded-md border border-[#e3d9c8] bg-[#f5efe3] px-3 py-2 text-sm text-[#4a443a]">
              The fetch succeeded - {items.length} item
              {items.length === 1 ? '' : 's'} retrieved - but no items match the
              current filter. Clear or loosen the filter terms above to see them.
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
    </main>
  )
}
