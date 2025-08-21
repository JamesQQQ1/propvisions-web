// src/lib/demoAuth.ts
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Parse keys from env, tolerate commas, spaces, or newlines
function parseKeys(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(/[,\n\r\s]+/)       // commas, newlines OR whitespace
    .map(s => s.trim())
    .filter(Boolean)
}

// OPTIONAL: set to true to make matches case-insensitive
const CASE_INSENSITIVE = false

export function getAllowedKeys(): string[] {
  const raw = process.env.DEMO_ACCESS_KEYS || ''
  const keys = parseKeys(raw)
  return CASE_INSENSITIVE ? keys.map(k => k.toLowerCase()) : keys
}

export function isValidKey(input: string): boolean {
  const val = CASE_INSENSITIVE ? input.trim().toLowerCase() : input.trim()
  return getAllowedKeys().includes(val)
}

export function getCookieDomain(reqHost?: string | null): string | undefined {
  // If you explicitly set DEMO_COOKIE_DOMAIN, use it; otherwise return undefined
  // so Next sends the cookie for the current host only.
  const d = process.env.DEMO_COOKIE_DOMAIN?.trim()
  if (d) return d
  if (!reqHost) return undefined
  // For safety: if host already looks like a domain, you could return undefined to stay host-only.
  return undefined
}

export function readSessionCookie() {
  const store = cookies()
  // cookie name centralised here
  return store.get('demo_session')?.value || null
}

export function writeSessionCookie(value: string, reqHost?: string | null) {
  const store = cookies()
  const domain = getCookieDomain(reqHost)
  store.set('demo_session', value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: (Number(process.env.DEMO_SESSION_TTL_DAYS || '7') || 7) * 24 * 60 * 60,
    ...(domain ? { domain } : {}),
  })
}

export function clearSessionCookie(reqHost?: string | null) {
  const store = cookies()
  const domain = getCookieDomain(reqHost)
  store.set('demo_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    ...(domain ? { domain } : {}),
  })
}
