# MailPilot – Bug Fixes & Troubleshooting Log

This document records important bugs encountered during MailPilot development, their root causes, solutions, and verification results.

The purpose is to remember technical problems and explain how they were resolved.

---

## 1. MongoDB Atlas DNS Connection Error

### Problem
The backend was unable to connect to MongoDB Atlas.

Errors included:
- `ECONNREFUSED`
- `ETIMEOUT`
- DNS SRV lookup failures

### Root Cause
The system was unable to resolve the MongoDB Atlas SRV connection records through its default DNS configuration.

### Solution
Configured Google DNS servers in the database connection file.

```js
const dns = require("node:dns");

dns.setServers(["8.8.8.8", "8.8.4.4"]);
```

### Verification
- Restarted the backend.
- MongoDB Atlas connected successfully.
- Database operations started working.

### Learning
DNS translates domain names into IP addresses. MongoDB Atlas SRV connection strings depend on DNS lookups to discover database servers.

---

## 2. Gmail API `invalid_grant` Error

### Problem
Gmail API returned:

```text
invalid_grant
```

Email sending stopped working even though the Gmail account had previously been connected.

### Root Cause
The Google OAuth refresh token was no longer valid.

During development, the OAuth application was in Testing mode, where refresh tokens can expire after seven days.

### Solution
- Disconnected the affected Gmail account.
- Reconnected the account through Google OAuth.
- Generated and stored a fresh refresh token.

### Verification
Email sending started working again.

### Learning
OAuth access tokens are short-lived. Refresh tokens allow applications to obtain new access tokens without asking the user to authorize every request. Refresh tokens can become invalid or expire.

---

## 3. Mongoose Deprecation Warning

### Problem
The backend displayed:

```text
[MONGOOSE] Warning:
The `new` option for findOneAndUpdate()
is deprecated.
Use `returnDocument: 'after'` instead.
```

### Root Cause
The code used the older Mongoose option:

```js
{ new: true }
```

### Solution
Updated the relevant `findOneAndUpdate()` calls to use:

```js
{ returnDocument: "after" }
```

Updated locations:
1. Auth Controller
2. Composition Controller
3. Gmail Controller
4. Templates Controller

### Verification
Restarted the backend. The deprecation warning disappeared.

### Learning
When libraries change their APIs, older options may become deprecated. Keeping dependencies and code updated helps avoid future compatibility issues.

---

## 4. Autosave HTTP 409 Conflict

### Problem
Browser console displayed:

```text
Autosave failed: Request failed with status code 409
```

### Root Cause
MailPilot uses version-based optimistic concurrency control for draft synchronization.

A 409 response means the draft version submitted by the browser does not match the latest version stored on the server.

This can happen when another browser tab has already updated the draft.

### Solution
Implemented:
- Version field in the EmailComposition model.
- Version checking during draft updates.
- HTTP 409 response for stale versions.
- Conflict detection in the frontend.
- BroadcastChannel notifications between browser tabs.
- Reload option to load the latest server draft.

### Verification
- Tested editing the same draft in two tabs.
- Tested deleting the draft in one tab.
- Confirmed the other tab displayed a conflict warning.
- Normal single-tab editing worked.

### Learning
Optimistic concurrency control prevents one browser tab from silently overwriting changes made by another tab.

A 409 response is not necessarily a server failure. It can be an intentional conflict response.

---

## 5. Attachment Storage and Cleanup

### Requirement
Email attachments should be sent to recipients without storing actual files permanently in MongoDB.

### Implementation
- Used Multer for temporary file uploads.
- Stored uploaded files temporarily on the server.
- Validated file type and size.
- Sent files through the Gmail API.
- Stored only attachment metadata in EmailHistory.
- Deleted temporary files after the sending process.

### Verification
Multiple attachments were successfully sent and received.

### Learning
File storage and file metadata are different things.

MongoDB stores information about the attachment, while the actual file is temporarily stored on the server.

---

## 6. General Debugging Workflow

When a new bug appears, record it using this structure:

### Bug Title
Short description of the issue.

### 1. Problem
What happened? Include the exact error message if available.

### 2. Expected Behaviour
What should have happened?

### 3. Root Cause
Why did the issue occur?

### 4. Solution
What code or configuration was changed?

### 5. Files Modified
List the affected files.

### 6. Verification
How was the fix tested?

### 7. Learning
What technical concept did this issue teach?

---

## 7. Important Debugging Lessons

- Read the complete error message before changing code.
- Check backend logs and browser console separately.
- Identify whether the issue comes from frontend, backend, database, or a third-party API.
- Understand the root cause instead of applying random fixes.
- Test the fix after restarting the required services.
- Check whether the fix affects existing functionality.
- Record important bugs so the same issue can be solved faster in the future.

---

**Last Updated:** 16 November 2026