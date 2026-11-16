# MailPilot – Future Improvements

## 1. Purpose

This document contains planned improvements and future technical enhancements for MailPilot.

It helps track:
- Features that are not implemented yet.
- Existing limitations.
- Why an improvement is needed.
- Expected technical benefits.
- Implementation priorities.

---

## 2. Priority 1 – Autosave Improvements

### Current Situation
MailPilot automatically saves email compositions to MongoDB.

However, testing revealed two limitations:
- Failed saves are not automatically retried after the connection returns.
- Unsaved changes can be lost if the browser is refreshed after a failed save.

### Planned Improvements

**1. Automatic Retry**
- Retry failed saves after temporary network or server errors.
- Use bounded retries with increasing delays (backoff).
- Avoid retrying indefinitely.

**2. Local Draft Recovery**
- Temporarily preserve unsaved changes in browser storage.
- Restore the changes after a refresh.
- Scope local recovery data to the logged-in user.

**3. Conflict Protection**
- Never overwrite a newer MongoDB draft with stale local data.
- Preserve existing multi-tab version checking.

**Expected Benefits**
- Reduced risk of losing email content.
- Better handling of temporary network failures.
- More reliable composition experience.

**Status:** Pending implementation.

---

## 3. Priority 2 – Bulk Email Improvements

### Current Situation
MailPilot supports bulk email sending. Further improvements are needed for better control and reliability.

### Planned Improvements

**1. Sending Progress**
- Show total recipients.
- Show successful and failed sends.
- Display current sending progress.

**2. Cancellation**
- Allow users to stop a bulk sending operation.
- Do not start additional sends after cancellation is accepted.

**3. Retry Failed Recipients**
- Keep track of recipients whose emails failed.
- Allow retrying only failed recipients.
- Avoid resending to recipients who already succeeded.

**4. Recipient Validation**
- Validate email addresses.
- Remove duplicate addresses.
- Show invalid recipients before sending.

**Expected Benefits**
- Better visibility into bulk sending.
- Easier failure recovery.
- Reduced duplicate emails.

**Status:** Planned.

---

## 4. Priority 3 – Redis + BullMQ Background Processing

### Current Situation
Bulk email sending currently runs through the backend request flow.

For larger campaigns, processing every email inside a single HTTP request can cause long response times and timeout problems.

### Planned Improvements

Introduce:

- Redis for temporary queue data and job coordination.
- BullMQ for managing background jobs.
- Separate worker process for email sending.
- Retry failed jobs when appropriate.
- Track job progress.
- Handle individual recipient failures.

### Proposed Flow

1. User submits a bulk email campaign.
2. Backend validates the request.
3. Backend creates a campaign and recipient records.
4. Email jobs are added to BullMQ.
5. Redis stores queue-related data.
6. A background worker processes jobs.
7. Worker sends emails through Gmail API.
8. Results are saved in MongoDB.
9. Frontend displays progress and results.

### Expected Benefits
- Faster API responses.
- Background email processing.
- Better scalability.
- Improved retry and failure handling.
- Better campaign progress tracking.

**Status:** Planned – not implemented yet.

---

## 5. Priority 4 – Production Security

### Planned Improvements

**1. Rate Limiting**
- Limit repeated API requests.
- Protect authentication and email sending endpoints.
- Reduce accidental or abusive requests.

**2. Input Validation**
- Validate all user inputs on the backend.
- Validate recipient lists and email content.
- Reject invalid requests before processing.

**3. Authorization**
- Ensure users can access only their own Gmail accounts, templates, drafts, and email history.
- Verify ownership before reading, updating, or deleting records.

**4. OAuth Security**
- Protect OAuth state validation.
- Encrypt refresh tokens.
- Keep credentials and secrets outside source control.

**5. Error Handling**
- Return safe error messages to clients.
- Avoid exposing tokens, passwords, or internal stack traces.

**Expected Benefits**
- Better protection of user accounts and data.
- More reliable API behaviour.
- Safer production deployment.

**Status:** Planned improvements and ongoing security review.

---

## 6. Priority 5 – Additional Product Features

| Feature | Purpose |
|---|---|
| CSV Import | Upload recipient lists from CSV files |
| Personalized Bulk Emails | Use placeholders such as `{{name}}` |
| Campaign Dashboard | View campaign statistics |
| CSV Export | Export email history and campaign results |
| Scheduled Emails | Send emails at a selected time |
| Email Search and Filters | Find previous emails quickly |
| Draft Recovery | Restore unsaved compositions |
| Better Analytics | Track sending results and failures |

**Status:** Planned.

---

## 7. Implementation Order

| Priority | Improvement | Status |
|---|---|---|
| 1 | Autosave recovery and retry | Pending |
| 2 | Bulk email progress and controls | Pending |
| 3 | Redis + BullMQ | Pending |
| 4 | Production security improvements | Planned |
| 5 | Additional product features | Planned |

---

## 8. Development Notes

Before implementing any improvement:

1. Understand the existing architecture.
2. Identify the files and modules affected.
3. Decide how the change affects existing users.
4. Implement one feature at a time.
5. Test normal and failure scenarios.
6. Update `TESTING.md`.
7. Record important bugs in `BUG-FIXES.md`.
8. Update this document when the feature is completed.

---

**Last Updated:** 16 November 2026