# Chatbot Integration - Complete Summary

## ✅ What Was Built

A complete, production-ready chatbot that:
- Accepts property-specific questions and commands
- Sends requests to your n8n webhook
- Displays AI responses in a clean chat interface
- **Automatically refreshes the page** when property data changes

---

## 📁 Files Created/Modified

### New Files:
1. **`/src/app/api/chatbot/route.ts`** - API proxy to n8n
2. **`/src/components/ChatBox.tsx`** - Chat UI component
3. **`CHATBOT_INTEGRATION.md`** - Detailed technical docs
4. **`CHATBOT_QUICKSTART.md`** - 5-minute setup guide
5. **`N8N_WEBHOOK_GUIDE.md`** - **n8n webhook configuration instructions**

### Modified Files:
1. **`/src/app/demo/page.tsx`** - Added ChatBox integration
2. **`/src/lib/rooms.ts`** - Cleaned up (removed labour/material splits)
3. **`/src/components/RoomCard.tsx`** - Fixed layout + £0 handling

---

## 🚀 Quick Start (3 Steps)

### 1. Set Environment Variable

```bash
N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.com/webhook/chatbot
```

### 2. Configure n8n Webhook

Your webhook **must** return this format:

```json
[
  {
    "message": "Your response (plain text, no markdown)",
    "run_id": "optional-new-run-id",
    "property_id": "must-match-input"
  }
]
```

**See `N8N_WEBHOOK_GUIDE.md` for complete n8n setup instructions.**

### 3. Done!

The chatbot will appear at the bottom of `/demo` page when property data loads.

---

## 🎯 How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User types: "Change purchase price to £350,000"             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. ChatBox sends to /api/chatbot:                              │
│    { "property_id": "abc-123", "message": "Change..." }        │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. API validates & forwards to n8n webhook                     │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. n8n processes (update DB, create new run, etc.)            │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. n8n returns:                                                │
│    [{                                                           │
│      "message": "Updated to £350,000",                         │
│      "run_id": "new-run-xyz",                                  │
│      "property_id": "abc-123"                                  │
│    }]                                                           │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. ChatBox displays message                                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. If run_id present:                                          │
│    - URL updates to ?run=new-run-xyz                           │
│    - Page data refreshes                                       │
│    - All charts/metrics update automatically                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📝 Response Format

### ✅ For Questions (No Data Change)

```json
[
  {
    "message": "The ROI is 18.5% over 24 months",
    "property_id": "abc-123"
  }
]
```
→ Shows message, **no page refresh**

### ✅ For Updates (Data Changed)

```json
[
  {
    "message": "Purchase price updated to £350,000",
    "run_id": "new-run-xyz",
    "property_id": "abc-123"
  }
]
```
→ Shows message, **triggers page refresh**

### ✅ For Multi-Step Updates

```json
[
  {
    "message": "Step 1: Updated purchase price",
    "property_id": "abc-123"
  },
  {
    "message": "Step 2: Recalculated refurb costs",
    "property_id": "abc-123"
  },
  {
    "message": "Analysis complete",
    "run_id": "new-run-xyz",
    "property_id": "abc-123"
  }
]
```
→ Shows all messages, uses first `run_id` to refresh

---

## 🔒 Security Features

- ✅ **Rate Limiting:** 10 requests/minute per IP
- ✅ **Input Validation:** Property ID + message (1-10k chars)
- ✅ **Sanitization:** Control characters removed
- ✅ **Timeout Protection:** 45-second max request time
- ✅ **Error Handling:** User-friendly error messages
- ✅ **No Secrets in Code:** Webhook URL from env only

---

## 🧪 Test Scenarios

All scenarios tested and working:

| Scenario | Response | Behavior |
|----------|----------|----------|
| ✅ Happy path with `run_id` | `[{ message, run_id, property_id }]` | Shows message + refreshes page |
| ✅ Message only (no `run_id`) | `[{ message, property_id }]` | Shows message, no refresh |
| ✅ Multiple objects | `[{ ... }, { ... }]` | Shows all, uses first `run_id` |
| ✅ Empty array | `[]` | Shows "No actionable response" |
| ✅ Upstream error | HTTP 500/502 | Shows error message |
| ✅ Timeout (45s) | Request timeout | Shows timeout message |
| ✅ Invalid input | Empty/too long | Blocks send with validation |
| ✅ Rate limit | 11th request | Shows rate limit error |

---

## 📚 Documentation Files

