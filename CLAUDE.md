# CareerPilot — Project Context

> This file is the living source of truth for build progress. Updated after every major change.
> Full spec lives in [`project_brief.md`](./project_brief.md) — refer to it for detailed schemas, API contracts, prompts, etc.

## What this is

CareerPilot is an AI-powered job application tracker / career CRM. Full-stack SaaS with:
- **User panel**: Kanban application pipeline, resume vault, AI resume review + cover letter generator, analytics, billing, notifications
- **Admin panel**: user management, platform analytics, AI usage/cost tracking, feature flags, broadcast notifications

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 19 (Vite), Tailwind CSS v4, React Router v7, React Query v5, Axios, React Hook Form, Zod v4, Recharts, @hello-pangea/dnd |
| Backend | Node.js 20+, Express, Prisma ORM, JWT, Passport.js (Google OAuth), bcrypt, Multer, AWS SDK v3, node-cron, Zod, Morgan, Winston, ioredis |
| Data | PostgreSQL 15, Redis 7, AWS S3 |
| 3rd Party | OpenAI (GPT-4o), Stripe, SendGrid |
| Deploy | Docker Compose (local), Vercel (frontend), Railway (backend/db/redis) |

## Repo Layout

```
CareerPilot/
├── project_brief.md     # full spec (source of truth for requirements)
├── CLAUDE.md            # this file — progress tracker
├── client/              # React + Vite frontend
├── server/              # Express + Prisma backend
└── docker-compose.yml   # local Postgres + Redis
```

## Environment Notes

- Local machine: Node v26, npm 11. **Docker is NOT installed locally.** `docker-compose.yml` is written per spec for portability/deploy, but local dev uses the Homebrew-installed Postgres 14 and Redis 7 that were already running on this machine (services `postgresql@14` and `redis`).
- Local Postgres has no password for the local user — `DATABASE_URL` in `server/.env` uses `postgresql://meshwa@localhost:5432/careerpilot?schema=public`. The `careerpilot` database has been created. `.env.example` uses the generic `postgres:postgres` credentials from the brief for portability (e.g. when Docker Compose is used later).

## Phase Progress

### Phase 1 — Foundation (DONE)
- [x] Project scaffold: Vite + Express + Prisma + Docker Compose
- [x] Database schema + first migration
- [x] User registration and login (email/password)
- [x] JWT access token + refresh token cookie
- [x] Google OAuth setup
- [x] `verifyToken` and `requireAdmin` middleware
- [x] Basic React router with public/private routes
- [x] AuthContext + login/signup pages

Verified end-to-end: register → dashboard, logout → login, re-login → dashboard (Playwright smoke test), plus curl tests for register/login/me/refresh/duplicate-email/bad-password/validation-error/missing-token/bad-token.

### Phase 2 — Core Features (DONE)
- [x] Applications CRUD API (6 endpoints: list, create, getById, update, updateStatus, delete)
- [x] Kanban board UI with drag-and-drop (`@hello-pangea/dnd`, 5 status columns, card click → detail)
- [x] Application detail page (full fields, edit modal, delete, interviews list read-only)
- [x] S3 file upload setup (AWS SDK v3; local dev uses MinIO on port 9000, bucket `careerpilot-resumes`)
- [x] Resume vault — upload (PDF only, per-plan limits), list with presigned download URLs, delete, label patch
- [x] Link resume to application (resumeId FK with ownership check; resume label shown on Kanban cards)
- [x] Shared app layout: sidebar nav (Pipeline / Applications / Resume Vault), user info, logout
- [x] Applications list page (table view, status filter tabs, pagination, add-application modal)

Verified end-to-end: signup → Kanban (empty) → Applications page → add "Stripe / Senior Engineer" → detail page → Kanban shows card in Applied column → Resume Vault page loads. Playwright smoke test passed with no unexpected console errors.

Backend curl tests: applications CRUD all 6 endpoints ✓, resume upload/list/patch/delete ✓, free-plan 402 limit ✓, wrong file type 400 ✓, DELETE returns 204 ✓, 404 on deleted resource ✓.

**Express 5 gotcha**: `req.query` is a read-only getter in Express 5 — cannot be assigned. Fixed in `validateRequest.js` by storing parsed result in `req.parsed[source]` and having the list controller read from `req.parsed.query`.

### Phase 3 — AI Features (DONE)
- [x] OpenAI client (`server/src/config/openai.js`) + `pdf-parse` for PDF text extraction
- [x] Prompt templates (`resumeReview.prompt.js`, `coverLetter.prompt.js`)
- [x] `checkPlanLimit` middleware — Redis key `ai_usage:{userId}:{YYYY-MM}`, TTL to month-end, returns 429 at limit
- [x] `POST /api/ai/review-resume` — fetches PDF from S3, extracts text, calls GPT-4o, returns JSON score + feedback
- [x] `POST /api/ai/cover-letter` — generates 3-paragraph letter, optionally uses resume PDF for context
- [x] AI usage logging to `ai_requests` table (tokens used + cost_usd per call)
- [x] AI Review page (`/ai/review`) — resume picker + JD textarea → score ring, ATS badge, section feedback, suggestions
- [x] Cover Letter page (`/ai/cover-letter`) — split-panel form + live output with copy button

