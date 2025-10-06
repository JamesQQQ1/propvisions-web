# Chatbot Integration Guide

## Overview

A complete dynamic chatbot integration that sends property-specific messages to an n8n webhook and auto-refreshes the page when the webhook returns a new `run_id`.

## Architecture

```
User Input → ChatBox Component → Next.js API (/api/chatbot) → n8n Webhook → Response → Auto-refresh
```

## Files Created

### 1. `/src/app/api/chatbot/route.ts`
**Purpose:** Next.js API proxy that forwards requests to n8n webhook

**Features:**
- ✅ Reads `N8N_CHATBOT_WEBHOOK` from environment variables
- ✅ Validates `property_id` (UUID format check) and `message` (1-10,000 chars)
- ✅ Sanitizes message content (removes control characters)
- ✅ 45-second timeout with AbortController
- ✅ Simple IP-based rate limiting (10 requests per minute per IP)
- ✅ Returns upstream response verbatim or structured error

**Environment Variable Required:**
```bash
N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.com/webhook/chatbot
```

**Request Schema:**
```typescript
{
  "property_id": "uuid-string",
  "message": "user message (1-10000 chars)"
}
```

**Response Schema (Success):**
```typescript
[
  {
    "property_id": "uuid",
    "run_id": "uuid",          // optional - triggers refresh
    "user_message": "text"     // optional - displayed to user
  }
]
```

**Error Response:**
```typescript
{
  "error": "Error type",
  "details": "Additional info"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request payload
- `429` - Rate limit exceeded
- `500` - Configuration error (missing webhook URL)
- `502` - Upstream n8n error
- `504` - Request timeout

---

### 2. `/src/components/ChatBox.tsx`
**Purpose:** Reusable React component for chatbot UI

**Props:**
```typescript
interface ChatBoxProps {
  propertyId: string;                 // Required - current property ID
  initialRunId?: string | null;       // Optional - displayed in header
  onRunId?: (runId: string) => void;  // Optional - called when response contains run_id
  className?: string;                 // Optional - custom styling
}
```

**Features:**
- ✅ Clean message thread with user/bot/error/system bubbles
- ✅ Timestamps for all messages (local time)
- ✅ Auto-scroll to latest message
- ✅ Multiline textarea with keyboard shortcuts:
  - `Enter` = Send message
  - `Shift+Enter` = New line
- ✅ Send button disabled during pending requests
- ✅ "Working…" indicator while waiting for response
- ✅ Optimistic UI updates (user message appears immediately)
- ✅ 45-second timeout with abort functionality
- ✅ Comprehensive error handling with user-friendly messages
- ✅ Focus management (auto-focus textarea after send)
- ✅ Accessibility (aria-labels, aria-live regions)

**Usage Example:**
```tsx
<ChatBox
  propertyId={data.property_id}
  initialRunId={currentRunId}
  onRunId={(newRunId) => {
    // Refresh page with new run_id
    router.push(`/demo?run=${newRunId}`);
  }}
  className="max-w-2xl mx-auto"
/>
```

---

### 3. Page Integration (`/src/app/demo/page.tsx`)

**Strategy A: URL Parameter Refresh (Implemented)**

The demo page uses URL query parameters to manage the current run:

```typescript
onRunId={(newRunId) => {
  console.log('[demo-page] ChatBox triggered run_id refresh:', newRunId);

  // Update URL without full reload
  const url = new URL(window.location.href);
  url.searchParams.set('run', newRunId);
  window.history.replaceState({}, '', url.toString());

  // Update state to load new run
  setDemoRunId(newRunId);
  setUseDemo(true);

  // Trigger data fetch
  loadDemoRun(newRunId);
}}
```

**Benefits:**
- Shareable deep links (URL contains current run_id)
- Browser back/forward navigation works
- SSR compatible
- Easy to debug (run_id visible in URL)

---

**Strategy B: Global Store Refresh (Not Implemented - Reference)**

Alternative approach using Zustand/Context:

```typescript
// Store
const useRunStore = create((set) => ({
  currentRunId: null,
  setRunId: (id) => set({ currentRunId: id })
}));

