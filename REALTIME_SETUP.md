# Realtime Setup Guide

## Environment Variables

### Required in all environments (.env.local, Vercel):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Optional (enable realtime):

```bash
NEXT_PUBLIC_REALTIME_ENABLED=true
```

## Files Created

### Core Infrastructure
- `lib/supabase/browser.ts` - Client-safe Supabase with validation
- `lib/supabase/server.ts` - Server-only client (exports `supabaseServer` + legacy `supabaseAdmin`)
- `lib/realtime/subscribe.ts` - Subscription helpers (runs, properties, missing_room_requests)
- `lib/realtime/merge.ts` - Idempotent row merge utilities

### Integrations
- `components/MissingRoomRequestsCard.tsx` - Live updates on missing room requests

## How It Works

### 1. Browser Client (lib/supabase/browser.ts)
- Validates `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Throws error if missing
- Logs in dev: `[Supabase] { url: '...', anonKey: '...' }`

### 2. Server Client (lib/supabase/server.ts)
- Validates `SUPABASE_SERVICE_ROLE_KEY` + `NEXT_PUBLIC_SUPABASE_URL`
- Never import in client code
- Exports `supabaseServer` (new) and `supabaseAdmin` (legacy alias)

### 3. Realtime Subscriptions
Feature-flagged via `NEXT_PUBLIC_REALTIME_ENABLED=true`

**subscribeRuns(runId, onUpdate)**
- Filter: `run_id=eq.{runId}`
- Events: INSERT, UPDATE, DELETE

**subscribeProperties(propertyId, onUpdate)**
- Filter: `property_id=eq.{propertyId}`
- Events: INSERT, UPDATE, DELETE

**subscribeMissingRoomRequests(propertyId, onUpsert, onDelete)**
- Filter: `property_id=eq.{propertyId}`
- Events: INSERT (onUpsert), UPDATE (onUpsert), DELETE (onDelete)

### 4. Merge Utilities
**mergeRowUpsert(rows, newRow)**
- Updates existing row by id or appends new

**mergeRowDelete(rows, deletedId)**
- Filters out deleted row

## Usage Example

```tsx
import { subscribeMissingRoomRequests } from '@/lib/realtime/subscribe';
import { mergeRowUpsert, mergeRowDelete } from '@/lib/realtime/merge';

useEffect(() => {
  const unsub = subscribeMissingRoomRequests(
    propertyId,
    (row) => setRequests(prev => mergeRowUpsert(prev, row)),
    ({ id }) => setRequests(prev => mergeRowDelete(prev, id))
  );
  return unsub; // cleanup on unmount
}, [propertyId]);
```

## Supabase Setup

Enable Realtime for tables:
1. Go to Database → Replication
2. Enable for: `runs`, `properties`, `missing_room_requests`

## Vercel Deploy

### Required Environment Variables
Add to **all environments** (Production, Preview, Development):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### Optional
```
NEXT_PUBLIC_REALTIME_ENABLED=true
```

### Steps:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add each variable above
3. Select all environments (Production, Preview, Development)
4. Redeploy after adding variables

## Safety
- Graceful degradation if realtime fails (shows stale data)
- Auto-unsubscribe on unmount
- Dev-only logging
- Token expiry still validated client-side
