# n8n Webhook Configuration Guide

## Required Response Format

Your n8n webhook **MUST** return a JSON array with this exact structure:

```json
[
  {
    "message": "Your response text here",
    "run_id": "abc-123-def-456",
    "property_id": "xyz-789-uvw-012"
  }
]
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | ✅ Yes | Plain text response shown to the user. No markdown, no asterisks, no escaped newlines. |
| `run_id` | string | ⚠️ Optional | If provided, triggers automatic page refresh with new data. Omit if no data change. |
| `property_id` | string | ✅ Yes | Must match the `property_id` from the incoming request. |

### Alternative Format (Legacy Support)

The frontend also accepts this format for backward compatibility:

```json
[
  {
    "user_message": "Your response text here",
    "run_id": "abc-123-def-456",
    "property_id": "xyz-789-uvw-012"
  }
]
```

**Note:** `message` is preferred. If both are present, `message` takes priority.

---

## n8n Workflow Setup

### Step 1: Webhook Trigger

Create a webhook node that listens for POST requests:

- **Method:** POST
- **Path:** `/webhook/chatbot` (or your chosen path)
- **Response Mode:** Last Node

### Step 2: Extract Input

Access the incoming payload:

```javascript
// In any n8n node, access via:
const propertyId = $json.property_id;
const userMessage = $json.message;
```

Expected input format:
```json
{
  "property_id": "uuid-string",
  "message": "user's question or command"
}
```

### Step 3: Process with AI (Optional)

If using OpenAI, Claude, or another LLM:

```javascript
// Example OpenAI API call setup
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "system",
      "content": "You are a property investment assistant. Always respond with clear, concise advice."
    },
    {
      "role": "user",
      "content": $json.message
    }
  ]
}
```

### Step 4: Format Response (CRITICAL)

Add a **Function** or **Code** node as your **final node** before returning:

```javascript
// n8n Function Node - Response Formatter

// Get the AI response (or your processed result)
const assistantResponse = $json.choices?.[0]?.message?.content ||
                         $json.assistant_response ||
                         $json.result ||
                         "I wasn't able to process that request.";

// Get original context
const propertyId = $('Webhook').item.json.body.property_id;
const runId = $json.run_id || null; // Include if you created a new run

