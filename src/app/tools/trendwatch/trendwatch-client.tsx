'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Copy,
  Download,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react'

// Trend digest tool. Sources persist in localStorage only - no backend
// storage by design. The API route exists solely to get around CORS.

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

const STORAGE_KEY = 'ibh-trendwatch-sources-v1'

const DEFAULT_SOURCES: Omit<Source, 'id'>[] = [
  { label: 'Social Media Today', url: 'https://www.socialmediatoday.com/feeds/news/', enabled: true },
  { label: 'Social Media Examiner', url: 'https://www.socialmediaexaminer.com/feed/', enabled: true },
  { label: 'Buffer Blog', url: 'https://buffer.com/resources/rss/', enabled: true },
  { label: 'Hootsuite Blog', url: 'https://blog.hootsuite.com/feed/', enabled: true },
  { label: 'Sprout Social', url: 'https://sproutsocial.com/insights/feed/', enabled: true },
  { label: 'Google Trends US', url: 'https://trends.google.com/trending/rss?geo=US', enabled: true },
  { label: 'r/mentalhealth', url: 'https://www.reddit.com/r/mentalhealth/new/.rss', enabled: true },
  // Note: reddit rate-limits back-to-back requests from one IP - with both
  // subreddit feeds enabled, one may intermittently report HTTP 429. That is
  // reddit, not a broken source; it appears in the per-source status.
  { label: 'r/therapy', url: 'https://www.reddit.com/r/therapy/new/.rss', enabled: true },
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

export default function TrendwatchClient() {
  const [sources, setSources] = useState<Source[] | null>(null)
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
    if (window.confirm('Replace the current source list with the defaults?')) {
      setSources(defaultsWithIds())
      setNotice('Source list reset to defaults.')
    }
  }

  function exportJson() {
    const data = JSON.stringify(
      (sources ?? []).map(({ label, url, enabled }) => ({ label, url, enabled })),
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
        if (!Array.isArray(parsed)) throw new Error('not a JSON array')
        const imported: Source[] = parsed
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

  const grouped = useMemo(() => {
    const groups = new Map<string, DigestItem[]>()
    for (const item of items) {
      const list = groups.get(item.sourceUrl) ?? []
      list.push(item)
      groups.set(item.sourceUrl, list)
    }
    return groups
  }, [items])

  const digestText = useMemo(() => {
    if (items.length === 0) return ''
    const end = fetchedAt ?? new Date()
    const start = new Date(end.getTime() - sinceDays * 24 * 60 * 60 * 1000)
    const fmt = (d: Date) => d.toISOString().slice(0, 10)
    const okCount = (results ?? []).filter((r) => r.ok).length
    const lines: string[] = [
      `Trend digest - ${fmt(start)} to ${fmt(end)} - ${okCount} sources, ${items.length} items`,
      '',
    ]
    for (const [url, group] of grouped) {
      lines.push(`=== ${labelFor(url)} ===`)
      for (const item of group) {
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
  }, [items, grouped, results, sinceDays, fetchedAt, labelFor])

  async function copyDigest() {
    try {
      await navigator.clipboard.writeText(digestText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      setNotice('Clipboard blocked - use the digest text preview below to copy manually.')
    }
  }

  const inputCls =
    'rounded-md border border-[#ddd3c4] bg-white px-2.5 py-1.5 text-sm text-[#2a2620] outline-none focus:border-[#b09a72]'
  const btnCls =
    'inline-flex items-center gap-1.5 rounded-md border border-[#ddd3c4] bg-white px-3 py-1.5 text-sm text-[#2a2620] hover:bg-[#f3ede2] disabled:opacity-50'

  return (
    <main className="min-h-screen bg-[#faf7f1] px-6 py-10 text-[#2a2620]">
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
              <button type="button" className={btnCls} onClick={exportJson} title="Download the source list as JSON">
                <Download size={14} /> Export JSON
              </button>
              <button type="button" className={btnCls} onClick={() => importRef.current?.click()} title="Load a source list from JSON">
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
                  className="h-4 w-4 accent-[#8a6d3b]"
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
                  className="rounded-md p-1.5 text-[#8a5a4a] hover:bg-[#f3e5df]"
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
          <div className="mt-3 flex items-center gap-3">
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
              className={`${btnCls} border-[#8a6d3b] bg-[#8a6d3b] text-white hover:bg-[#75592c]`}
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

          {fetchError && (
            <p className="mt-3 rounded-md border border-[#d9b8b0] bg-[#f7e9e5] px-3 py-2 text-sm text-[#7a3b2e]">
              Fetch failed - {fetchError}
            </p>
          )}

          {results && (
            <ul className="mt-4 space-y-1">
              {results.map((r) => (
                <li key={r.url} className="flex items-baseline gap-2 text-sm">
                  <span
                    className={`inline-block h-2 w-2 shrink-0 translate-y-[-1px] rounded-full ${r.ok ? 'bg-[#4c7a3f]' : 'bg-[#b0442c]'}`}
                  />
                  <span className="font-medium">{labelFor(r.url)}</span>
                  {r.ok ? (
                    <span className="text-[#4c7a3f]">
                      {r.itemCount} item{r.itemCount === 1 ? '' : 's'}
                    </span>
                  ) : (
                    <span className="text-[#b0442c]">failed - {r.error}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* C. Digest */}
        <section className="mt-10 pb-16">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Digest</h2>
            {items.length > 0 && (
              <button
                type="button"
                className={`${btnCls} border-[#8a6d3b] bg-[#8a6d3b] text-white hover:bg-[#75592c]`}
                onClick={copyDigest}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy digest'}
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="mt-3 text-sm text-[#6e6455]">
              {results
                ? 'No items in the selected window.'
                : 'Fetch to build a digest.'}
            </p>
          ) : (
            <>
              <div className="mt-4 space-y-6">
                {Array.from(grouped.entries()).map(([url, group]) => (
                  <div key={url}>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-[#6e6455]">
                      {labelFor(url)}
                    </h3>
                    <div className="mt-2 space-y-2">
                      {group.map((item, i) => (
                        <article
                          key={`${item.link || item.title}-${i}`}
                          className="rounded-lg border border-[#e3dccd] bg-white p-3"
                        >
                          <a
                            href={item.link || undefined}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-[#2a2620] underline decoration-[#c9b891] underline-offset-2 hover:decoration-[#8a6d3b]"
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
                          {item.description && (
                            <p className="mt-1.5 text-sm leading-snug text-[#4a443a]">
                              {item.description}
                            </p>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ))}
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
