# MailPilot – System Architecture

## 1. Overview

MailPilot is a MERN-based email productivity application that allows users to connect their Gmail accounts and send individual or bulk emails.

Users can manage email templates, attachments, email history, and saved compositions through a React frontend.

The backend handles authentication, Gmail OAuth, email operations, and database communication.

---

## 2. Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React | User interface |
| Build Tool | Vite | Frontend development and build |
| Styling | Tailwind CSS v4 | UI styling |
| Backend | Node.js | JavaScript runtime |
| API Framework | Express.js | REST API |
| Database | MongoDB Atlas | Persistent data storage |
| ODM | Mongoose | MongoDB models and queries |
| Authentication | JWT | User authentication |
| Password Security | bcryptjs | Password hashing |
| Email Integration | Gmail API | Sending emails |
| Authorization | Google OAuth 2.0 | Gmail account connection |
| File Upload | Multer | Temporary attachment uploads |
| HTTP Client | Axios | Frontend API requests |
| Icons | Lucide React | Interface icons |
| Deployment | Vercel + Render | Hosting |

---

## 3. High-Level Architecture

```text
                  USER
                   |
                   v
             React Frontend
                   |
              Axios Requests
                   |
                   v
            Express Backend
                   |
          Authentication Middleware
                   |
          +--------+---------+
          |        |         |
          v        v         v
       Auth     Gmail    Templates
      Module    Module     Module
          |        |         |
          +--------+---------+
                   |
                   v
              MongoDB Atlas
                   |
                   v
               Gmail API
```

The Gmail API is accessed by the backend when an authenticated user requests email operations.

---

## 4. Project Folder Structure

```text
MailPilot/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── App.jsx
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── queues/
│   ├── workers/
│   ├── utils/
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── docs/
│
├── .gitignore
└── README.md
```

Note: `queues/` and `workers/` are planned locations for future Redis and BullMQ implementation.

---

## 5. Backend Responsibilities

### 5.1 Config

**Location:** `server/config/`

Responsible for application configuration.

Examples:
- MongoDB connection.
- Database initialization.
- External service configuration.

### 5.2 Controllers

**Location:** `server/controllers/`

Controllers handle incoming requests and coordinate application operations.

| Controller | Responsibility |
|---|---|
| Auth Controller | Registration, login, logout, profile |
| Gmail Controller | Gmail connection, email sending, history |
| Templates Controller | Template CRUD operations |
| Composition Controller | Draft saving, loading and clearing |

### 5.3 Middleware

**Location:** `server/middleware/`

Middleware executes before the main route handler.

Examples:
- Authentication middleware.
- Attachment validation middleware.
- Request validation and security checks.

### 5.4 Models

**Location:** `server/models/`

Mongoose models define the structure of MongoDB documents.

| Model | Responsibility |
|---|---|
| User | User account information |
| GmailAccount | Connected Gmail account and encrypted tokens |
| EmailHistory | Sent email records |
| Template | Saved email templates |
| EmailComposition | Saved email drafts |

Future campaign-related models can track campaigns and individual recipients.

### 5.5 Routes

**Location:** `server/routes/`

Routes define API endpoints and connect them to controllers.

Examples:

| Route | Responsibility |
|---|---|
| `/api/auth` | Authentication |
| `/api/gmail` | Gmail operations |
| `/api/templates` | Template operations |
| `/api/composition` | Draft operations |

### 5.6 Services

**Location:** `server/services/`

Services contain reusable business logic and integrations.

Example:
- `gmailSendService.js` handles Gmail API email sending and MIME message construction.

### 5.7 Utils

**Location:** `server/utils/`

Contains reusable helper functions.

Examples:
- Token encryption and decryption.
- Shared utility operations.

---

## 6. Frontend Responsibilities

### Pages

**Location:** `client/src/pages/`

| Page | Responsibility |
|---|---|
| Login | User login |
| Register | New account registration |
| Dashboard | Account and activity overview |
| ComposeEmail | Compose and send emails |
| Templates | Manage email templates |
| History | View sent email records |
| EmailDetails | View individual email details |
| AccountSettings | Profile, password and Gmail settings |

### Services

**Location:** `client/src/services/`

Contains frontend API configuration and request logic.

Example:
- `api.js` creates an Axios instance.
- `withCredentials: true` allows browser requests to include authentication cookies.

### Components

**Location:** `client/src/components/`

Contains reusable UI components used across pages.

---

## 7. Authentication Flow

```text
User
 |
 v
Login Form
 |
 v
POST /api/auth/login
 |
 v
Auth Controller
 |
 v
Verify Password using bcrypt
 |
 v
Generate JWT
 |
 v
Set HTTP-only Cookie
 |
 v
Authenticated User
```

Protected API routes use authentication middleware to verify the JWT and identify the logged-in user.

---

## 8. Gmail OAuth Flow

```text
User
 |
 v
Click Connect Gmail
 |
 v
Backend OAuth Route
 |
 v
Google Authorization Page
 |
 v
User Grants Permission
 |
 v
Google OAuth Callback
 |
 v
Backend Receives Authorization
 |
 v
Store Encrypted Refresh Token
 |
 v
Gmail Account Connected
```

The application uses Gmail API permission to send emails on behalf of the connected account.

---

## 9. Email Sending Flow

```text
Compose Email
      |
      v
Frontend FormData
      |
      v
POST /api/gmail/send
      |
      v
Authentication Middleware
      |
      v
Attachment Validation
      |
      v
Gmail Controller
      |
      v
Gmail Send Service
      |
      v
Gmail API
      |
      v
Save Email History
      |
      v
Delete Temporary Files
      |
      v
Return Result
```

The actual attachment files are temporary. Email history stores attachment metadata rather than permanent file contents.

---

## 10. Draft Synchronization Architecture

MailPilot uses optimistic concurrency control to protect drafts from simultaneous updates.

Important components:
- MongoDB `version` field.
- Version check during updates.
- HTTP 409 Conflict response.
- Browser BroadcastChannel API.
- Frontend conflict detection.

When two tabs edit the same draft, a stale version is prevented from overwriting a newer version.

---

## 11. Data Ownership and Security

Each user's private data must be scoped to their authenticated user ID.

Examples:
- Gmail accounts belong to a user.
- Templates belong to a user.
- Email history belongs to a user.
- Email compositions belong to a user.

The backend must verify ownership before allowing access, modification, or deletion.

Sensitive values such as passwords, OAuth refresh tokens, and encryption keys must not be exposed to the frontend or committed to GitHub.

---

## 12. Future Architecture

Planned additions:

- Redis for queue infrastructure.
- BullMQ for background job management.
- Worker processes for bulk email sending.
- Campaign and recipient tracking.
- Autosave retry and local recovery.
- Rate limiting and improved monitoring.

These components are planned and should not be considered part of the currently implemented architecture.

---

## 13. Deployment Architecture

| Application Part | Hosting |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | MongoDB Atlas |
| Email Provider | Gmail API |

Frontend and backend communicate through HTTPS API requests.

Production OAuth redirect URLs and CORS origins must match the deployed application configuration.

---

**Last Updated:** 16 November 2026