Verified: auth guard (401), validation (400), rate limit (429 when Redis counter at limit), page rendering + form validation (Playwright). Real OpenAI calls work once `OPENAI_API_KEY` in `server/.env` is set to a valid key.

**pdf-parse ESM gotcha**: `pdf-parse` doesn't expose ESM subpath exports. Used `createRequire(import.meta.url)` to require it as a CJS module from the ESM service file.

### Phase 4 — Notifications & Reminders (DONE)
- [x] Notifications CRUD API (`/api/notifications`: list, unread-count, mark-read, mark-all-read)
- [x] Notification bell in sidebar header — unread badge, dropdown with recent notifications, mark-all-read button
- [x] Notifications page (`/notifications`) — full list, per-item mark-read, empty state
- [x] node-cron follow-up reminder job — daily 09:00 UTC, queries apps with `followUpDate = today`, creates in-app notification per user
- [x] SendGrid email integration (`server/src/utils/sendEmail.js`) — non-throwing, errors logged but not propagated
- [x] Notification preferences in Settings page — Toggle UI for `followUpReminders` + `emailNotifications`, saves on toggle click
- [x] User settings API (`/api/users/settings` GET + PATCH) — name, emailNotifications, followUpReminders
- [x] Prisma schema: `emailNotifications` + `followUpReminders` columns added to User model
- [x] Monthly AI reset safety-net cron job (1st of month 00:01 UTC)

Verified end-to-end (Playwright, 7/7 checks): login → bell visible → bell dropdown opens → /notifications page loads → /settings page with toggles → toggle changes state → Settings link in sidebar footer. No unexpected console errors.

**Prisma migration workaround (Phase 4)**: `prisma migrate dev` refused to run because the init migration had been hand-edited for partial indexes. New columns were applied directly via `psql ALTER TABLE`, migration SQL file created manually, then `npx prisma migrate resolve --applied <name>` to sync migration history.

**SendGrid non-throwing pattern**: `sendEmail` catches and logs all SendGrid errors but never re-throws — email failures must not break the main notification flow.

**Notification bell polling**: `refetchInterval: 60_000` (1 min) for unread count; notifications list only fetched when dropdown is open (`enabled: open`).

### Phase 5 — Payments & Admin (DONE)
- [x] Stripe client (`server/src/config/stripe.js`) — Stripe v22
- [x] Subscriptions API (`/api/subscriptions`): `GET /my`, `POST /create-checkout`, `POST /portal`
- [x] Stripe webhook handler (`POST /api/webhooks/stripe`) — raw body, verifies signature, handles 5 events
- [x] Admin API (`/api/admin`): analytics, user list/detail/ban/plan-change/delete, AI usage log, broadcast, feature flags
- [x] Feature flags in Redis (`flag:{key}`) — 6 flags with hardcoded defaults, PATCH to override
- [x] Billing page (`/billing`) — current plan summary, Free/Pro/Premium plan cards, upgrade → Stripe checkout, manage billing → portal
- [x] Admin panel: `AdminRoute` guard (role=admin), `AdminLayout` with sidebar, `/admin/dashboard`, `/admin/users`, `/admin/ai-usage`
- [x] Admin dashboard — total users, signups (7d/30d), MAU, plan distribution bar, AI cost/calls this month, signup trend mini-chart
- [x] Admin users — paginated table, search, plan filter, inline plan change, ban/unban, delete with confirmation modal
- [x] Admin AI usage — per-request log with user/feature/tokens/cost, monthly summary cards
- [x] Broadcast notification endpoint — sends to all users or by plan segment
- [x] Sidebar updated: Billing link + Admin ↗ link (visible to admin users only)

Verified end-to-end (Playwright, 7/7 checks): login → billing page loads → Free/Pro/Premium cards visible → Billing link in sidebar → non-admin redirected from /admin/dashboard → /api/subscriptions/my returns 401 → /api/admin/analytics returns 401. No unexpected console errors.

**Stripe webhook raw body**: Registered `POST /api/webhooks/stripe` with `express.raw({ type: 'application/json' })` BEFORE `express.json()` in `app.js`. Without this, `stripe.webhooks.constructEvent` fails signature verification.

**Local Stripe testing**: Stripe keys in `server/.env` are placeholders (`sk_test_...`). Checkout and portal calls will fail until real test keys + price IDs are configured. The billing UI degrades gracefully — errors shown inline, no crashes.

### Phase 7 — Interviews & Contacts CRUD (DONE)

#### Interviews
- [x] Interviews API — nested under `/api/applications/:applicationId/interviews`
  - `GET /` — list interviews for an application (ordered by scheduledAt asc)
  - `POST /` — create interview (roundName, format, scheduledAt, durationMinutes, interviewerName, outcome, notes)
  - `PATCH /:id` — partial update (only fields sent are updated; scheduledAt preserved if omitted)
  - `DELETE /:id` — 204 no content
