# Missing Room Upload Buttons - Implementation Complete

## Goal Achieved
✅ Property page shows "Upload photo" buttons for pending missing room requests
✅ Buttons appear in both top panel and matching room tiles
✅ Server data + realtime updates (no FE Supabase for initial fetch)
✅ Live removal when upload completes (status → 'received')

## Architecture

### Data Flow
1. **Initial Load**: `GET /api/missing-rooms?property_id=...&status=pending`
2. **Realtime Updates**: Subscribe to `missing_room_requests` table changes
3. **Auto-removal**: When status changes to 'received' or 'cancelled', button disappears

### Components

#### `MissingRoomRequestsCard.tsx`
**Top panel showing all pending uploads**
- Compact list with Upload photo buttons
- Shows coverage summary if available: `Coverage: X% · Missing Y / Z`
- Handles expired tokens (shows "Link expired" button)
- Hides entirely when no pending requests

**Exported Hook**: `useMissingRoomRequests(propertyId)`
- Fetches from `/api/missing-rooms`
- Subscribes to realtime updates
- Returns `{ requests, isLoading }`

#### `RoomUploadButton.tsx`
**Client component for room tile buttons**
- Renders upload button(s) for matching pending uploads
- Handles expired tokens
- Null if no uploads for that room

#### `RoomCard.tsx`
**Updated to accept `pendingUploads` prop**
```ts
interface RoomCardProps {
  room: UiRoom;
  allRooms?: UiRoom[];
  showCharts?: boolean;
  pendingUploads?: PendingUpload[];  // ← New
}
```

Renders `<RoomUploadButton>` at bottom of card

### Mapping Logic (Demo Page)

**Room-to-Upload Matching**:
1. **Exact match**: `room_label` + `floor` (case-insensitive)
2. **Fallback**: Normalized label matching (strips spaces, case)

```ts
const roomUploadsMap = useMemo(() => {
  const map = new Map<string, PendingUpload[]>();

  missingRoomRequests.forEach((req) => {
    const labelKey = `${req.room_label?.toLowerCase()}|${req.floor?.toLowerCase()}`;

    const matchingRoom = uiRooms.find(room => {
      const roomKey = `${room.display_name.toLowerCase()}|${room.floor?.toLowerCase()}`;
      if (roomKey === labelKey) return true;

      // Fallback: normalized
      return normalizeLabel(room.display_name) === normalizeLabel(req.room_label || '');
    });

    if (matchingRoom) {
      map.set(matchingRoom.room_name, [...map.get(matchingRoom.room_name) || [], req]);
    }
  });

  return map;
}, [missingRoomRequests, uiRooms]);
```

**Passed to RoomCard**:
```tsx
<RoomCard
  pendingUploads={roomUploadsMap.get(room.room_name) || []}
/>
```

## UI Behavior

### Top Panel (MissingRoomRequestsCard)
```
┌─────────────────────────────────────────┐
│ 📷 Missing Photos                       │
│    Coverage: 75% · Missing 3 / 12       │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Master Bedroom (Ground Floor)    │  │
│  │ Open link: https://...           │  │
│  │                   [Upload photo] │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │ Kitchen                          │  │
│  │                  [Link expired]  │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Room Tile Button
```
┌─────────────────────────┐
│ Master Bedroom          │
│ [Room image]            │
│ Cost: £5,000            │
│                         │
│ ┌─────────────────────┐ │
│ │ Missing photo       │ │
│ │ [Upload photo]      │ │
│ └─────────────────────┘ │
└─────────────────────────┘
```

## Realtime Updates

### Status Changes
- **INSERT**: New pending request → Button appears
- **UPDATE status='received'**: Upload complete → Button disappears
- **UPDATE status='cancelled'**: Cancelled → Button disappears
- **DELETE**: Row deleted → Button disappears

### Implementation
```ts
const handleUpsert = useCallback((row: PendingUpload) => {
  // Remove if status changed to complete/cancelled
  if (row.status === 'received' || row.status === 'cancelled') {
    setRequests(prev => mergeRowDelete(prev, row.id));
  } else {
    setRequests(prev => mergeRowUpsert(prev, row));
  }
}, []);
```

## Edge Cases Handled

✅ **No pending requests**: Panel and buttons hidden
✅ **Expired token**: Button shows "Link expired" (disabled)
✅ **Missing upload_url**: Button shows "No link" (disabled)
✅ **Unknown floor**: Displays room label without parentheses
✅ **Duplicate labels**: Multiple buttons allowed (rare)
✅ **No matching room**: Shows in top panel only
✅ **Coverage summary**: Extracted from first request with `summary` field

## Feature Flag

Realtime enabled via:
```bash
NEXT_PUBLIC_REALTIME_ENABLED=true
```

Without flag:
- Initial load works (server endpoint)
- No live updates (buttons don't disappear automatically)

## Files Modified

### Created
- `components/RoomUploadButton.tsx` - Tile button component

### Updated
- `components/MissingRoomRequestsCard.tsx` - Compact buttons + hook export
- `components/RoomCard.tsx` - Added `pendingUploads` prop
- `app/demo/page.tsx` - Added hook + mapping logic

## Verification

### Build Check
```bash
npm run build
# ✓ Success

npm run check:env-usage
# [OK] FE Supabase usage clean
```

### Runtime Check
1. With pending rows → Both panel and tile buttons show
2. Click button → Opens `upload_url` in new tab
3. Upload completes (status → 'received') → Button disappears (realtime)
4. No pending rows → Panel hidden, no buttons on tiles

## Data Contract

**API Response** (`GET /api/missing-rooms`):
```json
{
  "items": [
    {
      "id": "uuid",
      "property_id": "uuid",
      "room_label": "Master Bedroom",
      "floor": "Ground Floor",
      "room_type": "bedroom",
      "upload_url": "https://...",
      "token_expires_at": "2025-10-08T12:00:00Z",
      "status": "pending",
      "summary": {
        "coverage_pct": 75,
        "missing": 3,
        "expected": 12
      }
    }
  ]
}
```

## Next Steps

1. **Deploy** to production
2. **Test** with real pending requests
3. **Enable realtime**: Set `NEXT_PUBLIC_REALTIME_ENABLED=true`
4. **Monitor**: Check buttons appear/disappear correctly
5. **Optional**: Add loading states for upload button clicks
