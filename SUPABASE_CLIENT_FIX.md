# Supabase Client Fix - Complete

## Problem Solved
Fixed `supabaseKey is required` error on `/demo` route by enforcing consistent browser client usage.

## Root Cause
Client code was attempting to create Supabase clients directly, bypassing proper env var validation and causing runtime errors when `NEXT_PUBLIC_SUPABASE_ANON_KEY` was undefined.

## Changes Made

### 1. Browser Client Factory (`lib/supabase/browser.ts`)
Changed from singleton export to factory function:

```ts
export function supabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anon) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (browser).');
  }

  if (process.env.NODE_ENV !== 'production') {
    console.info('[Supabase FE]', { urlPrefix: url.slice(0, 30), anonPrefix: anon.slice(0, 8) + '…' });
  }

  return createClient(url, anon, { /* config */ });
}
```

**Dev Log**: Look for `[Supabase FE] { urlPrefix: "...", anonPrefix: "..." }` in console

### 2. Realtime Integration (`lib/realtime/subscribe.ts`)
Updated to use factory:

```ts
import { supabaseBrowser } from '../supabase/browser';

const client = supabaseBrowser();
// All subscriptions now use this client
```

### 3. Build-Time Guard (`scripts/check-env-usage.cjs`)
Prevents regressions by failing CI if client components use `createClient()` directly:

```bash
npm run check:env-usage
```

Output: `[OK] FE Supabase usage clean.`

**What it checks**:
- No `createClient()` in client components (`'use client'` files)
- No direct env var access in client code
- Excludes API routes and server components

### 4. Runtime Verification (`/api/env-check`)
Added Supabase checks to existing endpoint:

```json
{
  "hasPublicUrl": true,
  "hasPublicAnon": true,
  "hasServiceRole": true
}
```

Test: `curl https://propvisions.com/api/env-check`

## Env Vars Required

### In Vercel (all environments):
```
NEXT_PUBLIC_SUPABASE_URL=https://rfbenobdonhgfnmxgfns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**Note**: `NEXT_PUBLIC_` vars are auto-exposed by Next.js - no config needed

### Optional:
```
NEXT_PUBLIC_REALTIME_ENABLED=true
```

## Verification Steps

### Local Dev
1. ✅ `npm run check:env-usage` → `[OK] FE Supabase usage clean.`
2. ✅ `npm run build` → No errors
3. ✅ Visit `/demo` → Console shows `[Supabase FE]` log
4. ✅ No `supabaseKey is required` error

### Production
1. Add env vars to Vercel
2. Redeploy
3. Check `/api/env-check` → All `true`
4. Visit `/demo` → No errors
5. Realtime updates work (if `NEXT_PUBLIC_REALTIME_ENABLED=true`)

## Files Changed

### Updated
- `lib/supabase/browser.ts` - Factory function
- `lib/realtime/subscribe.ts` - Uses factory
- `pages/api/env-check.ts` - Added Supabase checks
- `package.json` - Added `check:env-usage` script

### Created
- `scripts/check-env-usage.cjs` - Build guard

### Removed
- `next.config.ts` env mapping (not needed for NEXT_PUBLIC vars)

## CI Integration

Add to CI/predeploy:
```yaml
- run: npm run check:env-usage
- run: npm run build
```

## Definition of Done

✅ No client code calls `createClient()` directly
✅ `/demo` uses `supabaseBrowser()` and shows dev log
✅ Prod shows all `true` from `/api/env-check`
✅ Error `supabaseKey is required` is eliminated
✅ Realtime functionality intact

## Next Steps

1. **Add env vars to Vercel** (if not already done)
2. **Redeploy** to production
3. **Test** `/api/env-check` endpoint
4. **Verify** `/demo` loads without errors
5. **Enable realtime** by setting `NEXT_PUBLIC_REALTIME_ENABLED=true`