- [x] Ownership enforced: application must belong to authenticated user
- [x] ApplicationDetailPage updated — replaced read-only interview list with full CRUD: "+ Add Interview" button, `InterviewModal` (react-hook-form + Zod), color-coded outcome badges (passed/failed/pending/cancelled), format badges, edit/delete per card

#### Contacts
- [x] Contacts API — nested under `/api/applications/:applicationId/contacts`
  - `GET /` — list contacts for an application
  - `POST /` — create contact (name required; roleTitle, email, linkedinUrl, phone, notes optional)
  - `PATCH /:id` — partial update
  - `DELETE /:id` — 204 no content
- [x] Top-level contacts API — `GET /api/contacts` — lists all contacts for the user across all applications, includes `application { id, company, roleTitle }`
- [x] Ownership enforced via userId on contact + applicationId match
- [x] ApplicationDetailPage updated — Contacts section below Interviews: `ContactModal`, clickable email/LinkedIn links, application badge, edit/delete per card
- [x] ContactsPage (`/contacts`) — 2-column card grid, search by name/role/email/company, application badge links to detail page, edit modal, delete with confirmation, empty state
- [x] Contacts nav item added to sidebar

**Bug caught during verification**: `req.user.id` used in interviews controller but JWT payload uses `req.user.userId`. Fixed — now consistent with all other controllers.

**PATCH scheduledAt bug fixed**: `updateInterview` was always setting `scheduledAt: data.scheduledAt || null`, wiping the date when PATCH omitted the field. Fixed with `'scheduledAt' in data` guard — only updates the field when explicitly sent.

### Phase 6 — Analytics, Polish & Deploy (DONE)

- [x] User analytics API (`GET /api/analytics/user`) — total apps, by-status breakdown, response rate, apps/week, top sources, resume performance
- [x] Analytics page (`/analytics`) — pipeline funnel bar chart, apps-per-week line chart, top sources horizontal bar, resume performance table (Recharts)
- [x] Stats strip on Kanban board — Total applied / In progress / Interviews / Response rate above columns
- [x] Analytics nav item added to sidebar
- [x] Admin analytics Redis cache — 1-hour TTL, invalidated on next request after expiry
- [x] Landing page rebuilt — sticky header, hero section, 6-feature grid, 3-tier pricing cards, footer
- [x] ErrorBoundary component wrapping entire app — catches React render errors with reload button
- [x] `server/Dockerfile` — production-ready Node 20 Alpine image
- [x] `client/vercel.json` — SPA rewrite rule for React Router
- [x] `README.md` — full setup guide, env var table, deploy instructions for Vercel + Railway; 15 retina (2x) screenshots covering every major page (01-landing through 15-admin-dashboard), feature overview table, tech stack, API reference including Interview Prep endpoint; `docs/screenshots/` sequentially numbered 01–15

Verified end-to-end (Playwright, 6/6 checks): login → Kanban stats strip → /analytics page loads → Analytics nav item → Landing hero + features + pricing → /api/analytics/user returns 401. No unexpected console errors.

**Raw SQL uuid cast fix**: Prisma `$queryRaw` sends JS strings as PostgreSQL `text` parameters. Comparing to a `uuid` column fails with "operator does not exist: text = uuid". Fixed by casting the column: `user_id::text = ${userId}` instead of `user_id = ${userId}::uuid`.

## Setup & Run

### Backend (`/server`)

```bash
cd server
npm install                    # already done
cp .env.example .env           # already done locally with real local DB values
npx prisma migrate dev         # already applied (migration: 20260615175609_init)
npm run dev                     # starts on http://localhost:5000 (nodemon)
```

Health check: `GET http://localhost:5000/health` → `{"status":"ok"}`

### Frontend (`/client`)

```bash
cd client
npm install                    # already done
npm run dev                     # starts on http://localhost:5173 (Vite)
```

### MinIO (local S3 substitute for resume uploads)

```bash
# Install (one-time)
brew install minio/stable/minio minio/stable/mc

# Start MinIO data server (runs on :9000, console on :9001)
MINIO_ROOT_USER=minioadmin MINIO_ROOT_PASSWORD=minioadmin \
  minio server /tmp/minio-data --address ":9000" --console-address ":9001" &

# Create bucket (one-time after first start)
mc alias set local http://localhost:9000 minioadmin minioadmin
mc mb local/careerpilot-resumes

# Health check
curl http://localhost:9000/minio/health/live   # → 200 OK
```

`server/.env` already points at MinIO via `S3_ENDPOINT=http://localhost:9000` and `S3_FORCE_PATH_STYLE=true`. Remove those two vars when deploying against real AWS S3.

### Local Postgres / Redis (already running via Homebrew)

```bash
brew services list             # confirm postgresql@14 and redis are "started"
psql careerpilot                # connect to the local dev DB
redis-cli ping                  # should return PONG
```

