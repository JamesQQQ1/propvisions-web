# Missing Room Requests - Implementation Summary

## Overview
Implemented a feature to display missing room photo upload requests from Supabase, showing users which rooms need additional photos for AI analysis.

---

## 🎯 Key Features

### Smart Display Logic
- **Only shows when needed** - Card appears only when there are active upload requests
- **Token validation** - Filters out expired tokens automatically
- **Upload URL checks** - Only displays requests with valid upload URLs
- **Auto-hides** - Component returns `null` when no active requests exist

### Professional UI Design
- **Amber/Orange theme** - Warning-style colors to draw attention
- **Gradient backgrounds** - Modern `from-amber-50 to-orange-50` gradient
- **Responsive layout** - Works on mobile, tablet, and desktop
- **Icon-driven** - Clear visual indicators for photos and actions
- **Shadow effects** - Elevated card with `shadow-lg`

---

## 📁 Files Created

### 1. `/src/lib/supabase/queries.ts`
**Purpose**: Server-side data fetching and utilities

**Key Functions**:
```typescript
interface MissingRoomRequest {
  id: string;
  property_id: string;
  room_name: string;
  upload_url: string | null;
  token: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch missing room requests for a property
async function getMissingRoomRequests(propertyId: string): Promise<MissingRoomRequest[]>

// Check if token is expired
function isTokenExpired(tokenExpiresAt: string | null): boolean
```

**Features**:
- Uses `supabaseAdmin` from `lib/supabase-server.ts`
- Queries `missing_room_requests` table
- Orders by `created_at` descending (newest first)
- Graceful error handling with console logging
- Returns empty array on error

### 2. `/src/app/api/missing-rooms/route.ts`
**Purpose**: API endpoint to fetch missing room requests

**Endpoint**: `GET /api/missing-rooms?property_id=<id>`

**Features**:
- Validates `property_id` query parameter
- Returns 400 if missing or invalid
- Calls `getMissingRoomRequests()` server function
- Returns JSON array of requests
- Error handling with 500 response

### 3. `/src/components/MissingRoomRequestsCard.tsx`
**Purpose**: Client component to display missing room requests

**Component Type**: Client component (`'use client'`)

**Features**:
- Fetches data from `/api/missing-rooms` API
- Filters to only show active requests (valid URL + non-expired token)
- Auto-hides when loading or no active requests
- Displays each request with:
  - Room name (formatted from snake_case)
  - Expiry date/time (formatted locale-aware)
  - Upload button (links to `upload_url`)
  - Expired state (disabled button when token expired)

---

## 🎨 Visual Design

### Card Layout
```
┌─────────────────────────────────────────────────┐
│  ⚠️  Missing Room Photos                        │
│                                                  │
│  We need additional photos to complete the AI   │
│  analysis for the following rooms...            │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 📷 Master Bedroom                         │  │
│  │    Expires: 7 Oct 2025, 15:30            │  │
│  │                         [Upload Photos] ──┤  │
│  └──────────────────────────────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐  │
│  │ 📷 Living Room                            │  │
│  │    Link expired                          │  │
│  │                         [Link Expired] ───┤  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

### Design System

**Colors**:
- Background: `bg-gradient-to-br from-amber-50 to-orange-50`
- Border: `border-2 border-amber-200`
- Header icon: `from-amber-400 to-orange-500` gradient
- Upload button: `from-amber-500 to-orange-500` gradient
- Expired button: `bg-slate-300 text-slate-500`

**Typography**:
- Title: `text-2xl font-bold text-amber-900`
- Description: `text-sm text-amber-800`
- Room name: `font-semibold text-slate-900`
- Expiry text: `text-xs text-slate-500`

**Spacing**:
- Card padding: `p-6 md:p-8`
- Items spacing: `space-y-3`
- Item padding: `p-4`

**Borders & Radius**:
- Card: `rounded-2xl`
- Items: `rounded-xl`
- Buttons: `rounded-lg`

**Shadows**:
- Card: `shadow-lg`
- Items: `shadow-sm hover:shadow-md`
- Buttons: `shadow-md hover:shadow-lg`

---

## 🔧 Integration

### Demo Page Changes
**File**: `/src/app/demo/page.tsx`

**Added Import**:
```typescript
import MissingRoomRequestsCard from '@/components/MissingRoomRequestsCard';
```

**Added Component** (after Property Overview section):
```tsx
{/* Missing Room Requests Card */}
{data.property_id && <MissingRoomRequestsCard propertyId={data.property_id} />}
```

**Location**: Between "Property Overview" and "Investor Metrics" sections

---

## 📊 Data Flow

### 1. Component Mount
```
User loads demo page
  ↓
MissingRoomRequestsCard renders
  ↓
useEffect triggers fetch
  ↓
