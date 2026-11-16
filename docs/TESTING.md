# MailPilot – Testing Documentation

## 1. Purpose

This document records the testing performed on MailPilot, including authentication, Gmail integration, email sending, attachments, email history, templates, and draft synchronization.

The purpose is to track:
- Features that have been tested.
- Expected and actual results.
- Bugs discovered during testing.
- Areas that need further testing.

---

## 2. Testing Environment

| Component | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Email Service | Gmail API |
| Authentication | JWT + HTTP-only cookies |
| OAuth | Google OAuth 2.0 |
| API Testing | Postman |
| Deployment | Vercel + Render |

---

## 3. Authentication Testing

| Test Case | Expected Result | Status |
|---|---|---|
| Register with valid details | User account created | Passed |
| Register with existing email | Registration rejected | Tested |
| Login with valid credentials | User logged in | Passed |
| Login with incorrect password | Login rejected | Tested |
| Access protected route without login | Request rejected | Tested |
| Logout | Session cookie cleared | Passed |
| Update profile | Profile updated | Passed |
| Change password | Password updated | Passed |

---

## 4. Gmail Integration Testing

| Test Case | Expected Result | Status |
|---|---|---|
| Connect Gmail account | Google OAuth authorization opens | Passed |
| Complete OAuth authorization | Gmail account connected | Passed |
| Connect multiple Gmail accounts | Accounts linked to user | Passed |
| Send single email | Email sent through connected Gmail | Passed |
| Disconnect Gmail account | Account disconnected | Tested |
| Refresh token invalidation | Reconnection restores authorization | Tested |

**Important observation:**

During development, Gmail API returned an `invalid_grant` error. Disconnecting and reconnecting the affected Gmail account restored email sending.

---

## 5. Email Attachment Testing

Supported attachment formats:

- PDF, DOC, DOCX, TXT
- JPG, JPEG, PNG, GIF, WEBP
- XLS, XLSX, CSV
- PPT, PPTX

Attachment limits:
- Maximum 5 files per email.
- Maximum 5 MB per file.
- Maximum 15 MB combined size.

| Test Case | Expected Result | Status |
|---|---|---|
| Attach one PDF | PDF attached to email | Passed |
| Attach multiple files | All valid files attached | Passed |
| Attach unsupported file | File rejected | Tested |
| Attach file larger than 5 MB | File rejected | Tested |
| Attach more than 5 files | Additional files rejected | Tested |
| Send email with attachments | Recipient receives attachments | Passed |
| Check MongoDB after sending | Only attachment metadata stored | Verified |

**Storage decision:**

Actual attachment files are not stored permanently in MongoDB. Files are temporarily stored on the server and deleted after the email sending process. Only metadata such as filename, size, and MIME type is saved in email history.

---

## 6. Email History Testing

| Test Case | Expected Result | Status |
|---|---|---|
| Send email | Email history record created | Passed |
| Open email history | Previous records displayed | Passed |
| Open email details | Email details displayed | Passed |
| Check attachment metadata | Attachment information displayed | Tested |

**Note:** A successful Gmail API response means Gmail accepted the send request. It does not guarantee delivery or that the recipient opened the email.

---

## 7. Template Testing

| Test Case | Expected Result | Status |
|---|---|---|
| Create template | Template saved | Passed |
| View templates | User's templates displayed | Passed |
| Search templates | Matching templates displayed | Passed |
| Edit template | Template updated | Passed |
| Delete template | Template removed | Passed |

---

## 8. Multi-Tab Draft Synchronization Testing

### Objective

Prevent two browser tabs from silently overwriting each other's email composition.

The implementation uses:
- MongoDB version field.
- Optimistic concurrency control.
- HTTP 409 Conflict response.
- Browser BroadcastChannel API.

### Test Cases

| Test Case | Expected Result | Actual Result |
|---|---|---|
| Open same draft in two tabs | Both tabs load the same version | Passed |
| Update draft in Tab 1 | Tab 2 detects newer version | Passed |
| Try saving stale draft | Conflict detected | Passed |
| Delete draft in one tab | Other tab receives deletion notification | Passed |
| Reload after conflict | Latest server draft loads | Passed |
| Normal single-tab editing | Draft saves successfully | Passed |

### Result

Multi-tab synchronization is working in the tested scenarios. A stale tab is warned instead of silently overwriting a newer draft.

---

## 9. Autosave Testing

### Objective

Check whether email composition is saved automatically and whether errors are handled correctly.

| Test | Action | Actual Result |
|---|---|---|
| Test 1 | Disconnect internet and edit draft | Error message displayed |
| Test 2 | Reconnect internet without editing | Automatic retry was not observed |
| Test 3 | Refresh after failed save | Unsaved changes were lost |
| Test 4 | Stop backend and edit draft | Clear save error displayed |
| Test 5 | Restart backend, edit and wait for Saved status | Draft successfully restored after refresh |

### Findings

The existing autosave system can:
- Save normal changes.
- Display an error when saving fails.
- Detect version conflicts.

However, improvements are needed:
- Automatic retry after temporary failures.
- Recovery of unsaved changes after refresh.
- Local temporary draft storage.
- Clear retry and recovery status.

**Priority:** High — autosave recovery improvements are pending.

---

## 10. Backend and Database Testing

| Test Case | Expected Result | Status |
|---|---|---|
| Start backend | Express server starts | Passed |
| Connect MongoDB Atlas | Database connection established | Passed |
| Check health endpoint | Server responds successfully | Passed |
| Stop MongoDB connection | Connection error handled | Tested |
| Restart backend | Database reconnects | Passed |

### Issues Observed

**MongoDB DNS issue**

MongoDB Atlas SRV connection initially failed because of DNS resolution problems. Configuring Google DNS resolved the connection issue in the development environment.

**Mongoose deprecation warning**

The deprecated `new: true` option in `findOneAndUpdate()` was replaced with:

`returnDocument: "after"`

The warning disappeared after restarting the backend.

---

## 11. Pending Tests

The following areas still need more testing:

- Bulk email progress tracking.
- Bulk email cancellation.
- Bulk email partial failures.
- Retry failed recipients.
- Duplicate recipient validation.
- Large recipient lists.
- Rate limiting.
- Redis and BullMQ background processing.
- Local draft recovery after refresh.
- Production security and authorization edge cases.

---

## 12. Testing Status Summary

| Module | Status |
|---|---|
| Authentication | Tested |
| Gmail OAuth | Tested |
| Single Email Sending | Tested |
| Attachments | Tested |
| Email History | Tested |
| Templates | Tested |
| Multi-Tab Synchronization | Tested |
| Normal Autosave | Tested |
| Autosave Recovery | Pending |
| Advanced Bulk Email | Pending |
| Redis + BullMQ | Pending |
| Production Security | Pending |

---

**Last Updated:** 16 November 2026