### Auth endpoints implemented

- `POST /api/auth/register` — { name, email, password } → { user, accessToken } + sets `refreshToken` httpOnly cookie
- `POST /api/auth/login` — { email, password } → same shape
- `POST /api/auth/logout` — clears refresh cookie (requires access token)
- `POST /api/auth/refresh` — reads refresh cookie → issues new access token + rotated refresh cookie
- `GET /api/auth/me` — requires `Authorization: Bearer <accessToken>`
- `GET /api/auth/google` / `GET /api/auth/google/callback` — Passport Google OAuth2 (needs real `GOOGLE_CLIENT_ID`/`SECRET` in `.env` to actually work; redirects to `${CLIENT_URL}/oauth/callback?accessToken=...`)

### Phase 4 API endpoints (all require `Authorization: Bearer <accessToken>`)

**Notifications** — `/api/notifications`
- `GET /` — list; returns `[{ id, type, title, message, isRead, createdAt }]` (max 50, newest first)
- `GET /unread-count` — returns `{ count }` (number)
- `PATCH /:id/read` — mark single notification read
- `PATCH /read-all` — mark all notifications read

**User Settings** — `/api/users`
- `GET /settings` — returns `{ id, name, email, emailNotifications, followUpReminders }`
- `PATCH /settings` — body: `{ name?, emailNotifications?, followUpReminders? }`; returns updated settings

### Phase 3 API endpoints (all require `Authorization: Bearer <accessToken>` + plan limit check)

**AI** — `/api/ai`
- `POST /review-resume` — body: `{ resumeId, jobDescription }`; returns `{ overallScore, missingKeywords, sectionFeedback, topSuggestions, atsCompatibility }`
- `POST /cover-letter` — body: `{ companyName, roleTitle, whyInterested, resumeId? }`; returns `{ letter }`

Rate limits: Free 3/mo · Pro 20/mo · Premium unlimited (Redis counter `ai_usage:{userId}:{YYYY-MM}`)

### Phase 2 API endpoints (all require `Authorization: Bearer <accessToken>`)

**Applications** — `/api/applications`
- `GET /` — list (query: `page`, `limit`, `status`, `source`, `sortBy`, `order`); returns `{ items, pagination }`
- `POST /` — create; body: `{ company, roleTitle, appliedAt, status?, jobUrl?, source?, notes?, resumeId? }`
- `GET /:id` — detail (includes `interviews`, `contacts`, `resume`); interviews + contacts now fully editable from detail page
- `PATCH /:id` — update (partial, same fields as create + `isArchived`)
- `PATCH /:id/status` — status-only update; body: `{ status }`
- `DELETE /:id` — 204 no content

**Resumes** — `/api/resumes`
- `GET /` — list; returns `{ resumes }` each with fresh 1-hour presigned `downloadUrl`
- `POST /` — upload PDF (multipart/form-data: `resume` file + `label` + optional `version`); plan limits enforced
- `PATCH /:id` — update label/version
- `DELETE /:id` — removes DB row + S3 object

### Phase 7 API endpoints (all require `Authorization: Bearer <accessToken>`)

**Interviews** — `/api/applications/:applicationId/interviews`
- `GET /` — list interviews for an application (ordered scheduledAt asc)
- `POST /` — create; body: `{ roundName?, format?, scheduledAt?, durationMinutes?, interviewerName?, outcome?, notes? }`
- `PATCH /:id` — partial update (same fields; omitted fields are preserved, not nulled)
- `DELETE /:id` — 204 no content

**Contacts (nested)** — `/api/applications/:applicationId/contacts`
- `GET /` — list contacts for an application
- `POST /` — create; body: `{ name, roleTitle?, email?, linkedinUrl?, phone?, notes? }`
- `PATCH /:id` — partial update
- `DELETE /:id` — 204 no content

**Contacts (top-level)** — `/api/contacts`
- `GET /` — list all contacts for the user; each contact includes `application { id, company, roleTitle }`