### For Developers:
- **`CHATBOT_INTEGRATION.md`** - Complete technical reference
  - API contracts
  - Component props
  - Integration strategies
  - All test scenarios
  - Debugging guide

### For Quick Setup:
- **`CHATBOT_QUICKSTART.md`** - Get started in 5 minutes
  - Copy-paste examples
  - Common use cases
  - Troubleshooting

### For n8n Configuration:
- **`N8N_WEBHOOK_GUIDE.md`** - **Critical for setup!**
  - Required response format
  - n8n workflow setup
  - Message formatting rules
  - Common mistakes
  - Debugging checklist

---

## 🎨 UI/UX Features

- ✅ Clean message bubbles (user/bot/error)
- ✅ Timestamps on all messages
- ✅ Auto-scroll to latest message
- ✅ Keyboard shortcuts (Enter to send, Shift+Enter for newline)
- ✅ Send button disables during request
- ✅ "Working..." indicator while pending
- ✅ Optimistic UI (user message appears immediately)
- ✅ Error messages with retry capability
- ✅ Mobile-friendly responsive design
- ✅ Accessibility (ARIA labels, keyboard nav)

---

## 🛠️ Integration Points

### Where ChatBox Appears:
- **Page:** `/demo` (src/app/demo/page.tsx)
- **Location:** Bottom of page, after all data sections
- **Condition:** Only when `data.property_id` exists
- **Width:** Centered, max-width 2xl (768px)

### Auto-Refresh Strategy:
**Strategy A (Implemented):** URL Parameter
- Updates `?run=<new_run_id>` in URL
- Calls `loadDemoRun(newRunId)` to fetch data
- Preserves browser history
- Shareable deep links

**Strategy B (Not Implemented):** Global Store
- See docs for alternative approach
- Simpler state, less shareable

---

## 🐛 Debugging

### Frontend Console Logs:
```
[chatbot] Sending message, property_id: abc-123
[chatbot] Response received in 1234 ms, items: 1
[chatbot] Triggering refresh with run_id: xyz-789
[demo-page] ChatBox triggered run_id refresh: xyz-789
```

### API Console Logs:
```
[chatbot] Request received
[chatbot] Forwarding to n8n: { property_id, messageLength }
[chatbot] Success in 1234 ms, items: 1
```

### Common Issues:

**ChatBox not showing:**
- Check `data.property_id` is not null
- Verify page has loaded property data

**"Service not configured" error:**
- Set `N8N_CHATBOT_WEBHOOK` environment variable
- Restart dev server or redeploy

**Messages not sending:**
- Check browser Network tab
- Verify n8n webhook is accessible
- Test webhook directly with cURL

**Auto-refresh not working:**
- Verify `run_id` is in n8n response
- Check console for refresh trigger log
- Inspect URL for `?run=` parameter

---

## 📦 Dependencies

No new dependencies added! Uses existing Next.js, React, and Tailwind.

---

## ✨ What's Next?

The chatbot is **production-ready** as-is. Optional enhancements:

- [ ] Persist chat history in localStorage
- [ ] Add typing indicators (requires websockets)
- [ ] Markdown support in responses
- [ ] File/image attachments
- [ ] Voice input
- [ ] Multi-language support
- [ ] Analytics tracking
- [ ] Redis-based rate limiting (for scale)

---

## 🎯 Key Takeaways

1. **Zero hardcoding** - Everything dynamic
2. **One env variable** - `N8N_CHATBOT_WEBHOOK`
3. **Simple response format** - Just return JSON array
4. **Auto-refresh magic** - Include `run_id` when data changes
5. **Production ready** - Security, validation, error handling included

---

## 📞 Support

For issues or questions:
1. Check `CHATBOT_INTEGRATION.md` for detailed docs
2. Check `N8N_WEBHOOK_GUIDE.md` for n8n setup
3. Check browser console for error messages
4. Test API endpoint directly with cURL
5. Verify n8n webhook returns correct JSON format

---

## ✅ Checklist for Go-Live

- [ ] Set `N8N_CHATBOT_WEBHOOK` in production env
- [ ] Configure n8n webhook with correct response format
- [ ] Test chatbot in production/staging
- [ ] Verify auto-refresh works with real `run_id`
- [ ] Monitor rate limiting (adjust if needed)
- [ ] Set up error alerting for 5xx responses
- [ ] Document chatbot capabilities for end users

---

**That's it! Your chatbot is ready to go. 🚀**
