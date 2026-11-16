# MailPilot — Development Log

## 1. Project Overview

MailPilot is a multi-user email-sending web application. Each registered user can connect their own Gmail account and send individual or bulk emails using the Gmail API.

### Technology Stack
- Frontend: React.js, Vite, Tailwind CSS v4
- Backend: Node.js, Express.js
- Database: MongoDB Atlas, Mongoose
- Authentication: JWT, HTTP-only cookies, bcrypt
- Email Integration: Google OAuth 2.0, Gmail API
- File Uploads: Multer
- Deployment: Vercel (Frontend), Render (Backend)

### Project Links
- GitHub: https://github.com/aakashy5990/MailPilot
- Frontend: https://mail-pilot-coral.vercel.app/
- Backend: https://mailpilot-api-bx1h.onrender.com

---

## 2. Implemented Features

### Authentication
- User Registration
- User Login and Logout
- JWT-based authentication
- Password hashing using bcrypt
- Profile update
- Change password

### Gmail Integration
- Connect Gmail using Google OAuth 2.0
- Each user connects their own Gmail account
- Send emails through Gmail API
- Disconnect Gmail account
- Encrypted OAuth refresh tokens

### Email Features
- Single email sending
- Bulk email sending
- Multiple recipients
- Email templates
- Personalized emails using placeholders such as {{name}}
- Email sending history
- Email details page

### Attachment Management
- Multiple attachments
- File type validation
- File size validation
- Temporary file storage
- Automatic temporary file deletion after sending
- Only attachment metadata is stored in MongoDB

### Draft Management
- Automatic draft saving
- Draft restoration after page refresh
- Multi-tab synchronization
- Draft version checking
- Conflict detection
- Version-aware draft deletion
- BroadcastChannel notifications

---

## 3. Technical Decisions

### Why use Gmail API?
MailPilot sends emails using the user's connected Gmail account. Recipients receive normal emails and do not need a MailPilot account.

### Why separate bulk emails?
Each recipient receives an individual email instead of being included in CC or BCC.

### Why temporary attachment storage?
Original attachment files are not permanently stored in MongoDB. Only metadata is saved in email history.

### Why draft versioning?
Draft versioning prevents an older browser tab from overwriting a newer draft.

### Why BroadcastChannel?
BroadcastChannel allows multiple browser tabs of MailPilot to communicate about draft updates and deletions.

---

## 4. Bugs and Issues Resolved

### Gmail OAuth invalid_grant
Problem:
Gmail API returned invalid_grant while sending emails.

Solution:
Disconnected and reconnected the affected Gmail account through Google OAuth.

Result:
Gmail sending started working again.

Note:
The OAuth application is currently in Testing mode. Refresh-token expiration remains a production-readiness concern.

### Mongoose Deprecation Warning
Problem:
Mongoose displayed a warning about the deprecated new option in findOneAndUpdate().

Solution:
Replaced new: true with returnDocument: "after" in four controller locations:
- Auth Controller
- Composition Controller
- Gmail Controller
- Templates Controller

Result:
The warning disappeared and Gmail sending continued to work.

### Autosave HTTP 409
Problem:
Browser console previously displayed an autosave 409 error.

Investigation:
Normal single-tab editing was tested. Subject and message saved successfully without reproducing the error.

Conclusion:
The error was not reproduced during normal single-tab editing. It may have been caused by a legitimate draft version conflict.

---

## 5. Multi-Tab Synchronization

Implemented:
- Added a version field to EmailComposition.
- Backend checks the client's draft version before updating.
- Version increments after successful updates.
- Stale updates return HTTP 409.
- BroadcastChannel notifies other tabs about draft updates.
- Conflict lock prevents further autosaving after a conflict.
- Version-aware deletion prevents accidental deletion of newer drafts.
- DRAFT_CLEARED event notifies other tabs when a draft is deleted.

### Manual Testing
- Opened the same draft in two tabs.
- Updated the draft in one tab.
- Confirmed the other tab displayed a conflict warning.
- Deleted a draft in one tab.
- Confirmed the other tab displayed a deletion warning.
- Tested normal editing and draft restoration after refresh.

Result:
The tested multi-tab scenarios worked successfully.

---

## 6. Autosave Testing — 2026-11-16

### Test 1: Internet Disconnect
Action:
Disconnected the internet and edited the draft.

Observed:
Unable to save draft. Please check your connection.

Result:
Error handling works.

### Test 2: Internet Reconnect
Action:
Reconnected the internet without editing the draft.

Observed:
The error message remained. Automatic retry was not observed.

Result:
Automatic retry needs improvement.

### Test 3: Refresh After Failed Save
Action:
Refreshed the page after an autosave failure.

Observed:
Unsaved changes disappeared.

Result:
Unsaved draft recovery is required.

### Test 4: Backend Unavailable
Action:
Stopped the local backend using Ctrl + C and edited the draft.

Observed:
Unable to save draft. Please check your connection.

Result:
Backend failure is reported correctly.

### Test 5: Normal Autosave
Action:
Restarted the backend, edited the draft, waited for Saved status, and refreshed the page.

Observed:
Subject and message were successfully restored.

Result:
Normal autosave works.

---

## 7. Current Development Roadmap

### Priority 1: Multi-Tab Synchronization
Status: Implemented and tested.

### Priority 2: Autosave Improvements
Status: Testing completed; implementation pending.

Planned:
- Better autosave failure handling
- Automatic retry after network reconnection
- Unsaved draft recovery
- Clear save status

### Priority 3: Bulk Email Improvements
Planned:
- Per-recipient progress
- Success and failure tracking
- Better campaign controls

### Priority 4: Redis + BullMQ
Planned:
- Background email processing
- Job queues
- Retry and backoff
- Controlled concurrency

### Priority 5: Production Security
Planned:
- API rate limiting
- Better request validation
- Retry and idempotency protection
- OAuth production readiness
- Logging and monitoring

---

## 8. Development Workflow

For every new feature or bug:

1. Understand the problem.
2. Explain the technical concept.
3. Test the existing behavior.
4. Record the test result.
5. Implement the solution.
6. Test the implementation.
7. Record the final result in documentation.

**Important:** Record actual observations separately from assumptions and future plans.

Never store passwords, API keys, OAuth secrets, database URIs, JWT secrets, or encryption keys in documentation.