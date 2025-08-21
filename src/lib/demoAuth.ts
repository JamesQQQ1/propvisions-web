// src/lib/demoAuth.ts
import { cookies } from 'next/headers'

function parseKeys(raw?: string | null): string[] {
  if (!raw) return []
  return raw
    .split(/[,\n\r\s]+/)      // commas, newlines OR whitespace
    .map(s => s.trim())
    .filter(Boolean)
}

const CASE_INSENSITIVE = true; // <— make matches case-insensitive

export function getAllowedKeys(): string[] {
  const raw = process.env.DEMO_ACCESS_KEYS || ''
  const keys = parseKeys(raw)
  return CASE_INSENSITIVE ? keys.map(k => k.toLowerCase()) : keys
}

export function isValidKey(input: string): boolean {
  const val = CASE_INSENSITIVE ? input.trim().toLowerCase() : input.trim()
  return getAllowedKeys().includes(val)
}

export function getCookieDomain(): string | undefined {
  const d = process.env.DEMO_COOKIE_DOMAIN?.trim()
  return d || undefined
}

export function readSessionCookie() {
  const store = cookies()
  return store.get('demo_session')?.value || null
}

export function writeSessionCookie(value: string) {
  const store = cookies()
  const domain = getCookieDomain()
  store.set('demo_session', value, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: (Number(process.env.DEMO_SESSION_TTL_DAYS || '7') || 7) * 86400,
    ...(domain ? { domain } : {}),
  })
}

export function clearSessionCookie() {
  const store = cookies()
  const domain = getCookieDomain()
  store.set('demo_session', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    ...(domain ? { domain } : {}),
  })
}
