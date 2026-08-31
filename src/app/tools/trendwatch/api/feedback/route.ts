import { NextResponse } from 'next/server'
import { Resend } from 'resend'

// Feedback -> email via Resend. No database by design (Slab Worthy's feedback
// pattern is a Postgres table behind Flask, which does not port to this
// stack; email is the deliberate substitute). Fails LOUDLY when the Resend
// env vars are absent - a 503 the UI surfaces - never a silent drop.

export const runtime = 'nodejs'

const FEEDBACK_TO = 'mike@ideabyhuman.com'
const MAX_MESSAGE_CHARS = 5000
const MAX_STATE_CHARS = 20000

// Light per-IP rate limit: this endpoint sends email and the page is
// reachable without auth. Per-instance in-memory is enough for an abuse gate.
const RATE_MAX = 5
const RATE_WINDOW_MS = 10 * 60 * 1000
const rateStore = new Map<string, { count: number; windowStart: number }>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateStore.get(ip) ?? { count: 0, windowStart: now }
  if (now - entry.windowStart > RATE_WINDOW_MS) {
    entry.count = 0
    entry.windowStart = now
  }
  if (entry.count >= RATE_MAX) return true
  entry.count++
  rateStore.set(ip, entry)
  return false
}

export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL
  if (!apiKey || !from) {
    return NextResponse.json(
      {
        error:
          'Feedback email is not configured on this deployment (RESEND_API_KEY / RESEND_FROM_EMAIL missing).',
      },
      { status: 503 }
    )
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: 'Too many feedback messages - try again in a few minutes.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 })
  }
  const { message, state } = (body ?? {}) as { message?: unknown; state?: unknown }
  const text = typeof message === 'string' ? message.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 })
  }

  const stateJson = JSON.stringify(state ?? {}, null, 2).slice(0, MAX_STATE_CHARS)
  const userAgent = request.headers.get('user-agent') ?? 'unknown'

  const emailBody = [
    'Trendwatch feedback',
    '',
    text.slice(0, MAX_MESSAGE_CHARS),
    '',
    '--- tool state (collected automatically) ---',
    `user agent: ${userAgent}`,
    stateJson,
  ].join('\n')

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: [FEEDBACK_TO],
      subject: 'Trendwatch feedback',
      text: emailBody,
    })
    if (error) {
      return NextResponse.json(
        { error: `Send failed - ${error.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json({ ok: true, id: data?.id ?? null })
  } catch (e) {
    return NextResponse.json(
      { error: `Send failed - ${(e as Error).message}` },
      { status: 502 }
    )
  }
}