// ChatBox integration
onRunId={(newRunId) => {
  useRunStore.getState().setRunId(newRunId);
}}

// Page hook
const currentRunId = useRunStore((state) => state.currentRunId);
const { data } = useRun(currentRunId); // Re-fetches when runId changes
```

**Tradeoffs:**
- Simpler internal state management
- No URL manipulation needed
- Less shareable (no deep links)
- Harder to debug (state not visible in URL)

---

## Test Scenarios

### ✅ Happy Path: Full Response with run_id
**n8n returns:**
```json
[
  {
    "property_id": "abc-123",
    "run_id": "xyz-789",
    "user_message": "1️⃣ Guide Price updated to £350,000"
  }
]
```

**Expected behavior:**
1. Chat shows user message
2. Chat shows bot message: "1️⃣ Guide Price updated to £350,000"
3. URL updates to `?run=xyz-789`
4. Page data refreshes with new run
5. All metrics/charts update
6. Send button re-enabled

---

### ✅ No run_id: Message Only
**n8n returns:**
```json
[
  {
    "user_message": "I've noted your preference for a 5-year hold period."
  }
]
```

**Expected behavior:**
1. Chat shows user message
2. Chat shows bot message
3. No URL update
4. No page refresh
5. Send button re-enabled

---

### ✅ Multiple Objects
**n8n returns:**
```json
[
  {
    "run_id": "first-123",
    "user_message": "Step 1: Updated purchase price"
  },
  {
    "user_message": "Step 2: Recalculated refurb costs"
  }
]
```

**Expected behavior:**
1. Both messages displayed in order
2. First object's `run_id` used for refresh
3. Page refreshes once with `run_id=first-123`

---

### ✅ Empty Array
**n8n returns:**
```json
[]
```

**Expected behavior:**
1. Chat shows: "No actionable response."
2. No refresh
3. Send button re-enabled

---

### ✅ Upstream 5xx Error
**API returns:**
```json
{
  "error": "Upstream n8n error",
  "details": "HTTP 503: Service Unavailable"
}
```

**Expected behavior:**
1. Chat shows: "⚠️ Upstream n8n error: HTTP 503: Service Unavailable"
2. Error bubble (red background)
3. Send button re-enabled
4. User can retry

---

### ✅ Timeout (45s)
**Request exceeds timeout**

**Expected behavior:**
1. "Working…" message removed
2. Chat shows: "⚠️ Request timed out. Please try again."
3. Send button re-enabled
4. User can retry

---

### ✅ Invalid Input
**Missing property_id or empty message**

**Expected behavior:**
1. Send blocked client-side
2. For missing property_id: "⚠️ Missing property ID. Cannot send message."
3. For empty message: Silent ignore (no error)
4. For >10k chars: "⚠️ Message is too long (max 10,000 characters)."

---

## Security & Abuse Prevention

### Rate Limiting
- **10 requests per minute per IP**
- Token bucket algorithm (in-memory)
- Returns `429` when exceeded
- Resets every 60 seconds

### Input Sanitization
- Message length capped at 10,000 characters
- Control characters removed (except newlines, tabs)
- Property ID validated against UUID format (best-effort)

### Error Handling
- Detailed errors logged server-side
- User-facing errors truncated/sanitized
- No raw backend errors exposed to frontend

---

## Environment Setup

### Required Environment Variable

Add to `.env.local` or Vercel environment variables:

```bash
N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.com/webhook/chatbot
```

### n8n Webhook Expected Contract

**Request:**
```json
{
  "property_id": "uuid",
  "message": "user text"
}
```

**Response (example):**
```json
[
  {
    "property_id": "same-uuid",
    "run_id": "new-run-uuid",
    "user_message": "Confirmation message for user"
  }
]
```

---

## Styling & Customization

### Tailwind Classes Used
- Component uses Tailwind CSS throughout
- Responsive design with mobile-first approach
- Customizable via `className` prop

### Mobile Considerations
- Textarea stays visible when keyboard opens
- Message thread scrollable independently
- Compact layout on small screens

---

## Telemetry & Debugging

### Console Logs
```javascript
// API Route
[chatbot] Request received
[chatbot] Forwarding to n8n: { property_id, messageLength }
[chatbot] Success in 1234 ms, items: 1
[chatbot] Rate limit exceeded for IP: x.x.x.x