GET /api/missing-rooms?property_id=<id>
```

### 2. API Request
```
API route receives request
  ↓
Validates property_id parameter
  ↓
Calls getMissingRoomRequests(propertyId)
  ↓
Supabase query to missing_room_requests table
  ↓
Returns JSON array
```

### 3. Client Filtering
```
Component receives data
  ↓
Filters for active requests:
  - Has upload_url
  - Token not expired
  ↓
If no active requests → return null (hide)
  ↓
Otherwise → render card with items
```

### 4. User Interaction
```
User clicks "Upload Photos"
  ↓
Opens upload_url in new tab
  ↓
User uploads photos at external endpoint
  ↓
(External system updates Supabase)
  ↓
On next page load, request disappears if completed
```

---

## 🔒 Security Features

### Token Expiry Handling
- Client checks `token_expires_at` timestamp
- Compares with current time
- Disables button and shows "Link Expired" if expired
- Prevents users from clicking expired links

### URL Validation
- Only shows requests with valid `upload_url`
- Validates `property_id` on API route
- Returns 400 error for missing/invalid params

### Server-Side Query
- Uses `supabaseAdmin` (service role key)
- Query happens server-side only
- No credentials exposed to client

---

## 📱 Responsive Behavior

### Mobile (< 640px)
- Card: Full width with `p-6` padding
- Items: Stack vertically
- Button: Full width text with icon

### Tablet (640px - 1024px)
- Card: `p-6 md:p-8` padding
- Items: Horizontal layout (icon, text, button)
- Button: Fixed width with text + icon

### Desktop (> 1024px)
- Card: `p-8` padding
- Items: Horizontal with more spacing
- Button: Hover effects with scale

---

## ✅ Conditional Display Logic

The component displays **ONLY IF**:
1. ✅ Data has finished loading (`!isLoading`)
2. ✅ Requests array has items
3. ✅ Request has `upload_url` present
4. ✅ Token is NOT expired (`!isTokenExpired()`)

**Otherwise**: Component returns `null` (completely hidden)

---

## 🎯 User Experience

### Visual Hierarchy
1. **Warning icon** - Orange gradient circle with ⚠️ symbol
2. **Clear title** - "Missing Room Photos"
3. **Explanation** - Why photos are needed
4. **Action items** - Each room with upload button

### Interaction States
- **Normal**: Green gradient button, clickable
- **Hover**: Button scales up, shadow increases
- **Active**: Button scales down (`:active:scale-95`)
- **Expired**: Gray button, disabled, shows "Link Expired"

### Accessibility
- Buttons open in new tab (`target="_blank"`)
- Security: `rel="noopener noreferrer"`
- Icons provide visual context
- Expiry dates are clearly labeled

---

## 🚀 Future Enhancements (Optional)

### Possible Additions
- [ ] Auto-refresh when upload completes
- [ ] Progress indicator for each room
- [ ] Request new upload link button (if expired)
- [ ] Success message when photo uploaded
- [ ] Email notification option
- [ ] Bulk upload for multiple rooms
- [ ] Preview uploaded photos

---

## 🔧 Technical Details

### Supabase Table Schema
Expected `missing_room_requests` table structure:
```sql
CREATE TABLE missing_room_requests (
  id UUID PRIMARY KEY,
  property_id TEXT NOT NULL,
  room_name TEXT NOT NULL,
  upload_url TEXT,
  token TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### TypeScript Types
- All interfaces properly typed
- Strict null checks handled
- Optional fields marked with `?` or `| null`
- Type-safe date parsing

---

## ✅ What's Complete

### Functionality
- ✅ Server-side Supabase queries
- ✅ API route with validation
- ✅ Client component with data fetching
- ✅ Token expiry validation
- ✅ Conditional rendering (auto-hide)
- ✅ Upload button linking
- ✅ Error handling (graceful degradation)

### Design
- ✅ Professional warning-style UI
- ✅ Gradient backgrounds and borders
- ✅ Icons for visual clarity
- ✅ Responsive layout
- ✅ Hover states and transitions
- ✅ Consistent with site design system

### Integration
- ✅ Imported into demo page
- ✅ Positioned after Property Overview
- ✅ Conditionally rendered with `property_id`
- ✅ Build successful with no errors

---

## 📝 Implementation Notes

### Build Status
✅ **Build successful** - Next.js 15.4.5

### Route Registration
✅ API route registered in manifest:
```json
"/api/missing-rooms/route": "app/api/missing-rooms/route.js"
```

### Component Location
Demo page line 1531:
```tsx
{data.property_id && <MissingRoomRequestsCard propertyId={data.property_id} />}
```

---

**Result**: A fully functional, beautifully designed feature that alerts users to missing room photos and provides easy upload access with proper security and UX considerations! 🎉
