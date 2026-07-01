# CareerPilot — AI-Powered Job Application Tracker & Career CRM
## Complete Project Brief

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Problem Statement](#2-problem-statement)
3. [Target Users](#3-target-users)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [Core Features](#5-core-features)
6. [User Panel — Detailed Specification](#6-user-panel--detailed-specification)
7. [Admin Panel — Detailed Specification](#7-admin-panel--detailed-specification)
8. [AI / Generative AI Features](#8-ai--generative-ai-features)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Database Design](#10-database-design)
11. [API Specification](#11-api-specification)
12. [System Architecture](#12-system-architecture)
13. [File Upload System](#13-file-upload-system)
14. [Notification & Reminder System](#14-notification--reminder-system)
15. [Subscription & Payment System](#15-subscription--payment-system)
16. [Analytics & Dashboard](#16-analytics--dashboard)
17. [Tech Stack](#17-tech-stack)
18. [Folder Structure](#18-folder-structure)
19. [Deployment Architecture](#19-deployment-architecture)
20. [Development Phases & Timeline](#20-development-phases--timeline)
21. [Environment Variables](#21-environment-variables)
22. [Resume Bullet Points](#22-resume-bullet-points)

---

## 1. Project Overview

**Project Name:** CareerPilot

**Tagline:** Your AI co-pilot for the job search.

**Type:** Full-Stack SaaS Web Application

**Category:** Career Tech / Productivity

**Target Roles (for resume):** Full-Stack Developer, Backend Developer, AI Engineer, Software Engineer

CareerPilot is a SaaS platform that helps job seekers organize their job search like a CRM. Users track every application they send, upload multiple resume versions, get AI-powered resume feedback, generate AI cover letters, and receive smart follow-up reminders. Admins manage users, subscriptions, platform analytics, and AI usage from a separate control panel.

---

## 2. Problem Statement

Job seekers apply to dozens or even hundreds of companies during a job search. The current reality:

- Most people track applications in a spreadsheet — which has no reminders, no AI, and no analytics
- They forget to follow up, don't know which resume version they sent, and lose track of contacts
- They have no feedback on why they're getting rejected
- There is no single, purpose-built tool that combines tracking + AI feedback + smart reminders

**CareerPilot solves all of this in one platform.**

---

## 3. Target Users

### End Users (User Panel)
- University students applying for internships and graduate roles
- Fresh graduates entering the job market
- Mid-career professionals switching roles or industries
- Anyone actively job hunting who wants to stay organized

### Platform Admins (Admin Panel)
- The developer / platform owner (you)
- A small internal team managing the platform

---

## 4. Goals & Success Metrics

| Goal | Metric |
|------|--------|
| Users stay organized | Avg. applications tracked per user > 10 |
| AI features are used | AI review used at least once by 60% of active users |
| Retention | Users return to update status at least 3x per week |
| Revenue | At least 5% of free users convert to paid |
| Performance | API response time < 300ms for standard endpoints |

---

## 5. Core Features

### Must-Have (MVP)
- [ ] Email + password registration and login
- [ ] Google OAuth login
- [ ] JWT-based authentication with refresh tokens
- [ ] Role-based access control (user / admin)
- [ ] Job application CRUD (add, edit, delete, view)
- [ ] Kanban pipeline board (Applied → Screening → Interview → Offer → Rejected)
- [ ] Resume upload (PDF, stored in S3)
- [ ] Resume vault (multiple versions, labeled)
- [ ] AI resume review (score + feedback via OpenAI)
- [ ] AI cover letter generator
- [ ] Follow-up reminder system (cron + email + in-app)
- [ ] User analytics dashboard
- [ ] Admin user management panel
- [ ] Admin platform analytics
- [ ] Stripe subscription system (Free / Pro / Premium)

### Nice-to-Have (Post-MVP)
- [ ] AI interview question generator
- [ ] Job description keyword extractor
- [ ] Contacts CRM (store recruiter names, LinkedIn URLs)
- [ ] Chrome extension to add jobs directly from job boards
- [ ] Export applications to CSV
- [ ] Application response rate predictor (ML)

---

## 6. User Panel — Detailed Specification

### 6.1 Pages & Routes

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/` | Landing page | Marketing page, hero, features, pricing, CTA |
| `/signup` | Sign up | Email/password + Google OAuth registration |
| `/login` | Log in | Email/password + Google OAuth login |
| `/onboarding` | Onboarding | First-time setup: name, job title, target roles |
| `/dashboard` | Dashboard | Kanban pipeline + stats summary |
| `/applications` | Applications list | Filterable, sortable table of all applications |
| `/applications/:id` | Application detail | Full detail: job info, resume used, interviews, notes, contacts |
| `/applications/new` | Add application | Form to add a new job application |
| `/resumes` | Resume vault | Upload and manage resume versions |
| `/ai/review` | AI resume reviewer | Upload resume + paste JD → get AI score + feedback |
| `/ai/cover-letter` | AI cover letter | Generate tailored cover letters |
| `/interviews` | Interview tracker | List all interviews, add notes, outcomes |
| `/contacts` | CRM contacts | List of recruiters/contacts per company |
| `/analytics` | My analytics | Personal job search stats and charts |
| `/notifications` | Notifications | All notifications, mark read |
| `/settings` | Settings | Profile, password, notification preferences |
| `/billing` | Billing | Current plan, upgrade, billing history |

### 6.2 Dashboard (Kanban Board)

The dashboard is the home screen after login. It shows:

- A kanban board with 5 columns: **Applied**, **Screening**, **Interview**, **Offer**, **Rejected**
- Each card shows: company name, role title, date applied, follow-up date badge
- Cards are draggable between columns (status updates on drop via PATCH API call)
- Summary stats strip above the board: Total applied, In progress, Interviews, Response rate %

### 6.3 Application Detail Page

Each application has a dedicated page showing:

- Company, role, salary range, job URL, source (LinkedIn, Indeed, etc.), date applied
- Current status badge
- Which resume version was submitted
- AI review score (if run)
- Interview rounds added (round name, format, date, outcome, notes)
- Contacts linked to this company
- Personal notes (rich text or plain textarea)
- Follow-up date with reminder toggle

### 6.4 Resume Vault

- User can upload up to N resume versions (N depends on plan)
- Each resume has a label (e.g. "Software Engineer v2", "Backend Focus")
- When adding an application, user selects which resume version was sent
- Each resume shows upload date, label, and a download link
- File type: PDF only, max 5MB

### 6.5 AI Resume Reviewer

- User selects a resume from their vault (or uploads a new one)
- User pastes the job description text
- Clicks "Review Resume"
- System calls `POST /api/ai/review-resume`
- AI returns:
  - Overall match score (0–100)
  - Missing keywords list
  - Section-by-section feedback (Summary, Experience, Skills, Education)
  - Top 3 actionable improvement suggestions
- Results are saved and can be viewed again from the application detail page

### 6.6 AI Cover Letter Generator

- User inputs: company name, role title, 2–3 sentences about why they're interested
- Optionally selects a resume from vault for context
- Clicks "Generate"
- AI returns a 3-paragraph professional cover letter
- User can copy to clipboard or regenerate
- Each generation costs 1 AI credit from their monthly plan allowance

### 6.7 Personal Analytics Page

Charts and stats shown to each user about their own job search:

- Applications sent per week (line chart)
- Pipeline funnel (bar chart: Applied → Screened → Interviewed → Offered)
- Response rate % over time
- Average days from apply to first response
- Top sources (which job boards work best for them)
- Resume performance (which resume version has the best response rate)

---

## 7. Admin Panel — Detailed Specification

### 7.1 Admin Routes

All admin routes are under `/admin/*` and require `role: "admin"` in JWT.

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/admin/dashboard` | Admin overview | Key platform metrics |
| `/admin/users` | User management | Paginated list of all users |
| `/admin/users/:id` | User detail | Individual user info + actions |
| `/admin/subscriptions` | Subscriptions | Plan distribution, revenue |
| `/admin/ai-usage` | AI usage | API call logs, cost tracking |
| `/admin/notifications` | Broadcast | Send messages to all or segment of users |
| `/admin/flags` | Feature flags | Toggle features on/off per plan or globally |
| `/admin/support` | Support inbox | View user-submitted feedback/bugs |

### 7.2 Admin Dashboard Metrics

- Total registered users (all time)
- New signups (last 7 days, last 30 days)
- Monthly Active Users (MAU)
- Monthly Recurring Revenue (MRR)
- Churn rate (% of paid users who cancelled)
- Plan distribution: Free / Pro / Premium (pie chart)
- AI API cost this month (tokens used × price per token)
- Top features used (bar chart)
- User signups trend (line chart, last 90 days)

### 7.3 User Management

- Searchable, filterable, paginated table of all users
- Columns: name, email, plan, signup date, last active, status
- Per-user actions: view detail, change plan, ban/unban, reset password link, delete account
- User detail shows: all their applications (count), AI usage this month, subscription history

### 7.4 Feature Flags

Simple key-value flags stored in the database or config:

| Flag | Default | Description |
|------|---------|-------------|
| `ai_review_enabled` | true | Toggle AI review feature globally |
| `cover_letter_enabled` | true | Toggle cover letter generator |
| `free_plan_ai_limit` | 3 | AI calls per month for free users |
| `pro_plan_ai_limit` | 20 | AI calls per month for pro users |
| `max_resume_uploads_free` | 2 | Resume vault limit for free users |
| `max_resume_uploads_pro` | 10 | Resume vault limit for pro users |

---

## 8. AI / Generative AI Features

### 8.1 Resume Review

**Endpoint:** `POST /api/ai/review-resume`

**Input:**
```json
{
  "resumeId": "uuid",
  "jobDescription": "string (full JD text)"
}
```

**System Prompt Template:**
```
You are an expert career coach and ATS specialist. You will receive a resume and a job description. Analyze how well the resume matches the job description and return a JSON object with this exact structure:
{
  "overallScore": number (0-100),
  "missingKeywords": string[],
  "sectionFeedback": {
    "summary": string,
    "experience": string,
    "skills": string,
    "education": string
  },
  "topSuggestions": string[] (exactly 3 items),
  "atsCompatibility": "high" | "medium" | "low"
}
Return only the JSON. No preamble, no explanation outside the JSON.
```

**Rate limits:**
- Free plan: 3 reviews/month
- Pro plan: 20 reviews/month
- Premium: unlimited

### 8.2 Cover Letter Generator

**Endpoint:** `POST /api/ai/cover-letter`

**Input:**
```json
{
  "companyName": "string",
  "roleTitle": "string",
  "whyInterested": "string",
  "resumeId": "uuid (optional)"
}
```

**Output:** Plain text, 3-paragraph cover letter, ~300 words

### 8.3 Interview Question Generator (Post-MVP)

**Endpoint:** `POST /api/ai/interview-questions`

**Input:** Job description text + role type (technical / non-technical / mixed)

**Output:** 10 likely interview questions with answer tips

### 8.4 AI Usage Tracking

Every AI call is logged to the `ai_requests` table:

```
userId, feature, tokensUsed, responseData (JSON), createdAt
```

Rate limiting uses Redis:
- Key: `ai_usage:{userId}:{YYYY-MM}`
- Value: integer count of calls this month
- TTL: set to expire at the end of the current month
- On each AI call: check key value against plan limit; if under limit, proceed then `INCR` the key; if at/over limit, return `429`

---

## 9. Authentication & Authorization

### 9.1 Auth Methods

- Email + password (with bcrypt hashing, cost factor 12)
- Google OAuth 2.0 via Passport.js

### 9.2 Token Strategy

- **Access token:** JWT, signed with `JWT_SECRET`, expires in 15 minutes
- **Refresh token:** Stored in `httpOnly` cookie, expires in 7 days, used to issue new access tokens silently

### 9.3 JWT Payload

```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "user | admin",
  "plan": "free | pro | premium",
  "iat": 1234567890,
  "exp": 1234568790
}
```

### 9.4 Middleware Chain

Every protected route runs through:

```
verifyToken → (optional) requireAdmin → (optional) checkPlanLimit → controller
```

- `verifyToken` — decodes JWT, attaches `req.user`, returns 401 if invalid or expired
- `requireAdmin` — checks `req.user.role === 'admin'`, returns 403 if not
- `checkPlanLimit` — checks Redis count against plan limit for AI routes, returns 429 if exceeded

### 9.5 Role Definitions

| Role | Access |
|------|--------|
| `user` | Own data only. All `/api/applications`, `/api/resumes`, `/api/ai/*`, `/api/analytics/user` |
| `admin` | All user routes + all `/api/admin/*` routes. Can read any user's data |

---

## 10. Database Design

### Tables

#### `users`
```
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
email            VARCHAR(255) UNIQUE NOT NULL
password_hash    VARCHAR(255)
name             VARCHAR(255) NOT NULL
avatar_url       VARCHAR(500)
role             VARCHAR(20) DEFAULT 'user'    -- 'user' | 'admin'
oauth_provider   VARCHAR(50)                   -- 'google' | null
oauth_id         VARCHAR(255)
is_active        BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT NOW()
last_active_at   TIMESTAMP
```

#### `subscriptions`
```
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id             UUID REFERENCES users(id) ON DELETE CASCADE
plan                VARCHAR(20) DEFAULT 'free'   -- 'free' | 'pro' | 'premium'
status              VARCHAR(20) DEFAULT 'active' -- 'active' | 'cancelled' | 'past_due'
stripe_customer_id  VARCHAR(255)
stripe_sub_id       VARCHAR(255)
current_period_end  TIMESTAMP
created_at          TIMESTAMP DEFAULT NOW()
updated_at          TIMESTAMP DEFAULT NOW()
```

#### `applications`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
resume_id       UUID REFERENCES resumes(id) ON DELETE SET NULL
company         VARCHAR(255) NOT NULL
role_title      VARCHAR(255) NOT NULL
status          VARCHAR(50) DEFAULT 'applied'   -- 'applied' | 'screening' | 'interview' | 'offer' | 'rejected'
job_url         VARCHAR(500)
source          VARCHAR(100)                    -- 'LinkedIn' | 'Indeed' | 'Company website' | etc.
salary_min      INTEGER
salary_max      INTEGER
salary_currency VARCHAR(10) DEFAULT 'USD'
applied_at      DATE NOT NULL
follow_up_date  DATE
notes           TEXT
is_archived     BOOLEAN DEFAULT false
created_at      TIMESTAMP DEFAULT NOW()
updated_at      TIMESTAMP DEFAULT NOW()
```

#### `interviews`
```
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
application_id    UUID REFERENCES applications(id) ON DELETE CASCADE
round_name        VARCHAR(100)   -- 'Phone Screen' | 'Technical' | 'Final' | etc.
format            VARCHAR(50)    -- 'video' | 'phone' | 'onsite' | 'take-home'
scheduled_at      TIMESTAMP
duration_minutes  INTEGER
interviewer_name  VARCHAR(255)
outcome           VARCHAR(50)    -- 'passed' | 'failed' | 'pending' | 'cancelled'
notes             TEXT
created_at        TIMESTAMP DEFAULT NOW()
```

#### `resumes`
```
id            UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id       UUID REFERENCES users(id) ON DELETE CASCADE
label         VARCHAR(255) NOT NULL
file_url      VARCHAR(500) NOT NULL
file_key      VARCHAR(500) NOT NULL   -- S3 object key for deletion
version       VARCHAR(50)
file_size_kb  INTEGER
uploaded_at   TIMESTAMP DEFAULT NOW()
```

#### `contacts`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
application_id  UUID REFERENCES applications(id) ON DELETE SET NULL
name            VARCHAR(255) NOT NULL
role_title      VARCHAR(255)
email           VARCHAR(255)
linkedin_url    VARCHAR(500)
phone           VARCHAR(50)
notes           TEXT
created_at      TIMESTAMP DEFAULT NOW()
```

#### `notifications`
```
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID REFERENCES users(id) ON DELETE CASCADE
type        VARCHAR(50)      -- 'follow_up_reminder' | 'broadcast' | 'system'
title       VARCHAR(255)
message     TEXT
is_read     BOOLEAN DEFAULT false
created_at  TIMESTAMP DEFAULT NOW()
```

#### `ai_requests`
```
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id         UUID REFERENCES users(id) ON DELETE CASCADE
application_id  UUID REFERENCES applications(id) ON DELETE SET NULL
feature         VARCHAR(50)   -- 'resume_review' | 'cover_letter' | 'interview_questions'
tokens_used     INTEGER
cost_usd        DECIMAL(8,6)
response_data   JSONB
created_at      TIMESTAMP DEFAULT NOW()
```

### Indexes

```sql
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_follow_up ON applications(follow_up_date) WHERE is_archived = false;
CREATE INDEX idx_ai_requests_user_month ON ai_requests(user_id, created_at);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
```

---

## 11. API Specification

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, returns access token |
| POST | `/api/auth/logout` | User | Clear refresh token cookie |
| POST | `/api/auth/refresh` | Cookie | Issue new access token |
| GET | `/api/auth/google` | Public | Redirect to Google OAuth |
| GET | `/api/auth/google/callback` | Public | Google OAuth callback |
| GET | `/api/auth/me` | User | Get current user profile |

### Applications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/applications` | User | List all (paginated, filterable by status/source) |
| POST | `/api/applications` | User | Create new application |
| GET | `/api/applications/:id` | User | Get single application detail |
| PATCH | `/api/applications/:id` | User | Update application (status, notes, etc.) |
| DELETE | `/api/applications/:id` | User | Delete application |
| PATCH | `/api/applications/:id/status` | User | Update kanban status only |

### Resumes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/resumes` | User | List all user's resumes |
| POST | `/api/resumes/upload` | User | Upload PDF resume to S3 |
| DELETE | `/api/resumes/:id` | User | Delete resume (removes from S3 + DB) |
| PATCH | `/api/resumes/:id` | User | Update label/version |

### AI Features

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/review-resume` | User | AI resume review (plan-limited) |
| POST | `/api/ai/cover-letter` | User | AI cover letter generation (plan-limited) |
| GET | `/api/ai/usage` | User | Get user's AI usage this month |

### Interviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/applications/:id/interviews` | User | List interviews for application |
| POST | `/api/applications/:id/interviews` | User | Add interview round |
| PATCH | `/api/interviews/:id` | User | Update interview outcome/notes |
| DELETE | `/api/interviews/:id` | User | Delete interview |

### Contacts

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/contacts` | User | List all contacts |
| POST | `/api/contacts` | User | Add contact |
| PATCH | `/api/contacts/:id` | User | Update contact |
| DELETE | `/api/contacts/:id` | User | Delete contact |

### Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications` | User | List all notifications |
| GET | `/api/notifications/unread-count` | User | Get unread count (for bell icon) |
| PATCH | `/api/notifications/:id/read` | User | Mark single notification read |
| PATCH | `/api/notifications/read-all` | User | Mark all read |

### Analytics

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics/user` | User | User's personal job search stats |

### Subscriptions

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/subscriptions/my` | User | Get current plan and status |
| POST | `/api/subscriptions/create-checkout` | User | Create Stripe checkout session |
| POST | `/api/subscriptions/portal` | User | Open Stripe billing portal |
| POST | `/api/webhooks/stripe` | Stripe | Handle Stripe events (no auth, verified by signature) |

### Admin

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/analytics` | Admin | Platform-wide stats |
| GET | `/api/admin/users` | Admin | List all users (paginated) |
| GET | `/api/admin/users/:id` | Admin | Get user detail |
| PATCH | `/api/admin/users/:id/ban` | Admin | Ban/unban user |
| PATCH | `/api/admin/users/:id/plan` | Admin | Override user plan |
| DELETE | `/api/admin/users/:id` | Admin | Delete user account |
| GET | `/api/admin/ai-usage` | Admin | Platform AI usage and cost |
| POST | `/api/admin/notifications/broadcast` | Admin | Send notification to all/segment |
| GET | `/api/admin/flags` | Admin | Get feature flags |
| PATCH | `/api/admin/flags/:key` | Admin | Update a feature flag |

---

## 12. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Client)                        │
│                                                             │
│  ┌─────────────────────┐   ┌─────────────────────────────┐ │
│  │    User Panel       │   │       Admin Panel           │ │
│  │  React + Tailwind   │   │   React + Tailwind          │ │
│  │  React Query        │   │   Role-gated routes         │ │
│  └──────────┬──────────┘   └──────────────┬──────────────┘ │
└─────────────┼────────────────────────────────┼─────────────┘
              │  HTTPS / JSON (REST API)        │
              ▼                                 ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS.JS API SERVER                     │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │  Auth    │  │  Apps    │  │  AI      │  │  Admin    │  │
│  │  Module  │  │  Module  │  │  Module  │  │  Module   │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Resumes  │  │ Notifs   │  │ Subs     │  │  Cron     │  │
│  │  Module  │  │  Module  │  │  Module  │  │  Jobs     │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
│                                                             │
│              Prisma ORM  │  Redis Client                   │
└──────────────────────────┼──────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐
    │ PostgreSQL │  │   Redis    │  │   AWS S3   │
    │ (Primary   │  │  (Cache +  │  │  (Resume   │
    │  database) │  │  Rate      │  │   files)   │
    │            │  │  limiting) │  │            │
    └────────────┘  └────────────┘  └────────────┘
           │
           │  Third-Party Services
           │
    ┌──────┴──────────────────────────────────────┐
    │  OpenAI API   Stripe API   SendGrid API      │
    │  (AI review)  (Payments)   (Emails)          │
    └─────────────────────────────────────────────┘
```

---

## 13. File Upload System

### Flow

1. Frontend sends `POST /api/resumes/upload` as `multipart/form-data`
2. Multer middleware validates: file type = `application/pdf`, size ≤ 5MB
3. Server generates unique S3 key: `resumes/{userId}/{timestamp}-{sanitized-filename}.pdf`
4. Server uploads buffer to S3 using AWS SDK v3 `PutObjectCommand`
5. S3 returns success; server builds public URL
6. Server inserts row into `resumes` table with `file_url` and `file_key`
7. Returns resume record to frontend

### S3 Configuration

- Bucket is **private** (not publicly accessible)
- Files are served via **pre-signed URLs** with 1-hour expiry (generated on each request)
- This keeps resume files private and only accessible to their owner

### File Limits by Plan

| Plan | Max Resume Uploads | Max File Size |
|------|--------------------|---------------|
| Free | 2 | 5 MB |
| Pro | 10 | 5 MB |
| Premium | Unlimited | 10 MB |

---

## 14. Notification & Reminder System

### Channels

1. **In-app notifications** — stored in `notifications` table, shown via bell icon in navbar
2. **Email notifications** — sent via SendGrid transactional email API

### Cron Jobs

Located in `/src/jobs/`:

#### `followUpReminder.js` — runs daily at 09:00 AM UTC

```
1. Query applications WHERE follow_up_date = CURRENT_DATE
   AND status NOT IN ('offer', 'rejected')
   AND is_archived = false
2. For each match:
   a. Create a notification row (type: 'follow_up_reminder')
   b. Send email via SendGrid with company name + role + follow-up tip
3. Log job completion
```

#### `monthlyAiReset.js` — runs on the 1st of each month at 00:01 AM UTC

```
1. Redis keys with prefix `ai_usage:*` expire naturally via TTL
2. This job is a safety net: logs reset confirmation
```

### Email Templates

All emails are HTML templates stored in `/src/templates/email/`:

- `follow-up-reminder.html` — "Time to follow up with {{company}}!"
- `welcome.html` — Welcome email on registration
- `subscription-upgraded.html` — Plan upgrade confirmation
- `subscription-cancelled.html` — Cancellation confirmation

### Notification Preferences

Users can toggle in Settings:
- Follow-up reminders: ON/OFF
- Email notifications: ON/OFF
- In-app notifications: always ON (cannot be disabled)

---

## 15. Subscription & Payment System

### Plans

| Feature | Free | Pro ($9/mo) | Premium ($19/mo) |
|---------|------|-------------|------------------|
| Applications | 25 max | Unlimited | Unlimited |
| Resume uploads | 2 | 10 | Unlimited |
| AI resume reviews | 3/month | 20/month | Unlimited |
| AI cover letters | 3/month | 20/month | Unlimited |
| Follow-up reminders | ✓ | ✓ | ✓ |
| Analytics | Basic | Full | Full + Export |
| Priority support | ✗ | ✗ | ✓ |

### Stripe Integration

1. User clicks "Upgrade to Pro" → frontend calls `POST /api/subscriptions/create-checkout`
2. Backend creates a Stripe Checkout Session with the correct `priceId`
3. Returns `checkoutUrl` to frontend → frontend redirects user to Stripe-hosted checkout page
4. User completes payment on Stripe
5. Stripe fires a `checkout.session.completed` webhook to `POST /api/webhooks/stripe`
6. Backend verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
7. Backend updates `subscriptions` table: plan, status, `stripe_customer_id`, `stripe_sub_id`
8. User is redirected back to `/billing?success=true`

### Webhook Events Handled

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Activate subscription, update plan in DB |
| `invoice.payment_succeeded` | Extend `current_period_end`, keep plan active |
| `invoice.payment_failed` | Set status to `past_due`, notify user |
| `customer.subscription.updated` | Update plan if user switched tiers |
| `customer.subscription.deleted` | Downgrade to free plan |

---

## 16. Analytics & Dashboard

### User Analytics

Computed via Prisma aggregation queries on the `applications` table, scoped to `userId`:

| Metric | Query type |
|--------|-----------|
| Total applications sent | COUNT |
| Applications by status | GROUP BY status |
| Applications over time | GROUP BY week/month |
| Response rate % | (non-applied statuses) / total × 100 |
| Avg days to first response | AVG(first_status_change - applied_at) |
| Top sources | GROUP BY source ORDER BY COUNT DESC |
| Resume performance | GROUP BY resume_id, COUNT interviews |

### Admin Analytics

Computed via aggregation across all users. Cached in Redis with 1-hour TTL:

| Metric | Source |
|--------|--------|
| Total users | COUNT users |
| Active users (30 days) | COUNT users WHERE last_active > NOW() - 30d |
| MRR | SUM(plan prices) for active subscriptions |
| Churn rate | (cancelled this month) / (active at start of month) |
| AI cost | SUM(ai_requests.cost_usd) for current month |
| Plan distribution | GROUP BY subscriptions.plan |

---

## 17. Tech Stack

### Frontend

| Tool | Purpose |
|------|---------|
| React 18 (Vite) | UI framework and build tool |
| React Router v6 | Client-side routing |
| Tailwind CSS | Utility-first styling |
| React Query (TanStack) | Data fetching, caching, sync |
| Axios | HTTP client |
| React Hook Form | Form management |
| Zod | Schema validation (shared with backend) |
| Recharts | Charts for analytics pages |
| react-beautiful-dnd | Kanban drag-and-drop |

### Backend

| Tool | Purpose |
|------|---------|
| Node.js 20+ | Runtime |
| Express.js | Web framework |
| Prisma | ORM + migrations |
| JWT (jsonwebtoken) | Access token handling |
| Passport.js | Google OAuth2 strategy |
| bcrypt | Password hashing |
| Multer | File upload middleware |
| AWS SDK v3 | S3 file operations |
| node-cron | Scheduled jobs |
| Zod | Request validation |
| Morgan | HTTP request logging |
| Winston | Application logging |
| ioredis | Redis client |

### Databases & Infrastructure

| Tool | Purpose |
|------|---------|
| PostgreSQL 15 | Primary relational database |
| Redis 7 | Rate limiting + caching |
| AWS S3 | Resume file storage |

### Third-Party Services

| Service | Purpose |
|---------|---------|
| OpenAI API (GPT-4o) | Resume review, cover letter, interview questions |
| Stripe | Subscription billing and payment processing |
| SendGrid | Transactional email delivery |

### DevOps & Deployment

| Tool | Purpose |
|------|---------|
| Docker + Docker Compose | Local development environment |
| Vercel | Frontend deployment (automatic from GitHub) |
| Railway | Backend + PostgreSQL + Redis deployment |
| GitHub Actions | CI/CD pipeline (lint, test, deploy) |

---

## 18. Folder Structure

### Frontend (`/client`)

```
client/
├── public/
├── src/
│   ├── api/                    # Axios API call functions
│   │   ├── applicationsApi.js
│   │   ├── aiApi.js
│   │   ├── authApi.js
│   │   ├── adminApi.js
│   │   └── notificationsApi.js
│   ├── components/             # Reusable UI components
│   │   ├── common/             # Button, Input, Modal, Badge, etc.
│   │   ├── kanban/             # KanbanBoard, KanbanCard, KanbanColumn
│   │   ├── ai/                 # AIReviewPanel, CoverLetterForm
│   │   ├── resume/             # ResumeCard, ResumeUploader
│   │   └── charts/             # FunnelChart, TimelineChart, etc.
│   ├── context/
│   │   └── AuthContext.jsx     # Current user + token state
│   ├── hooks/                  # Custom React hooks
│   │   ├── useApplications.js
│   │   ├── useAuth.js
│   │   ├── useAIUsage.js
│   │   └── useAnalytics.js
│   ├── pages/                  # One file per route
│   │   ├── Landing.jsx
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ApplicationDetail.jsx
│   │   ├── ResumeVault.jsx
│   │   ├── AIReview.jsx
│   │   ├── Analytics.jsx
│   │   ├── Billing.jsx
│   │   └── admin/
│   │       ├── AdminDashboard.jsx
│   │       ├── AdminUsers.jsx
│   │       └── AdminAIUsage.jsx
│   ├── router/
│   │   ├── AppRouter.jsx       # All routes defined here
│   │   └── PrivateRoute.jsx    # Auth guard component
│   ├── utils/
│   │   ├── formatDate.js
│   │   └── planLimits.js
│   ├── App.jsx
│   └── main.jsx
├── .env
└── vite.config.js
```

### Backend (`/server`)

```
server/
├── prisma/
│   ├── schema.prisma           # Full database schema
│   └── migrations/             # Auto-generated migration files
├── src/
│   ├── config/
│   │   ├── db.js               # Prisma client instance
│   │   ├── redis.js            # Redis client instance
│   │   ├── s3.js               # AWS S3 client
│   │   ├── stripe.js           # Stripe client
│   │   └── openai.js           # OpenAI client
│   ├── middleware/
│   │   ├── verifyToken.js      # JWT decode + attach req.user
│   │   ├── requireAdmin.js     # Role check: admin only
│   │   ├── checkPlanLimit.js   # AI rate limit check
│   │   ├── validateRequest.js  # Zod schema validation
│   │   └── errorHandler.js     # Global error handler
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.js
│   │   │   ├── auth.controller.js
│   │   │   └── auth.service.js
│   │   ├── applications/
│   │   │   ├── applications.routes.js
│   │   │   ├── applications.controller.js
│   │   │   └── applications.service.js
│   │   ├── resumes/
│   │   │   ├── resumes.routes.js
│   │   │   ├── resumes.controller.js
│   │   │   └── resumes.service.js
│   │   ├── ai/
│   │   │   ├── ai.routes.js
│   │   │   ├── ai.controller.js
│   │   │   ├── ai.service.js
│   │   │   └── prompts/
│   │   │       ├── resumeReview.prompt.js
│   │   │       └── coverLetter.prompt.js
│   │   ├── notifications/
│   │   │   ├── notifications.routes.js
│   │   │   ├── notifications.controller.js
│   │   │   └── notifications.service.js
│   │   ├── subscriptions/
│   │   │   ├── subscriptions.routes.js
│   │   │   ├── subscriptions.controller.js
│   │   │   └── subscriptions.service.js
│   │   └── admin/
│   │       ├── admin.routes.js
│   │       ├── admin.controller.js
│   │       └── admin.service.js
│   ├── jobs/
│   │   ├── scheduler.js        # Registers all cron jobs
│   │   └── followUpReminder.js # Daily follow-up job
│   ├── templates/
│   │   └── email/
│   │       ├── followUpReminder.html
│   │       └── welcome.html
│   ├── utils/
│   │   ├── generateToken.js
│   │   ├── sendEmail.js
│   │   └── uploadToS3.js
│   └── app.js                  # Express app setup + route registration
├── server.js                   # Entry point, starts HTTP server
├── .env
├── Dockerfile
└── docker-compose.yml
```

---

## 19. Deployment Architecture

### Production Setup

```
GitHub Repository
       │
       ├──► Vercel (Frontend)
       │    - Auto-deploys on push to main
       │    - Serves React app from global CDN
       │    - Environment: VITE_API_URL=https://api.careerpilot.app
       │
       └──► Railway (Backend)
            - Auto-deploys Express server
            - Hosts PostgreSQL database
            - Hosts Redis instance
            - Environment variables set in Railway dashboard
```

### Services Map

| Service | Provider | URL Pattern |
|---------|----------|-------------|
| Frontend | Vercel | `https://careerpilot.app` |
| API Server | Railway | `https://api.careerpilot.app` |
| PostgreSQL | Railway | Internal connection string |
| Redis | Railway | Internal connection string |
| File Storage | AWS S3 | `https://s3.amazonaws.com/careerpilot-resumes/` |
| AI | OpenAI | `https://api.openai.com/v1` |
| Payments | Stripe | `https://api.stripe.com` |
| Email | SendGrid | `https://api.sendgrid.com` |

### Docker Compose (Local Development)

```yaml
services:
  api:
    build: ./server
    ports: ["5000:5000"]
    depends_on: [postgres, redis]
    env_file: ./server/.env

  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: careerpilot
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7
    ports: ["6379:6379"]
```

---

## 20. Development Phases & Timeline

### Phase 1 — Foundation (Weeks 1–2)
- [ ] Project scaffold: Vite + Express + Prisma + Docker Compose
- [ ] Database schema + first migration
- [ ] User registration and login (email/password)
- [ ] JWT access token + refresh token cookie
- [ ] Google OAuth setup
- [ ] `verifyToken` and `requireAdmin` middleware
- [ ] Basic React router with public/private routes
- [ ] AuthContext + login/signup pages

### Phase 2 — Core Features (Weeks 3–4)
- [ ] Applications CRUD API (all 6 endpoints)
- [ ] Kanban board UI with drag-and-drop
- [ ] Application detail page
- [ ] S3 file upload setup
- [ ] Resume vault — upload, list, delete
- [ ] Link resume to application

### Phase 3 — AI Features (Weeks 5–6)
- [ ] OpenAI client setup
- [ ] Prompt templates (resume review, cover letter)
- [ ] `POST /api/ai/review-resume` endpoint
- [ ] `POST /api/ai/cover-letter` endpoint
- [ ] Redis rate limiting middleware
- [ ] AI usage logging to `ai_requests` table
- [ ] AI review UI + cover letter generator UI

### Phase 4 — Notifications & Reminders (Weeks 7–8)
- [ ] `notifications` table + CRUD endpoints
- [ ] Notification bell + dropdown in frontend
- [ ] node-cron setup
- [ ] Follow-up reminder cron job
- [ ] SendGrid email integration
- [ ] Email templates (follow-up, welcome)
- [ ] Notification preferences in Settings

### Phase 5 — Payments & Admin (Weeks 9–10)
- [ ] Stripe products + prices setup in Stripe dashboard
- [ ] Checkout session creation endpoint
- [ ] Stripe webhook handler
- [ ] Billing page in frontend
- [ ] Admin panel pages (dashboard, users, AI usage)
- [ ] Admin-only routes + `requireAdmin` on all `/api/admin/*`
- [ ] Broadcast notification endpoint

### Phase 6 — Analytics, Polish & Deploy (Weeks 11–12)
- [ ] User analytics aggregation queries
- [ ] Admin analytics + Redis caching
- [ ] Recharts integration (funnel, timeline, pie charts)
- [ ] Loading states, error boundaries, empty states
- [ ] Form validation with Zod everywhere
- [ ] Responsive mobile design
- [ ] Dockerfile + docker-compose for prod
- [ ] Deploy frontend to Vercel
- [ ] Deploy backend + DB + Redis to Railway
- [ ] README with setup instructions + screenshots

---

## 21. Environment Variables

### Backend (`/server/.env`)

```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/careerpilot

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

# AWS S3
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
S3_BUCKET_NAME=careerpilot-resumes

# OpenAI
OPENAI_API_KEY=sk-...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# SendGrid
SENDGRID_API_KEY=SG...
SENDGRID_FROM_EMAIL=noreply@careerpilot.app

# Frontend URL (for CORS + OAuth redirects)
CLIENT_URL=http://localhost:5173
```

### Frontend (`/client/.env`)

```env
VITE_API_URL=http://localhost:5000
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

---

## 22. Resume Bullet Points

Once this project is built, here is how you describe it on your resume:

---

**CareerPilot — AI-Powered Job Application Tracker** *(Full-Stack SaaS)*
`React` `Node.js` `PostgreSQL` `OpenAI` `Stripe` `Redis` `AWS S3`

- Architected and deployed a full-stack SaaS platform enabling job seekers to track applications via a Kanban CRM, with separate user and admin panels protected by JWT-based role-based access control
- Integrated OpenAI GPT-4o to power an AI resume reviewer and cover letter generator, implementing plan-based rate limiting via Redis counters to enforce per-tier usage quotas (Free: 3/month, Pro: 20/month)
- Designed a normalized PostgreSQL schema with 8 tables and Prisma ORM, supporting complex relational queries across users, applications, resumes, interviews, and AI usage logs
- Built a Stripe subscription system handling Free / Pro / Premium plans, implementing webhook handlers for 5 Stripe events including payment failures and subscription cancellations
- Implemented a node-cron follow-up reminder system that queries stale applications daily and delivers dual-channel notifications (in-app + SendGrid email) to users
- Engineered a secure resume file upload pipeline using Multer → AWS S3 with pre-signed URL delivery, enforcing file type validation, size limits, and per-plan upload quotas
- Developed a React analytics dashboard using Recharts visualizing personal job search funnel, response rates, and source performance; admin dashboard cached with Redis (1-hour TTL) for platform-wide metrics
- Deployed with Docker Compose locally, frontend on Vercel CDN, and backend + PostgreSQL + Redis on Railway with GitHub Actions CI/CD

---

*Document version: 1.0 | Project: CareerPilot | Status: Ready to build*