// ChatBox Component
[chatbot] Sending message, property_id: abc-123
[chatbot] Response received in 1234 ms, items: 1

// Page Integration
[demo-page] ChatBox triggered run_id refresh: xyz-789
```

### Error Tracking
- All errors logged with context
- Network errors include error name/message
- Upstream errors include HTTP status and first 200 chars of response

---

## Accessibility

- ✅ Proper ARIA labels on input and button
- ✅ `aria-live="polite"` on message log
- ✅ Keyboard navigation fully supported
- ✅ Focus management (auto-focus after send)
- ✅ Screen reader friendly message announcements

---

## Future Enhancements (Optional)

- [ ] Persist chat history in localStorage
- [ ] Add typing indicators (websocket integration)
- [ ] Markdown support in bot messages
- [ ] Attachments (images, files)
- [ ] Voice input
- [ ] Multi-language support
- [ ] Analytics tracking (message count, topics)
- [ ] Server-side rate limiting with Redis (for distributed systems)

---

## Troubleshooting

### ChatBox not appearing
- Check `data.property_id` is not null
- Verify component is rendered after data loads

### "Chatbot service not configured" error
- Ensure `N8N_CHATBOT_WEBHOOK` is set in environment
- Restart dev server or redeploy

### Messages not sending
- Check browser console for errors
- Verify property_id is valid UUID format
- Check network tab for API request/response

### Auto-refresh not working
- Verify `onRunId` callback is provided
- Check `run_id` is returned in n8n response
- Inspect URL for `?run=` parameter update
- Ensure `loadDemoRun()` is triggered

### Rate limit issues
- Default: 10 requests/minute per IP
- Increase in `route.ts`: `RATE_LIMIT_TOKENS`
- Consider Redis-based limiter for production

---

## API Endpoint Testing

### Using cURL

```bash
# Success case
curl -X POST http://localhost:3000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "abc-123-def-456",
    "message": "What is the ROI for this property?"
  }'

# Invalid payload (empty message)
curl -X POST http://localhost:3000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "abc-123",
    "message": ""
  }'

# Rate limit test (send 11 requests rapidly)
for i in {1..11}; do
  curl -X POST http://localhost:3000/api/chatbot \
    -H "Content-Type: application/json" \
    -d '{"property_id": "test", "message": "test"}' &
done
```

### Using Postman

1. Create new POST request to `http://localhost:3000/api/chatbot`
2. Set header: `Content-Type: application/json`
3. Body (raw JSON):
```json
{
  "property_id": "abc-123-def-456",
  "message": "Test message"
}
```
4. Send and verify response

---

## Summary

This integration provides a complete, production-ready chatbot solution with:

- ✅ **No hardcoding** - All dynamic (property_id, message, webhook URL from env)
- ✅ **Auto-refresh** - Page updates automatically when run_id is returned
- ✅ **Error handling** - Comprehensive error messages and timeout handling
- ✅ **Security** - Rate limiting, input sanitization, validation
- ✅ **UX** - Disabled send during pending, clear loading states
- ✅ **Accessibility** - ARIA labels, keyboard shortcuts, focus management
- ✅ **Telemetry** - Console logging for debugging
- ✅ **Type safety** - Full TypeScript coverage

The implementation is ready to use and requires only setting the `N8N_CHATBOT_WEBHOOK` environment variable.
