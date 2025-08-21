// src/lib/demoAuth.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

/**
 * Read and normalise valid access keys from env.
 * Supports comma-separated OR newline-separated lists.
 * Example values:
 *   DEMO_ACCESS_KEYS="abc123, partner-2025, internal-beta"
 * or
 *   DEMO_ACCESS_KEYS="abc123
 *   partner-2025
 *   internal-beta"
 */
export function getValidKeys(): string[] {
  const raw = process.env.DEMO_ACCESS_KEYS || process.env.NEXT_PUBLIC_DEMO_ACCESS_KEYS || ''
  return raw
    .split(/[\n,]/g)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => s.toLowerCase())
}

/**
 * Pull `code` from the body, tolerating different field names and casing.
 * Accepts: code, accessCode, access_code, access-key, key
 */
export function extractCode(body: any): string | null {
  if (!body || typeof body !== 'object') return null
  const entries = Object.entries(body) as [string, unknown][]
  let found: string | null = null
  for (const [k, v] of entries) {
    const nk = k.toLowerCase().replace(/[-\s]/g, '_')
    if (['code', 'accesscode', 'access_code', 'accesskey', 'access_key', 'key'].includes(nk)) {
      if (typeof v === 'string' && v.trim()) {
        found = v.trim()
        break
      }
    }
  }
  return found
}

/** Validate a code (case-insensitive) against env keys */
export function isCodeAllowed(code: string | null): boolean {
  if (!code) return false
  const keys = getValidKeys()
  return keys.includes(code.toLowerCase())
}

/** Cookie helpers */
const COOKIE_NAME = 'ps_demo_access'
export const DEMO_COOKIE_NAME = COOKIE_NAME

export function makeAccessCookie(value = '1'): string {
  const days = 7
  const maxAge = days * 24 * 60 * 60
  return serialize(COOKIE_NAME, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge,
  })
}

export function clearAccessCookie(): string {
  return serialize(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

/** Optional helper to send JSON */
export function json(res: NextApiResponse, status: number, data: any) {
  res.status(status).setHeader('Content-Type', 'application/json').end(JSON.stringify(data))
}

/** Very small logger (avoids leaking keys) */
export function logDebug(label: string, extra?: Record<string, unknown>) {
  try {
    // eslint-disable-next-line no-console
    console.log(`[demo-auth] ${label}`, extra ? JSON.stringify(extra) : '')
  } catch {}
}
