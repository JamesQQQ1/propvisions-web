# 🚀 Chatbot Deployment Checklist

Use this checklist to ensure proper deployment of the chatbot feature.

---

## ✅ Pre-Deployment (Development)

### Environment Setup
- [ ] `N8N_CHATBOT_WEBHOOK` set in `.env.local`
- [ ] Dev server restarted after setting env variable
- [ ] Chatbot appears on `/demo` page when property data loads
- [ ] Test send/receive with a mock message

### n8n Webhook Configuration
- [ ] n8n webhook URL is accessible from your dev environment
- [ ] Webhook accepts POST requests
- [ ] Webhook returns JSON array format: `[{ message, property_id, run_id? }]`
- [ ] Test webhook directly with cURL (see `N8N_WEBHOOK_GUIDE.md`)
- [ ] Verify `message` field contains plain text (no markdown)
- [ ] Verify `property_id` matches input
- [ ] Verify `run_id` only included when data actually changes

### Testing Scenarios
- [ ] **Question test:** Ask "What's the ROI?" → Verify message displays, no refresh
- [ ] **Update test:** Say "Change price to £350k" → Verify message + page refresh
- [ ] **Error test:** Disconnect n8n → Verify error message shows
- [ ] **Timeout test:** Make n8n delay 50s → Verify timeout message
- [ ] **Rate limit test:** Send 11 messages rapidly → Verify 429 error on 11th
- [ ] **Invalid input:** Send empty message → Verify blocked
- [ ] **Invalid input:** Send 10,001 char message → Verify validation error

### Code Quality
- [ ] Build completes successfully: `npm run build`
- [ ] No TypeScript errors in chatbot files
- [ ] Console logs are informative (not verbose)
- [ ] No hardcoded values (property_id, message, webhook URL)

---

## ✅ Deployment (Staging/Production)

### Environment Variables
- [ ] `N8N_CHATBOT_WEBHOOK` set in Vercel/production environment
- [ ] Environment variable is correct (no trailing slashes, correct protocol)
- [ ] Environment variable is using production n8n instance (not dev)

### n8n Production Setup
- [ ] Production n8n webhook is live and accessible
- [ ] Webhook has proper authentication/security if needed
- [ ] Webhook has been tested with production data
- [ ] Webhook response format validated: `[{ message, property_id, run_id? }]`
- [ ] Webhook error handling tested (returns valid JSON even on errors)

### Deployment
- [ ] Code deployed to staging/production
- [ ] Deployment successful (no build errors)
- [ ] Visit `/demo` page → Verify chatbot appears
- [ ] Send test message → Verify response received
- [ ] Check production logs for any errors

### Functional Testing (Production)
- [ ] **Basic chat:** Send question → Verify response
- [ ] **Auto-refresh:** Trigger update with `run_id` → Verify page refreshes
- [ ] **Error handling:** Intentionally cause error → Verify graceful degradation
- [ ] **Mobile:** Test on mobile device → Verify layout works
- [ ] **Keyboard:** Test Enter/Shift+Enter shortcuts
- [ ] **Accessibility:** Test with screen reader if possible

---

## ✅ Post-Deployment

### Monitoring
- [ ] Set up error tracking for `/api/chatbot` endpoint
- [ ] Monitor rate limiting (check for abuse)
- [ ] Monitor n8n webhook response times
- [ ] Monitor n8n webhook error rates
- [ ] Check for 5xx errors in chatbot API logs

### Documentation
- [ ] Update user-facing docs to mention chatbot feature
- [ ] Train support team on chatbot capabilities
- [ ] Document what chatbot can/cannot do for end users
- [ ] Create internal troubleshooting guide

### Performance
- [ ] Check API response times (should be <5s under normal conditions)
- [ ] Verify rate limiting is adequate (adjust if needed)
- [ ] Monitor n8n server load
- [ ] Consider scaling n8n if response times increase

---

## ✅ Optional Enhancements (Post-Launch)

### Analytics
- [ ] Track chatbot usage (messages sent per day)
- [ ] Track success rate (messages with responses vs errors)
- [ ] Track most common questions/commands
- [ ] Track average response time

### UX Improvements
- [ ] Consider adding chat history persistence (localStorage)
- [ ] Add example prompts/suggestions for new users
- [ ] Add typing indicator animation
- [ ] Consider voice input for accessibility

### Technical Improvements
- [ ] Implement Redis-based rate limiting for distributed systems
- [ ] Add request/response logging for debugging
- [ ] Add metrics dashboard for chatbot performance
- [ ] Implement A/B testing for different prompt suggestions

---

## ✅ Rollback Plan

If issues arise after deployment:

### Quick Disable (No Code Change)
- [ ] Remove `N8N_CHATBOT_WEBHOOK` env variable
- [ ] Chatbot will show "Service not configured" error
- [ ] Users cannot send messages
- [ ] Rest of app continues working normally

### Code Rollback
- [ ] Revert to previous deployment
- [ ] ChatBox component won't render if `property_id` is not available
- [ ] No breaking changes to existing features

### Gradual Rollout
- [ ] Use feature flag to enable for % of users
- [ ] Monitor metrics for that cohort
- [ ] Gradually increase % if successful

---

## 📋 Common Issues Checklist

| Issue | Check | Solution |
|-------|-------|----------|
| "Service not configured" | Env variable set? | Add `N8N_CHATBOT_WEBHOOK` |
| Messages not sending | Network tab shows error? | Check n8n webhook URL/auth |
| No response received | n8n webhook returning data? | Test webhook with cURL |
| Auto-refresh not working | Response includes `run_id`? | Verify n8n returns `run_id` |
| Rate limit errors | Too many requests? | Adjust `RATE_LIMIT_TOKENS` |
| Timeout errors | n8n taking >45s? | Optimize n8n workflow |

---

## 📞 Emergency Contacts

- **Backend/n8n issues:** [Your n8n admin]
- **Frontend issues:** [Your frontend team]
- **Deployment issues:** [Your DevOps team]

---

## 📊 Success Metrics

Define success criteria for chatbot launch:

- [ ] >80% message success rate (responses received without errors)
- [ ] <3s average response time
- [ ] <1% error rate (5xx errors)
- [ ] Positive user feedback
- [ ] No performance degradation of main app
- [ ] <5% support tickets related to chatbot

---

## 🎯 Go/No-Go Decision

Before deploying to all users, verify:

- [ ] All pre-deployment checks pass ✅
- [ ] All deployment checks pass ✅
- [ ] Staging testing successful ✅
- [ ] Rollback plan documented ✅
- [ ] Team trained and ready ✅

**If all boxes checked → GO FOR LAUNCH! 🚀**

---

## 📝 Notes

Add any deployment-specific notes here:

```
Date: _____________
Deployed by: _____________
n8n version: _____________
Any special considerations: _____________
```

---

**Good luck with your deployment! 🎉**
