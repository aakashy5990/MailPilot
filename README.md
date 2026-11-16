# MailPilot 📧

**A MERN-based Email Productivity Platform**

MailPilot is a web-based email productivity application that allows users to connect their Gmail accounts and send individual or bulk emails from a single dashboard.

It is designed to simplify repetitive email tasks, especially when sending job applications to multiple recruiters.

## 🌐 Live Demo

- **Frontend:** https://mail-pilot-coral.vercel.app/
- **Backend:** https://mailpilot-api-bx1h.onrender.com
- **GitHub:** https://github.com/aakashy5990/MailPilot

## ✨ Features

### Authentication
- User registration and login.
- JWT-based authentication.
- HTTP-only authentication cookies.
- Profile management.
- Password change functionality.

### Gmail Integration
- Connect Gmail accounts using Google OAuth 2.0.
- Support multiple connected Gmail accounts.
- Send emails through the user's connected Gmail account.
- Secure refresh-token storage using encryption.

### Email Composition
- Compose and send individual emails.
- Send emails to multiple recipients.
- Attach multiple files.
- Manage email templates.
- Save email compositions automatically.

### Attachments
Supported formats:
- PDF, DOC, DOCX, TXT
- JPG, JPEG, PNG, GIF, WEBP
- XLS, XLSX, CSV
- PPT, PPTX

Attachment limits:
- Maximum 5 files per email.
- Maximum 5 MB per file.
- Maximum 15 MB total.

Uploaded files are temporarily stored on the server and deleted after the sending process. Only attachment metadata is retained in email history.

### Email History
- View previously sent emails.
- Open individual email details.
- View attachment information.
- Track sending status.

### Multi-Tab Draft Synchronization
- Version-based optimistic concurrency control.
- Detect conflicting draft updates.
- BroadcastChannel communication between browser tabs.
- Warn users when another tab updates or deletes a draft.

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS v4 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| Gmail Integration | Gmail API |
| Authorization | Google OAuth 2.0 |
| File Upload | Multer |
| HTTP Client | Axios |
| Icons | Lucide React |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

## 📁 Project Structure

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
│   ├── utils/
│   ├── uploads/
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── docs/
│   ├── DEVELOPMENT-LOG.md
│   ├── TESTING.md
│   ├── BUG-FIXES.md
│   ├── FUTURE-IMPROVEMENTS.md
│   ├── SCALABILITY.md
│   └── ARCHITECTURE.md
│
└── README.md
```

## ⚙️ Local Installation

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- MongoDB Atlas account or a MongoDB instance
- Google Cloud project with Gmail API enabled

### 1. Clone the Repository

```bash
git clone https://github.com/aakashy5990/MailPilot.git
```

```bash
cd MailPilot
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Configure Backend Environment

Create a `.env` file inside the `server` directory.

Add the required configuration values:

```env
PORT=5000
NODE_ENV=development

MONGO_URI=your_mongodb_connection_string

CLIENT_URL=http://localhost:5173

JWT_SECRET=your_jwt_secret

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/gmail/callback

TOKEN_ENCRYPTION_KEY=your_32_byte_encryption_key
```

Use your own credentials. Never commit `.env` files or expose secrets publicly.

### 4. Start the Backend

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

### 5. Install Frontend Dependencies

Open another terminal:

```bash
cd client
npm install
```

Create a frontend `.env` file:

```env
VITE_API_URL=http://localhost:5000/api
```

### 6. Start the Frontend

```bash
npm run dev
```

The frontend will run on:

```text
http://localhost:5173
```

## 🔐 Google OAuth Configuration

To connect Gmail accounts:

1. Create a project in Google Cloud Console.
2. Enable the Gmail API.
3. Configure the OAuth consent screen.
4. Create OAuth 2.0 credentials.
5. Configure authorized JavaScript origins.
6. Add the backend OAuth callback URL.
7. Add test users if the OAuth application is in Testing mode.

Required Gmail permission:

```text
https://www.googleapis.com/auth/gmail.send
```

Additional OpenID scopes are used to identify the connected Google account.

## 🔒 Security Considerations

- Passwords are hashed using bcryptjs.
- Authentication uses HTTP-only cookies.
- Gmail OAuth refresh tokens are encrypted before storage.
- Protected routes verify user authentication.
- User data is scoped to the authenticated account.
- Environment variables are excluded from Git.
- Uploaded attachments are validated and temporarily stored.

## 🧪 Testing

MailPilot has been tested across its main modules:

- Authentication.
- Gmail OAuth connection.
- Single email sending.
- Multiple attachments.
- Email history.
- Template management.
- Multi-tab draft synchronization.
- Autosave behaviour.

For detailed test cases and results, see:

[`docs/TESTING.md`](docs/TESTING.md)

## 🚀 Future Improvements

Planned enhancements include:

- Autosave retry and local draft recovery.
- Improved bulk email progress tracking.
- Campaign cancellation and failed-recipient retry.
- Redis and BullMQ background email processing.
- Production rate limiting and additional security.
- CSV recipient import and personalized bulk emails.
- Campaign analytics.

**Note:** Redis and BullMQ background processing are planned features and are not yet implemented.

## 📚 Project Documentation

Detailed technical documentation is available in the `docs/` directory:

- [Development Log](docs/DEVELOPMENT-LOG.md)
- [Testing Documentation](docs/TESTING.md)
- [Bug Fixes](docs/BUG-FIXES.md)
- [Future Improvements](docs/FUTURE-IMPROVEMENTS.md)
- [Scalability](docs/SCALABILITY.md)
- [Architecture](docs/ARCHITECTURE.md)

## 👨‍💻 Author

**Aakash Yadav**

- GitHub: [Github profile URL](https://github.com/aakashy5990/)
- LinkedIn: [LinkedIn profile URL](https://www.linkedin.com/in/aakash-yadav-9bb5a5263/)
- Portfolio: [ProfileUrl](https://aakashy5990.github.io/portfolio/)

---

*MailPilot – Making repetitive email tasks simpler and more efficient.*