// lib/demoAuth.ts
import crypto from 'crypto';

const SECRET = process.env.DEMO_SESSION_SECRET!;
const TTL_DAYS = parseInt(process.env.DEMO_SESSION_TTL_DAYS || '7', 10);
const MS = 24 * 60 * 60 * 1000;

export type DemoSession = { sub: 'demo'; iat: number; exp: number; key?: string };

function b64url(buf: Buffer | string) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function hmac(data: string) {
  return crypto.createHmac('sha256', SECRET).update(data).digest();
}

export function createSession(key?: string): string {
  if (!SECRET) throw new Error('DEMO_SESSION_SECRET missing');
  const now = Date.now();
  const payload: DemoSession = { sub: 'demo', iat: now, exp: now + TTL_DAYS * MS, key };
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const sig = b64url(hmac(body));
  return `${body}.${sig}`;
}

export function verifySession(token?: string): DemoSession | null {
  if (!SECRET) return null;
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = b64url(hmac(body));
  // avoid exceptions if lengths differ
  if (expected.length !== sig.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64').toString()) as DemoSession;
    if (payload.sub !== 'demo') return null;
    if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