### Phase 8 — Resume Builder (DONE)
- [x] Overleaf-style split layout: dark LaTeX editor (left, 50%) + live one-page preview (right, 50%)
- [x] LaTeX editor with **line numbers** — fixed-width number column synced to textarea scroll via `onScroll`
- [x] **Instant live preview** — no debounce; `parseLatex()` runs on every keystroke, updates preview immediately
- [x] **Auto-save** to `localStorage` key `cp_resume_latex_v1`; migrates old form data from `cp_resume_builder_v2` on first load
- [x] **Multi-page detection** — hidden off-screen `<ResumeContent>` measured via `offsetHeight`; `pageCount = Math.ceil(h / PAGE_H)`
- [x] **Multi-page rendering** — pages stacked with 16px gap; each page clips content at `PAGE_H` with `translateY(-(i * PAGE_H))` offset; "Page N" labels between sheets
- [x] **Page count badge** — shows `Pages 1` (grey) or `Pages 2` (red + ⚠ warning) above preview
- [x] **Exact US Letter dimensions** — `PAGE_W = 816px` (8.5in × 96dpi), `PAGE_H = 1056px` (11in × 96dpi)
- [x] **Exact margin matching** for Meshwa's template: `padding: 19px 48px 19px 38px` (derived from `\addtolength{\topmargin}{-.80in}` and `\addtolength{\oddsidemargin}{-0.6in}`)
- [x] **ScaledPreview** — `ResizeObserver` scales the page to fit panel width; `transform: scale(n)` with `position: absolute` placeholder to collapse whitespace
- [x] **LaTeX generation** (`generateLatex`) — produces Meshwa's template format: `fontawesome5`, `\faPhone\`, `\faEnvelope\`, `\faLinkedin\`, `\faGithub\`, `\section{Technical Skills}`, 10pt document class, Meshwa's margin settings
- [x] **LaTeX parser** (`parseLatex`) — handles both Jake's format `{school}{location}{degree}{dates}` and Meshwa's format `{school}{dates}{degree|GPA}{location}` via `looksLikeDate()` detection; contact split on `~` separator; strips `\fa*` icon commands; dynamic skill category extraction for both `\textbf{Cat:} value \\` and `\textbf{Cat}{: value}` formats; section header matched as `(?:Technical\s+)?Skills`
- [x] **`latexToHtml()`** — converts `\textbf{}` → `<strong>`, `\textit{}` → `<em>`, `--` → `–`, `$|$` → `|` for display; used in bullet rendering via `dangerouslySetInnerHTML`
- [x] **Flexible skills data shape** — `skills: [{ id, category, value }]` array (not hardcoded 4-field object) to support any number of categories (Meshwa has 8)
- [x] **Ghost placeholders** — greyed italic text for empty fields so the preview always looks professional
- [x] **Export PDF** — hidden `<iframe>` approach: 0×0 iframe appended to body, resume HTML written into it, `iframe.contentWindow.print()` called after 300ms render delay, iframe removed after 2s. No new tab opens — OS print/save dialog appears directly.
- [x] **Copy LaTeX button** — moved from top bar into the dark editor header bar (next to `main.tex` tab), styled in Catppuccin theme; turns green + shows "Copied!" on success.
- [x] **Top bar buttons**: Load Sample (Jake Ryan data), Reset (blank template), Export PDF
- [x] Route: `/resume-builder` — added to `AppRouter.jsx` and sidebar nav (`PenLine` icon)
- [x] **Deployed to Vercel** at `https://careerpilot-kappa.vercel.app` with `VITE_API_URL=https://careerpilot-api-ny7d.onrender.com`; backend CORS via `CLIENT_URL` env var on Render