// Clean the message (remove markdown, newlines, etc.)
const cleanMessage = assistantResponse
  .replace(/\*\*/g, '')     // Remove bold markdown **text**
  .replace(/\*/g, '')       // Remove italic markdown *text*
  .replace(/`/g, '')        // Remove code backticks
  .replace(/\n+/g, ' ')     // Replace newlines with spaces
  .replace(/\s+/g, ' ')     // Collapse multiple spaces
  .trim();

// Return formatted response
return [{
  json: {
    message: cleanMessage,
    run_id: runId,
    property_id: propertyId
  }
}];
```

---

## Example Scenarios

### Scenario 1: Simple Question (No Data Change)

**User asks:** "What's the ROI on this property?"

**n8n returns:**
```json
[
  {
    "message": "Based on the current analysis, the ROI is 18.5% over 24 months.",
    "property_id": "abc-123-def-456"
  }
]
```

**Frontend behavior:**
- Displays message in chat
- Does NOT refresh page (no `run_id`)

---

### Scenario 2: Update Property Data

**User asks:** "Change the purchase price to £350,000"

**Your workflow:**
1. Update property in database
2. Create new analysis run → get new `run_id`
3. Return response

**n8n returns:**
```json
[
  {
    "message": "Purchase price updated to £350,000. Recalculating analysis...",
    "run_id": "new-run-xyz-789",
    "property_id": "abc-123-def-456"
  }
]
```

**Frontend behavior:**
- Displays message in chat
- Automatically refreshes page with `run_id=new-run-xyz-789`
- All charts/metrics update with new data

---

### Scenario 3: Multi-Step Update

**User asks:** "Set purchase price to £350k and refurb budget to £50k"

**n8n returns:**
```json
[
  {
    "message": "Updated purchase price to £350,000 and refurb budget to £50,000. Analysis refreshed.",
    "run_id": "updated-run-456",
    "property_id": "abc-123-def-456"
  }
]
```

Or return multiple messages (optional):
```json
[
  {
    "message": "Step 1: Updated purchase price to £350,000",
    "property_id": "abc-123-def-456"
  },
  {
    "message": "Step 2: Updated refurb budget to £50,000",
    "property_id": "abc-123-def-456"
  },
  {
    "message": "Analysis complete. All metrics refreshed.",
    "run_id": "updated-run-456",
    "property_id": "abc-123-def-456"
  }
]
```

**Frontend behavior:**
- Displays all messages in order
- Uses first object's `run_id` (if present) to refresh

---

### Scenario 4: Unable to Process

**User asks:** "Make it purple"

**n8n returns:**
```json
[
  {
    "message": "I wasn't able to understand that request. Could you clarify what you'd like to adjust? For example, you can update purchase price, refurb budget, or ask questions about ROI.",
    "property_id": "abc-123-def-456"
  }
]
```

**Frontend behavior:**
- Displays helpful message
- No page refresh
- User can try again

---

## Message Formatting Best Practices

### ✅ DO:
- Use plain English
- Be concise and clear
- Include specific values when confirming changes
- Provide helpful suggestions for unclear requests

### ❌ DON'T:
- Use markdown formatting (`**bold**`, `*italic*`, `[links]()`)
- Include escaped newlines (`\n`)
- Return raw JSON or code in the message
- Use technical jargon without explanation

### Examples:

**Good:**
```json
{
  "message": "Purchase price updated to £350,000. New ROI: 18.5%"
}
```

**Bad:**
```json
{
  "message": "**Purchase price** updated to `£350,000`.\n\nNew ROI: `18.5%`"
}
```

---

## Error Handling in n8n

If something goes wrong in your workflow, still return valid JSON:

```javascript
// Error handler node
return [{
  json: {
    message: "I encountered an error processing your request. Please try again or contact support if this persists.",
    property_id: $('Webhook').item.json.body.property_id
  }
}];
```

**Don't:**
- Return empty response
- Return error stack traces
- Return non-JSON responses
- Throw unhandled errors (will cause 500 error)

---

## Testing Your Webhook

### Test with cURL:

```bash
curl -X POST https://your-n8n-instance.com/webhook/chatbot \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "test-property-123",
    "message": "What is the ROI?"
  }'
```

### Expected response:
```json
[
  {
    "message": "The ROI for this property is...",
    "property_id": "test-property-123"
  }
]
```

### Check for:
- ✅ Valid JSON array
- ✅ Contains `message` field
- ✅ Contains `property_id` field
- ✅ No markdown formatting in `message`
- ✅ `run_id` present only if data changed

---

## Common Mistakes

### ❌ Mistake 1: Returning an object instead of array

**Wrong:**
```json
{
  "message": "...",
  "property_id": "..."
}
```

**Correct:**
```json
[
  {
    "message": "...",
    "property_id": "..."
  }
]
```

---

### ❌ Mistake 2: Returning markdown formatting

**Wrong:**
```json
[
  {
    "message": "**Purchase price** updated to `£350,000`"
  }
]
```

**Correct:**
```json
[
  {
    "message": "Purchase price updated to £350,000"
  }
]
```

---

### ❌ Mistake 3: Missing property_id

**Wrong:**
```json
[
  {
    "message": "Updated successfully",
    "run_id": "abc-123"
  }
]
```

**Correct:**
```json
[
  {
    "message": "Updated successfully",
    "run_id": "abc-123",
    "property_id": "xyz-789"
  }
]
```

---

### ❌ Mistake 4: Including run_id when no data changed

**Wrong (for a simple question):**
```json
[
  {
    "message": "The ROI is 18.5%",
    "run_id": "same-run-id-as-before",  // ❌ Will trigger unnecessary refresh
    "property_id": "abc-123"
  }
]
```

**Correct:**
```json
[
  {
    "message": "The ROI is 18.5%",
    "property_id": "abc-123"
    // No run_id - just answering a question
  }
]
```

---

## Advanced: Dynamic run_id Creation

If your chatbot can modify property data, you'll need to:

1. Update the property in your database
2. Trigger a new analysis run
3. Get the new `run_id`
4. Return it in the response

Example workflow:

```
1. Webhook Trigger
   ↓
2. Parse user intent (OpenAI/Claude)
   ↓
3. IF intent = "update_price":
   → Update property in database
   → Call your /api/analyze endpoint
   → Get new run_id from response
   ↓
4. Format response with run_id
   ↓
5. Return to frontend
```

---

## Debugging Checklist

If messages aren't displaying correctly:

- [ ] Response is valid JSON array
- [ ] Contains `message` or `user_message` field
- [ ] Contains `property_id` field
- [ ] No markdown formatting in message text
- [ ] No escaped newlines (`\n`)
- [ ] `run_id` only present when data actually changed
- [ ] Test webhook directly with cURL to verify response

Check frontend console for:
```
[chatbot] Response received in X ms, items: Y
```

If items: 0 → your webhook returned empty array
If items: 1+ → check what `message` field contains

---

## Summary

**Your n8n webhook must return:**

```json
[
  {
    "message": "Plain text response (no markdown)",
    "run_id": "optional-only-if-data-changed",
    "property_id": "must-match-input"
  }
]
```

That's it! The frontend handles the rest.
