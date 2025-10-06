# 🤖 Chatbot Integration - Complete Package

> **Production-ready chatbot for property investment dashboard with auto-refresh on data updates**

---

## 🎯 What This Does

Users can chat with an AI assistant about properties. When the assistant updates property data (e.g., "change purchase price to £350k"), the page **automatically refreshes** with new metrics.

---

## ⚡ Quick Start (3 Steps)

### 1️⃣ Set Environment Variable

```bash
N8N_CHATBOT_WEBHOOK=https://your-n8n-instance.com/webhook/chatbot
```

### 2️⃣ Configure n8n Webhook

Return this format:

```json
[
  {
    "message": "Plain text response (no markdown)",
    "run_id": "optional-only-if-data-changed",
    "property_id": "must-match-input"
  }
]
```

**📖 See `N8N_WEBHOOK_GUIDE.md` for complete setup**

### 3️⃣ Done! ✅

Chatbot appears automatically on `/demo` page.

---

## 📚 Documentation Files

| File | Purpose | Read This If... |
|------|---------|-----------------|
| **`CHATBOT_SUMMARY.md`** | **Start here!** Quick overview | You want the big picture |
| **`CHATBOT_QUICKSTART.md`** | 5-minute setup guide | You want to get started fast |
| **`N8N_WEBHOOK_GUIDE.md`** | **Critical!** n8n configuration | You're setting up the webhook |
| **`CHATBOT_INTEGRATION.md`** | Detailed technical docs | You need deep technical details |
| **`n8n-response-example.json`** | JSON examples | You want copy-paste examples |

---

## 🎬 How It Works

```
User: "Change purchase price to £350,000"
  ↓
ChatBox → /api/chatbot → n8n webhook
  ↓
n8n: Updates DB, creates new run
  ↓
Returns: { message: "Updated!", run_id: "xyz" }
  ↓
ChatBox: Shows message + refreshes page
  ↓
All metrics update automatically ✨
```

---

## 📁 Code Files

### Created:
- `/src/app/api/chatbot/route.ts` - API endpoint
- `/src/components/ChatBox.tsx` - Chat UI

### Modified:
- `/src/app/demo/page.tsx` - Added chatbot integration

---

## ✅ Features

- ✅ **Dynamic** - No hardcoded IDs or messages
- ✅ **Auto-refresh** - Page updates when data changes
- ✅ **Smart UX** - Disabled send button, "Working..." indicator
- ✅ **Error handling** - Timeouts, validation, friendly messages
- ✅ **Security** - Rate limiting, input sanitization
- ✅ **Accessible** - ARIA labels, keyboard shortcuts
- ✅ **Mobile-friendly** - Responsive design

---

## 🧪 Tested Scenarios

- ✅ Questions (no data change) → Shows message only
- ✅ Updates (with `run_id`) → Shows message + refreshes
- ✅ Multiple messages → All shown, first `run_id` used
- ✅ Errors/timeouts → User-friendly error messages
- ✅ Rate limiting → 10 requests/minute per IP
- ✅ Invalid input → Validation messages

---

## 🎨 UI Preview

```
┌─────────────────────────────────────────┐
│ Property Assistant    run: abc123...   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ What's the ROI?            10:23│   │
│  └─────────────────────────────────┘   │
│                                         │
│ ┌────────────────────────────────────┐ │
│ │ The ROI is 18.5% over 24 months  │ │
│ │                            10:23 │ │
│ └────────────────────────────────────┘ │
│                                         │
├─────────────────────────────────────────┤
│ ┌───────────────────────────────┐     │
│ │ Type your message...          │     │
│ │                               │     │
│ └───────────────────────────────┘     │
│              Enter to send • Shift+Enter │
│                            [Send]     │
└─────────────────────────────────────────┘
```

---

## 🔧 n8n Response Format

### ✅ For Questions (No Refresh)

```json
[
  {
    "message": "The ROI is 18.5%",
    "property_id": "abc-123"
  }
]
```

### ✅ For Updates (Triggers Refresh)

```json
[
  {
    "message": "Purchase price updated to £350,000",
    "run_id": "new-run-xyz",
    "property_id": "abc-123"
  }
]
```

**Rules:**
- `message` = Plain text (no markdown)
- `run_id` = Only if you created a new run
- `property_id` = Must match input

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| ChatBox not showing | Check `data.property_id` exists |
| "Service not configured" | Set `N8N_CHATBOT_WEBHOOK` env var |
| Messages not sending | Check n8n webhook URL is accessible |
| Auto-refresh not working | Verify `run_id` in n8n response |

**See docs for detailed debugging steps.**

---

## 📊 Build Status

✅ **Build successful** - All TypeScript compiles cleanly

---

## 🚀 Ready to Deploy

1. Set environment variable in Vercel/production
2. Configure n8n webhook (see `N8N_WEBHOOK_GUIDE.md`)
3. Deploy
4. Test chatbot on `/demo` page

---

## 🎓 Learn More

1. **Start with:** `CHATBOT_SUMMARY.md` (overview)
2. **Quick setup:** `CHATBOT_QUICKSTART.md` (5 minutes)
3. **n8n config:** `N8N_WEBHOOK_GUIDE.md` (critical!)
4. **Deep dive:** `CHATBOT_INTEGRATION.md` (technical)
5. **Examples:** `n8n-response-example.json` (copy-paste)

---

## 💡 Example Use Cases

### Update Property Details
```
User: "Change purchase price to £350,000"
Bot:  "✓ Purchase price updated to £350,000. ROI recalculated to 16.2%"
→ Page refreshes with new analysis
```

### Ask Questions
```
User: "What's the yield on this property?"
Bot:  "The gross yield is 5.2% based on annual rent of £17,400"
→ No refresh, just informational
```

### Multi-Step Updates
```
User: "Set price to £350k and refurb to £50k"
Bot:  "Step 1: Updated purchase price to £350,000"
Bot:  "Step 2: Updated refurb budget to £50,000"
Bot:  "Analysis complete. New ROI: 15.8%"
→ Page refreshes with complete new analysis
```

---

## 🎯 Key Takeaways

1. **Zero hardcoding** - Everything is dynamic
2. **One env variable** - Just `N8N_CHATBOT_WEBHOOK`
3. **Simple format** - Return JSON array from n8n
4. **Auto-magic** - Include `run_id` when data changes
5. **Production ready** - Security, errors, validation included

---

## 📞 Need Help?

1. Check the documentation files listed above
2. Review browser console for errors
3. Test n8n webhook directly with cURL
4. Verify response format matches examples

---

**Built with ❤️ using Next.js, React, and Tailwind CSS**

No external dependencies added. Uses your existing stack.

---

## License & Credits

- Next.js App Router
- React 18
- Tailwind CSS
- TypeScript

Built for property investment analysis platform.

---

**Ready to chat! 🚀**