**Key implementation notes:**
- `ResumeContent` (no height clip) is separate from `JakePage` (wraps with `height: PAGE_H, overflow: hidden`) — the measurement div uses `ResumeContent` directly to get true content height
- `extractArgs(s, n)` — balanced-brace parser skipping `\\` escaped chars; used for `\resumeSubheading`, `\resumeProjectHeading` argument extraction
- `extractItems(s)` — depth-counting brace matcher for `\resumeItem{...}` with nested braces
- `escBullet(s)` escapes only `&`, `%`, `#` (not `\`, `{`, `}`) so `\textbf{word}` in bullet fields passes through to LaTeX unchanged
- Copyright note: Overleaf-style split editor is a generic UI pattern (like CodePen, StackBlitz). Jake's Resume template is MIT-licensed. Implementation is entirely original React + CSS — no Overleaf code or assets used.

### Phase 9 — Auth Polish, Admin Enhancements & UX Fixes (DONE)

#### Forgot / Reset Password
- [x] `POST /api/auth/forgot-password` — accepts email, generates 64-char hex token via `crypto.randomBytes(32)`, stores `passwordResetToken` + `passwordResetExpiry` (1h) on user, sends branded SendGrid email with reset link. Always returns 200 — never reveals whether email exists (prevents enumeration).
- [x] `POST /api/auth/reset-password` — accepts `{ token, password }`, validates token exists and hasn't expired, bcrypt-hashes new password, clears token fields. Returns 400 for invalid/expired token.
- [x] DB migration `20260623000000_add_password_reset` — `password_reset_token VARCHAR(255) UNIQUE` + `password_reset_expiry TIMESTAMPTZ` added to `users` via `psql ALTER TABLE` + manual migration file + `prisma migrate resolve --applied`.
- [x] `ForgotPasswordPage` (`/forgot-password`) — email input, "check your email" success state with "Try again" link, back-to-login link.
- [x] `ResetPasswordPage` (`/reset-password?token=...`) — password + confirm fields, show/hide toggle, inline strength check (min 8 chars), mismatch validation, error banner for expired/invalid token, auto-redirects to `/login` after success.
- [x] "Forgot your password?" link added to Login page.
- [x] Both pages are public routes (outside `PrivateRoute`).

#### Admin Panel Additions
- [x] `AdminBroadcast` (`/admin/broadcast`) — audience picker (All / Free / Pro / Premium plan segments), title + message compose with character counters, live notification preview, sends via `POST /api/admin/notifications/broadcast`, success banner shows recipient count.
- [x] `AdminFeatureFlags` (`/admin/flags`) — toggle switches for boolean flags (`ai_review_enabled`, `cover_letter_enabled`), number inputs for plan limits (`free_plan_ai_limit`, `pro_plan_ai_limit`, `max_resume_uploads_free`, `max_resume_uploads_pro`). Save button only activates on change; "Saved ✓" confirmation appears briefly. Changes stored in Redis immediately.
- [x] Admin user detail slide-over — clicking any row in AdminUsers opens a right-side panel fetching `GET /api/admin/users/:id`; shows avatar initials, plan/status badges, joined/last-active dates, stats grid (applications, resumes, AI calls this month, AI cost this month), inline plan change dropdown, ban/unban and delete actions. Clicking outside closes it.
- [x] Admin sidebar updated: added Broadcast (`Bell` icon) and Feature Flags (`Flag` icon) nav items.

#### Layout & UX Fixes
- [x] **Sidebar scroll lock** (user panel) — outer wrapper changed from `min-h-screen` to `h-screen overflow-hidden`; aside uses `h-full`; nav gets `overflow-y-auto`. Profile/footer section stays pinned at bottom regardless of content height.
- [x] **Sidebar scroll lock** (admin panel) — same fix applied to `AdminLayout`.
- [x] **Notification bell dropdown** — changed from `right-0` to `left-0` so the 320px panel opens rightward into the main content area instead of shooting off the left edge of the screen.

**Forgot password token security**: token is cleared on use and on expiry — a used link cannot be replayed. OAuth-only accounts (no `passwordHash`) are silently skipped since they have no password to reset.

### Auth API endpoints (updated)

- `POST /api/auth/forgot-password` — body: `{ email }`; always returns 200; sends reset email if account exists and is not OAuth-only
- `POST /api/auth/reset-password` — body: `{ token, password }`; returns 200 on success, 400 if token invalid/expired

### Admin API endpoints (all require admin role)

**Broadcast** — `POST /api/admin/notifications/broadcast`
- body: `{ title, message, segment? }` where segment is `'all'` (default) | `'free'` | `'pro'` | `'premium'`
- returns: `{ sent: number }`

**Feature Flags** — `/api/admin/flags`
- `GET /` — returns object of all 6 flags with current values
- `PATCH /:key` — body: `{ value }`; updates Redis key `flag:{key}`; returns `{ key, value }`

**User Detail** — `GET /api/admin/users/:id`
- returns: full user object + `applicationCount`, `resumeCount`, `aiThisMonth: { calls, costUsd }`

### Phase 10 — Stripe Checkout, UI Polish & Production Auth Fixes (DONE)

- [x] Removed dark mode toggle from AppLayout sidebar header (unused, looked bad)
- [x] BillingPage redesigned — "Most Popular" badge moved to Premium, Stitch reference design, Enterprise link
- [x] CheckoutPage (`/billing/checkout?plan=pro|premium`) — order summary panel, plan features, trust badges, redirects to Stripe hosted checkout
- [x] Vite dev server proxy (`/api → localhost:5000`) — fixes `SameSite=Lax` cookie issue locally (browser sees same-origin; refresh cookie sent correctly on cross-port requests)
- [x] `client/.env` `VITE_API_URL=` left empty for local dev (proxy handles routing); Vercel env var still provides full URL in production
- [x] `SameSite=None` in production cookie — `vercel.app` → `onrender.com` is cross-site; `Lax` blocked refresh cookie on cross-domain POST. Fixed to `none` in production (requires `Secure=true`, already set).
- [x] Axios 401 interceptor fixed — previously tried to refresh on ALL 401s including login/register endpoints. Login returns 401 for bad credentials; interceptor was masking that with "Missing refresh token". Now excludes `/auth/login`, `/auth/register`, `/auth/refresh` from refresh logic.
- [x] Production DB (Neon PostgreSQL) seeded — migrated 14 applications, 9 contacts, 10 interviews, Pro subscription from local DB; updated admin user password hash + role.

**Production URLs**: Frontend → `https://careerpilot-kappa.vercel.app` · Backend → `https://careerpilot-api-ny7d.onrender.com`
**Production DB**: Neon PostgreSQL (external, connected via `DATABASE_URL` on Render)
**Admin login**: `meshwa0013@gmail.com` / `CareerPilot@123`

**Cookie cross-domain gotcha**: `SameSite=Lax` works for same-site (localhost with proxy) but NOT for cross-domain POST requests. Production deployments on different domains (Vercel + Render) MUST use `SameSite=None; Secure`. Local dev uses proxy to avoid needing `None` on HTTP.

**Webhook local testing**: Stripe webhooks can't reach `localhost`. For local dev, plan updates after payment must be done manually (psql). On Render, webhooks fire automatically and update the `subscriptions` table + user plan.

### Phase 11 — Jobs Board, Cover Letter Persistence & Application UX (DONE)

#### Jobs Board (`/jobs`)
- [x] `GET /api/jobs/search` — aggregates results from Adzuna, Remotive, YC HN in `Promise.allSettled`; deduplication by `source|company|title` key
- [x] `POST /api/jobs/save` — upserts to `saved_jobs` table; `DELETE /api/jobs/:id` — unsave
- [x] `GET /api/jobs/saved` — list saved jobs for current user
- [x] `POST /api/jobs/:id/pipeline` — creates an Application from a saved job
- [x] Jobs page — Browse / Saved / Applied tabs, country filter (US/IN/UK/CA/AU), source filter chips, job card grid with salary, match score, bookmark toggle, slide-over detail panel
- [x] Save/unsave fully working with optimistic updates + toast feedback
- [x] `saved_jobs` DB table + migration (`20260630000001_add_saved_jobs`)
- [x] Stale closure bug fixed — `unsaveMutation.mutationFn` now receives pre-resolved DB record (with real UUID) from call site; `onMutate` cache update can no longer make the closure stale

#### Cover Letter Persistence
- [x] `cover_letter_text` column added to `applications` table (migration `20260630000000_add_cover_letter_text`)
- [x] `CoverLetterSection` component on ApplicationDetailPage — self-contained with own `saveMutation`; saves via `PATCH /api/applications/:id`
- [x] "Save to App" button on Cover Letter generator page — `SaveToAppModal` with search + pick interface
- [x] Zod schemas updated: `coverLetterText` added to `createApplicationSchema` and `updateApplicationSchema`

#### Application UX
- [x] **Duplicate detection** — `ApplicationForm` watches `company` + `roleTitle` fields; shows amber warning banner if an existing app matches (case-insensitive). Uses a separate dedup query (enabled only when modal is open).
- [x] **Bulk actions** — checkbox column in Applications table; floating action bar with Archive + Delete buttons; `Promise.all` parallel execution; clears on filter/page change

**Stale closure root cause**: `unsaveMutation.mutationFn` captured `allSaved` from render-time closure. `onMutate` updated the cache before `mutationFn` ran, making the closure stale. Fixed by resolving the DB record at the call site before `mutate()` so `mutationFn` only depends on its argument.

**`saved_jobs` migration gap**: table was created locally via `prisma migrate dev` but the migration file was never committed. Created proper migration with `IF NOT EXISTS` guards and applied to Neon production DB.

### Phase 12 — Expanded Job Sources (DONE)

- [x] **RemoteOK** (`remoteok.com/api?tags=keyword`) — no auth, US remote-heavy, up to 15 results; source badge: pink
- [x] **Jobicy** (`jobicy.com/api/v2/remote-jobs?geo=usa&tag=keyword`) — no auth, US remote jobs with salary data; source badge: cyan
- [x] **The Muse** (`themuse.com/api/public/jobs?api_key=MUSE_API_KEY`) — free API key (`MUSE_API_KEY` env var on Render); keyword mapped to Muse job categories via `museCategory()` helper; source badge: purple
- [x] All 3 wired into `searchJobs` with `.catch(() => [])` so any single source failure never breaks the response
- [x] Source filter chips updated in `JobsPage.jsx` (`SOURCES` array + `SOURCE_META` badges)
- [x] Himalayas attempted but API returns 404 — replaced with Jobicy
- [x] **6 total sources**: Adzuna (20) · Remotive (33) · YC Jobs (12) · RemoteOK (15) · Jobicy (20) · The Muse (12) = **~112 jobs per search**

Verified end-to-end (Playwright, 23/23 checks): all 6 filter chips visible, each source returns correct badge count, individual filters work, keyword search works, save button visible, Saved tab loads.

**Muse category mapping**: keyword → nearest Muse category (`data science`, `design`, `product`, `devops`, `marketing`, `sales`, default `software engineer`). No free-text search in Muse API — category is the closest proxy.

### Phase 13 — Bug Fixes, Sidebar Polish & Design Improvements (DONE)

#### Bug Fixes
- [x] **OnboardingChecklist auto-collapse** — `collapsed` now initialises from `localStorage.cp_onboarding_v1.collapsed`; `useEffect` auto-collapses on first completed step unless `collapsedSetByUser` is set. Toggle persists both `collapsed` and `collapsedSetByUser` to localStorage. Prevents Kanban being pushed below the fold for returning users.
- [x] **Applications table showing only 1 row** — React Query cache key collision: `OnboardingChecklist` used `['applications', 'list', '', 1]` with `limit:1`, which is the exact same key as `ApplicationsPage` on page 1 with no filter. Fixed by changing OnboardingChecklist to `['applications', 'onboarding-check']`.

#### Sidebar Reorder
- [x] Nav items reordered into logical groups: Pipeline → Applications → Jobs → Contacts → Resume Vault → Resume Builder → AI Review → Cover Letter → Interview Prep → Analytics (last)

#### Design Polish
- [x] **Jobs subtitle** updated to list all 6 sources: *"Fresh jobs from Adzuna, Remotive, YC, RemoteOK, Jobicy & The Muse — updated daily"*
- [x] **Analytics stat cards** upgraded — added icons (`ClipboardList`, `Activity`, `MessageSquare`, `TrendingUp`), colored value text (amber for In Progress, purple for Interviews, green for Response Rate ≥ 30%), colored sub-labels, and progress bars. Matches Applications page style.
- [x] **Settings page** expanded — added Appearance section (Light/Dark toggle cards using `useDarkMode` hook) and Password & Security section (sends reset email via existing `/api/auth/forgot-password` flow; shows user's email address). No new API endpoints needed.

Verified end-to-end (Playwright): Analytics stat cards show icons + colors, Settings page shows all 4 sections, Jobs subtitle updated, Applications table shows all 10 rows.

**OnboardingChecklist localStorage keys**: `cp_onboarding_v1` object — `{ dismissed, collapsed, collapsedSetByUser, ai_review, cover_letter, browse_jobs }`. `collapsedSetByUser` gates the auto-collapse effect so manual user preference is respected.

### Phase 14 — Search, Sort, Polish & Bug Fixes (DONE)

#### Applications Page — Search + Sortable Columns
- [x] **Backend**: `search` query param added to `GET /api/applications` — Prisma `OR: [{ company: contains }, { roleTitle: contains }]` with `mode: 'insensitive'`; added to `listApplicationsQuerySchema` (`z.string().trim().max(200).optional()`)
- [x] **Frontend**: debounced search input (300ms) above filter tabs — controlled `searchInput` state drives debounced `search` state; X clear button; query key expanded to `['applications', 'list', statusFilter, page, search, sortBy, order]`
- [x] **Frontend**: clickable "Company & Role" and "Applied" column headers with `ChevronUp`/`ChevronDown` sort indicators — `handleSort()` toggles direction on same field, resets to `'desc'` on new field
- [x] Empty state shows contextual "No results found" + search term when search returns nothing

#### Sidebar & UI
- [x] **Interview Prep icon** changed from `MessageSquare` → `Video` (better represents interview context)

#### Bug Fixes
- [x] **Billing page flash** — plan cards rendered with `currentPlan='free'` default before subscription query resolved, briefly showing "Current plan" on Free for Pro/Premium users. Fixed by rendering animated skeleton cards while `isLoading`, gating the plan grid + enterprise link behind `!isLoading`.
- [x] **Pipeline stats strip flicker** — stats (totalApps, interviews, offers, responseRate) were sourced only from the analytics API, which is slower than the applications API. Fixed by deriving stats immediately from already-loaded Kanban `allItems` (`??` fallback pattern) — analytics still fetched for the week-trend indicator but no longer the sole source for the 4 main numbers.

Verified end-to-end (Playwright, live site): search "stripe" → 1 row; Company + Applied sort headers work; Billing correctly shows Pro as current plan; pipeline stats no longer flicker to 0.

**Stats derivation pattern**: `totalApps = analytics?.totalApplications ?? data?.pagination?.total ?? allItems.length` — `??` only falls through on `null`/`undefined`, so a real `0` from analytics is respected. Local fallbacks are accurate for ≤100 apps (Kanban `limit: 100`).

## Decisions Log

- **Prisma version**: pinned to `6.19.3` instead of the freshly-released `7.x` — Prisma 7 switched to a TS-based `prisma.config.ts` and a new client generator output path, which adds friction for a plain-JS project and diverges from the brief's documented `schema.prisma` + `DATABASE_URL` conventions. Prisma 6 matches the brief exactly.
- **ESM throughout the server** (`"type": "module"` in `server/package.json`), using `import`/`export` syntax per modern Node 20+ conventions.
- **Partial indexes**: `idx_applications_follow_up` (`WHERE is_archived = false`) and `idx_notifications_user_unread` (`WHERE is_read = false`) aren't expressible in Prisma's schema DSL, so they were added as regular `@@index` entries in `schema.prisma`, then the generated migration SQL was hand-edited to add the `WHERE` clauses (matches brief section 10 exactly).
- **Kanban DnD library**: brief specifies `react-beautiful-dnd`, which is unmaintained and has React 18 issues. Installed `@hello-pangea/dnd` instead — an actively-maintained drop-in fork with the same API. Will be wired up in Phase 2.
- **Refresh token secret**: added a separate `JWT_REFRESH_SECRET` (not in the brief's env list, which only has `JWT_SECRET`) so access and refresh tokens are signed with different secrets — standard practice, low cost.
- **express-session**: added (not in brief's tech stack) because Passport's Google OAuth2 strategy needs somewhere to stash the CSRF `state` value between the `/google` redirect and `/google/callback` request. Used only for that handshake (5 min cookie); JWT remains the actual auth mechanism (`session: false` in `passport.authenticate`).
- **Tailwind v4** via the `@tailwindcss/vite` plugin (no separate `postcss.config`/`tailwind.config` needed — v4's CSS-first config via `@import "tailwindcss"` in `index.css`).
