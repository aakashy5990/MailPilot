# MailPilot – Scalability & System Design

## 1. Purpose

This document explains the current MailPilot architecture and how it can evolve to support more users, email requests, and background processing.

Scalability means designing an application so that it can handle increasing workloads without becoming unreliable or excessively slow.

---

## 2. Current Architecture

MailPilot currently uses the MERN stack with Gmail API integration.

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | User interface |
| Backend | Node.js + Express | API and business logic |
| Database | MongoDB Atlas | Persistent application data |
| Authentication | JWT + HTTP-only cookies | User authentication |
| Email Provider | Gmail API | Sending emails |
| OAuth | Google OAuth 2.0 | Connecting Gmail accounts |
| Hosting | Vercel + Render | Application deployment |

### Current Request Flow

1. User interacts with the React frontend.
2. Frontend sends an HTTP request to Express.
3. Backend authenticates the user.
4. Backend validates the request.
5. Backend reads or writes data in MongoDB.
6. For email sending, backend communicates with Gmail API.
7. Backend returns the result to the frontend.

---

## 3. Current Architecture Limitations

### 3.1 Synchronous Bulk Email Processing

**Problem:**

If a user sends emails to many recipients, processing all emails inside one HTTP request can take a long time.

Possible problems:
- Slow API responses.
- Request timeouts.
- Poor user experience.
- Difficulty recovering from partial failures.

**Planned Solution:**

Move bulk email processing to a background job queue using Redis and BullMQ.

---

### 3.2 Backend Availability

**Current Situation:**

The backend is hosted on Render.

On a free hosting plan, the service may sleep after inactivity, depending on the platform's current limits.

**Planned Improvements:**
- Monitor backend health.
- Use appropriate production hosting.
- Add error monitoring and logging.
- Consider multiple backend instances when workload requires them.

---

### 3.3 Database Performance

**Potential Problem:**

As the number of users and email history records increases, database queries may become slower.

**Planned Improvements:**
- Add indexes for frequently queried fields.
- Use pagination for email history.
- Retrieve only required fields.
- Avoid unnecessary database queries.
- Monitor slow queries.

Potential index fields:
- `userId`
- `gmailAccountId`
- `sentAt`
- `status`

Indexes should be selected based on actual query patterns and measured performance.

---

## 4. Future Architecture – Background Email Processing

### Why Redis and BullMQ?

Redis provides fast in-memory data storage.

BullMQ uses Redis to manage background jobs.

Instead of keeping the HTTP request open while sending every email, the backend can create jobs and let a separate worker process them.

### Proposed Architecture

```text
                  React Frontend
                        |
                        v
                  Express Backend
                        |
              Validate User Request
                        |
                        v
                  MongoDB Atlas
                        |
                        v
                  BullMQ Queue
                        |
                        v
                      Redis
                        |
                        v
                  Background Worker
                        |
                        v
                     Gmail API
                        |
                        v
                Email History Update
                        |
                        v
                  React Frontend
```

### Proposed Processing Flow

1. User submits a bulk email campaign.
2. Backend validates the recipients and email content.
3. Campaign information is saved in MongoDB.
4. Individual recipient jobs are added to BullMQ.
5. Redis stores queue-related job data.
6. A background worker picks up jobs.
7. Worker sends emails through Gmail API.
8. Each recipient's result is saved in MongoDB.
9. Frontend displays campaign progress.

**Important:** Redis and BullMQ are planned components. They are not currently implemented in MailPilot.

---

## 5. Horizontal Scaling

Horizontal scaling means adding more application instances instead of depending on a single server with more resources.

### Current Setup

```text
User
 |
 v
Single Backend Instance
 |
 v
MongoDB Atlas
```

### Possible Future Setup

```text
                  Users
                    |
                    v
               Load Balancer
                    |
          +---------+---------+
          |         |         |
          v         v         v
       Server 1  Server 2  Server 3
          |         |         |
          +---------+---------+
                    |
                    v
                MongoDB
```

A load balancer distributes incoming requests across multiple backend instances.

Before deploying multiple instances, ensure:
- Authentication works across instances.
- Shared state is not stored only in server memory.
- Session and cookie handling is consistent.
- Database connections are managed efficiently.
- Background jobs are processed safely.

---

## 6. Database Scaling Strategy

### Current Database

MongoDB Atlas stores:
- User accounts.
- Connected Gmail accounts.
- Email templates.
- Email history.
- Email compositions.
- Campaign data as the application evolves.

### Future Improvements

**1. Indexing**

Create indexes for frequently used query fields.

**2. Pagination**

Do not load thousands of email history records at once.

**3. Query Optimization**

Use efficient filters and projections.

**4. Data Management**

Review retention and deletion policies as stored data grows.

**5. Monitoring**

Monitor database performance and resource usage before deciding when to upgrade.

---

## 7. Email Sending Reliability

MailPilot depends on Gmail API, so scaling the backend does not remove Gmail API limitations.

Future email processing should consider:

- Gmail API quotas and rate limits.
- Per-account sending limits.
- Retry handling.
- Temporary failures.
- Duplicate-send prevention.
- Per-recipient status tracking.

Do not assume that adding more backend servers increases the sending capacity of a Gmail account.

---

## 8. Reliability and Failure Handling

Future architecture should handle these situations:

| Failure | Planned Handling |
|---|---|
| Gmail API unavailable | Retry eligible failed jobs |
| Temporary network failure | Retry with backoff |
| Worker crashes | Recover pending jobs |
| Duplicate job execution | Use idempotency protection |
| Invalid recipient | Mark recipient as failed |
| Database unavailable | Handle errors and preserve recoverable job state |
| User cancels campaign | Stop scheduling further eligible jobs |

---

## 9. Scaling Roadmap

| Stage | Improvement | Status |
|---|---|---|
| Stage 1 | Current MERN application | Implemented |
| Stage 2 | Improve autosave and recovery | Pending |
| Stage 3 | Improve bulk email controls | Pending |
| Stage 4 | Introduce Redis + BullMQ | Pending |
| Stage 5 | Add worker monitoring and retries | Pending |
| Stage 6 | Optimize database queries and indexes | Planned |
| Stage 7 | Multiple backend instances | Future |
| Stage 8 | Load balancing and advanced monitoring | Future |

---

## 10. Important Engineering Principle

Do not introduce complex infrastructure just because an application might have many users in the future.

First:
1. Measure actual performance.
2. Identify the bottleneck.
3. Understand why it occurs.
4. Choose an appropriate solution.
5. Implement and test the change.
6. Measure performance again.

The goal is to make MailPilot reliable and scalable without introducing unnecessary complexity too early.

---

**Last Updated:** 16 November 2026