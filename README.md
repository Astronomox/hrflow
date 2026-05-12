# HRFlow

A production-grade HR and Internal Communication Management Platform built with Next.js 14, TypeScript, Prisma ORM, and MongoDB.

---

## Tech Stack

| Technology | Reason |
|---|---|
| **Next.js 14 (App Router)** | Server components, file-based routing, API routes in one framework |
| **TypeScript (strict)** | End-to-end type safety; no `any` types |
| **Prisma ORM + MongoDB** | Type-safe database client; MongoDB Atlas for scalable document storage |
| **NextAuth.js** | Battle-tested auth with JWT sessions and credentials provider |
| **TanStack Query** | Server state management with caching, background refetch, and optimistic updates |
| **Zustand** | Lightweight client state for UI (sidebar, theme) — no Redux boilerplate |
| **Zod** | Shared validation schemas between client forms and server API routes |
| **Tailwind CSS + shadcn/ui** | Utility-first styling with accessible, unstyled component primitives |
| **Recharts** | Composable chart library for dashboard analytics |

---

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas account (free tier works)

### 2. Clone and install

```bash
git clone <your-repo-url>
cd hrflow
pnpm install
```

### 3. Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/hrflow?retryWrites=true&w=majority"
NEXTAUTH_SECRET="generate-with: openssl rand -base64 32"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Database setup

```bash
npx prisma generate
npx prisma db push
```

### 5. Seed with demo data

```bash
pnpm db:seed
```

This creates:
- Admin: `admin@hrflow.com` / `admin123`
- HR Manager: `hr@hrflow.com` / `hr123`
- 5 sample employees: `emeka@hrflow.com` / `password123` (and others)
- 3 departments, attendance records, leave requests, conversations

### 6. Run development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

```env
DATABASE_URL="mongodb+srv://..."   # MongoDB Atlas connection string
NEXTAUTH_SECRET="..."              # Random 32-char secret for JWT signing
NEXTAUTH_URL="http://localhost:3000"  # Your app's base URL
```

---

## Architecture

### Why App Router?

Next.js App Router enables co-location of server and client components. API routes live alongside pages, reducing the surface area of the codebase. Server components fetch data directly without an extra API hop where appropriate.

### Folder Structure Rationale

```
src/
  app/          — Pages and API routes (Next.js App Router convention)
  components/   — UI split into: ui/ (shadcn primitives), shared/ (reusable app components), feature/ (domain-specific)
  hooks/        — TanStack Query hooks — one file per domain (use-employees, use-leave, etc.)
  lib/          — Shared utilities, Prisma client singleton, auth config, Zod schemas
  stores/       — Zustand stores for client-only state
  types/        — Central TypeScript interfaces
  providers/    — React context providers (query, session, theme)
```

### Why React Query + Zustand (not Redux)?

React Query handles *server state* — data that lives on the server and needs fetching, caching, and synchronisation. Zustand handles *client state* — UI preferences that never touch the server. Separating these concerns avoids the anti-pattern of storing server data in Redux.

---

## Database Design

### Why separate User and Employee?

`User` holds authentication data (email, password, role). `Employee` holds HR data (position, department, attendance). This separation means:
- A user can exist without an employee profile (e.g. future admin-only accounts)
- Auth logic never touches HR fields
- Clean single-responsibility per model

### Conversation Participants Pattern

Instead of storing `senderId`/`receiverId` directly on `Conversation`, a `ConversationParticipant` join table is used. This supports all four conversation types (1:1, employee→dept, dept→dept, dept→employee) with a single query pattern, and scales to group conversations in the future.

The `@@unique([employeeId, date])` constraint on `Attendance` enforces the business rule that an employee can only clock in once per day at the database level — not just in application code.

---

## Assumptions

1. File uploads are stored locally in `/public/uploads/`. In production this would use S3 or similar.
2. Real-time messaging is implemented via polling (5s interval) rather than WebSockets — sufficient for an assessment, with a clear upgrade path.
3. The `EMPLOYEE` role can read all colleagues' profiles but cannot create or deactivate employees.
4. Department membership is a single foreign key — employees belong to one department at a time.

---

## Tradeoffs Considered

| Decision | Tradeoff |
|---|---|
| Polling vs WebSockets | WebSockets add infrastructure complexity (Socket.io server, connection management). Polling at 5s is simpler and acceptable for internal messaging. |
| Local file storage vs cloud | S3/Cloudinary is better for production but adds env complexity. Local storage works for demo and assessment. |
| MongoDB vs PostgreSQL | MongoDB's flexible schema suits HR data with variable fields. Prisma's MongoDB adapter means we lose some relational features (no cascading deletes via DB — handled in app layer). |
| JWT sessions vs database sessions | JWT is stateless and scales horizontally without a session store. Tradeoff: tokens can't be instantly revoked (acceptable for HR internal tool). |

---

## What I Would Improve With More Time

1. **Real-time messaging** with Socket.io — replace polling with WebSocket broadcast
2. **Email notifications** — SendGrid integration for leave approvals and announcements
3. **Audit log** — every create/update/delete tracked with actor, timestamp, and diff
4. **Advanced RBAC** — department-scoped permissions (HR can only manage their dept)
5. **PWA support** — service worker for offline attendance viewing
6. **Test coverage** — Vitest unit tests for validation schemas and API route handlers
7. **Docker** — `docker-compose.yml` for one-command local setup
8. **Pagination on messages** — currently loads all messages; needs cursor-based pagination for large histories

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@hrflow.com | admin123 |
| HR Manager | hr@hrflow.com | hr123 |
| Employee | emeka@hrflow.com | password123 |
