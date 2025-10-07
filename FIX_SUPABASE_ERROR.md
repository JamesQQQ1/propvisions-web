# Fix: "supabaseKey is required" Error

## Problem
Error in production: `Uncaught Error: supabaseKey is required.`

This happens when Supabase env vars aren't available in the browser bundle.

## Root Cause
Vercel production deployment is missing environment variables.

## Solution

### 1. Verify Local Env
```bash
npm run check-env
```

Should show:
```
✅ All required Supabase env vars present
  URL: https://...
  Anon: eyJ...
  Service: eyJ...
```

### 2. Add to Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these **3 required variables** to **all environments** (Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://rfbenobdonhgfnmxgfns.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmVub2Jkb25oZ2ZubXhnZm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MDM0NzMsImV4cCI6MjA2OTI3OTQ3M30.4wlrCuH8dEg4smVONdvX7Cb-3NSsubGNmFlNkPYPUac
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJmYmVub2Jkb25oZ2ZubXhnZm5zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcwMzQ3MywiZXhwIjoyMDY5Mjc5NDczfQ.mXcoAkfKx35El0cIYZ3Z4UcKVpyhj7sI3tZgxiKvPw0
```

**Optional** (enable realtime):
```
NEXT_PUBLIC_REALTIME_ENABLED=true
```

### 3. Redeploy
After adding variables to Vercel:
1. Go to Deployments tab
2. Click ⋯ on latest deployment → Redeploy
3. Or push new commit to trigger deployment

## Why This Fixes It

### Before
- `lib/supabase/browser.ts` tries to read `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Vercel doesn't have this env var
- Returns `undefined`
- Supabase client throws: "supabaseKey is required"

### After
- Vercel has env vars set
- Next.js bundles them via `next.config.ts` → `env` option
- Browser receives vars at build time
- Client creates successfully

## Files Updated

### next.config.ts
Added `env` config to expose NEXT_PUBLIC vars:
```ts
env: {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_REALTIME_ENABLED: process.env.NEXT_PUBLIC_REALTIME_ENABLED,
}
```

### lib/supabase/browser.ts
Validates and throws clear error if missing:
```ts
if (!url || !anon) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY.');
}
```

## Test Locally
```bash
npm run build
npm run check-env
```

Both should succeed with no errors.
