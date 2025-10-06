# Chatbot Integration - Quick Start

## 1. Set Environment Variable

Add to `.env.local`:

```bash
N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.com/webhook/chatbot
```

Or add to Vercel environment variables.

---

## 2. Import ChatBox Component

In your page/component:

```tsx
import ChatBox from '@/components/ChatBox';
```

---

## 3. Add ChatBox to Your Page

```tsx
{data?.property_id && (
  <ChatBox
    propertyId={data.property_id}
    initialRunId={currentRunId}
    onRunId={(newRunId) => {
      // Option A: Update URL and trigger refresh
      const url = new URL(window.location.href);
      url.searchParams.set('run', newRunId);
      window.history.replaceState({}, '', url.toString());
      loadNewRun(newRunId);

      // Option B: Use router (Next.js App Router)
      // router.push(`/demo?run=${newRunId}`);

      // Option C: Update global state
      // setCurrentRunId(newRunId);
    }}
    className="max-w-2xl mx-auto"
  />
)}
```

---

## 4. n8n Webhook Setup

Your n8n webhook should:

### Accept Request:
```json
{
  "property_id": "uuid",
  "message": "user text"
}
```

### Return Response:
```json
[
  {
    "property_id": "same-uuid",
    "run_id": "new-run-uuid",  // ← Triggers auto-refresh (optional)
    "message": "Reply message"  // ← Displayed to user
  }
]
```

**Notes:**
- `run_id` is optional - if present, page will refresh with new run
- `message` is required - shown as bot reply (plain text, no markdown)
- Legacy `user_message` also supported for backward compatibility
- Can return multiple objects in array
- Empty array `[]` is valid (shows "No actionable response")

**⚠️ Important:** See `N8N_WEBHOOK_GUIDE.md` for detailed n8n configuration instructions.

---

## 5. Test It

### Start dev server:
```bash
npm run dev
```

### Test the API directly:
```bash
curl -X POST http://localhost:3000/api/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "test-property-123",
    "message": "What is the ROI?"
  }'
```

### Expected flow:
1. User types message → clicks Send
2. Send button disables, shows "Sending..."
3. "Working…" indicator appears
4. n8n processes request
5. Bot reply appears in chat
6. If `run_id` present → page refreshes with new data
7. Send button re-enables

---

## Common Use Cases

### Update Property Details
```
User: "Change the purchase price to £350,000"
Bot:  "✓ Purchase price updated to £350,000"
→ run_id returned → page refreshes with new analysis
```

### Ask Questions (No Refresh)
```
User: "What's the yield on this property?"
Bot:  "The gross yield is 5.2% based on current rent"
→ no run_id → chat continues, no page refresh
```

### Multiple Updates
```
n8n returns:
[
  { "message": "Step 1: Updated price", "run_id": "abc-123", "property_id": "xyz" },
  { "message": "Step 2: Recalculated refurb", "property_id": "xyz" }
]

→ Both messages shown
→ Page refreshes using first run_id (abc-123)
```

---

## Error Handling

All errors display user-friendly messages:

- **Timeout (45s):** "⚠️ Request timed out. Please try again."
- **Network Error:** "⚠️ Network error: [details]"
- **Server Error:** "⚠️ [error message from server]"
- **Rate Limit:** "⚠️ Rate limit exceeded"
- **Invalid Input:** "⚠️ Message is too long (max 10,000 characters)"

Send button always re-enables after error.

---

## Keyboard Shortcuts

- `Enter` → Send message
- `Shift + Enter` → New line in message

---

## Styling

Customize with `className` prop:

```tsx
<ChatBox
  propertyId={propertyId}
  onRunId={handleRunId}
  className="w-full max-w-4xl mx-auto shadow-lg"
/>
```

---

## Security

- ✅ Rate limited: 10 requests/minute per IP
- ✅ Input validation: 1-10,000 chars
- ✅ Sanitization: Control characters removed
- ✅ Timeout: 45 seconds max
- ✅ No hardcoded secrets

---

## Troubleshooting

**ChatBox doesn't appear:**
- Ensure `property_id` exists and is not null

**"Chatbot service not configured":**
- Set `N8N_CHATBOT_WEBHOOK` env variable
- Restart dev server

**Messages not sending:**
- Check browser console for errors
- Verify n8n webhook is accessible
- Check Network tab for API response

**Auto-refresh not working:**
- Verify `onRunId` callback is provided
- Check n8n response includes `run_id`
- Ensure `run_id` update triggers data refetch

---

## Complete Example

```tsx
'use client';

import { useState } from 'react';
import ChatBox from '@/components/ChatBox';

export default function PropertyPage() {
  const [currentRunId, setCurrentRunId] = useState('initial-run-123');
  const propertyId = 'property-abc-456';

  // This would be your actual data fetching hook
  // that refetches when currentRunId changes
  const { data } = usePropertyData(currentRunId);

  return (
    <div className="container mx-auto p-4">
      <h1>Property Analysis</h1>

      {/* Your property data display */}
      <div className="my-8">
        {/* Charts, metrics, etc. */}
      </div>

      {/* Chatbot */}
      <ChatBox
        propertyId={propertyId}
        initialRunId={currentRunId}
        onRunId={(newRunId) => {
          console.log('New run:', newRunId);
          setCurrentRunId(newRunId);
          // Data will auto-refresh via usePropertyData hook
        }}
        className="max-w-2xl mx-auto"
      />
    </div>
  );
}
```

---

## That's It! 🎉

Your chatbot is ready to use. Just set the environment variable and the component will handle the rest.

For detailed documentation, see `CHATBOT_INTEGRATION.md`.
