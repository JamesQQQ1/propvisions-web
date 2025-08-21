// src/lib/demoAuth.ts
import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'demo_session';
const ALLOWED = 'ok'; // simple allow value

export function hasDemoCookieInMiddleware(reqHeaders: Headers): boolean {
  const raw = reqHeaders.get('cookie') || '';
  return raw.split(/;\s*/).some(c => c.startsWith(`${COOKIE_NAME}=${ALLOWED}`));
}

export function requireDemoCookieServer(): boolean {
  const c = cookies().get(COOKIE_NAME)?.value;
  return c === ALLOWED;
}

export function getCookieName() {
  return COOKIE_NAME;
}
export function getAllowedValue() {
  return ALLOWED;
}
