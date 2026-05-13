# HRFlow

A production-grade HR & Internal Communication Management Platform built as part of the BRTGC Engineering Internship Assessment.

**Live demo credentials after seeding:**
| Role | Email | Password |
|---|---|---|
| Admin | admin@hrflow.com | admin123 |
| HR Manager | hr@hrflow.com | hr123 |
| Employee | emeka@hrflow.com | password123 |

---

## Tech Stack

| Technology | Version | Why |
|---|---|---|
| Next.js (App Router) | 14.2.29 | Unified server + client, file-based routing, API routes co-located with pages |
| TypeScript (strict) | 5.x | End-to-end type safety. Zero `any` types in business logic |
| Prisma ORM | 5.x | Type-safe database client with MongoDB adapter |
| MongoDB Atlas | - | Flexible document model suits HR data with variable fields per employee |
| NextAuth.js | 4.x | Battle-tested JWT auth with credentials provider and RBAC callbacks |
| TanStack Query | 5.x | Server state - caching, background refetch, optimistic updates |
| Zustand | 5.x | Client state - sidebar open/closed, UI preferences. No Redux boilerplate |
| Zod | 3.x | Shared validation schemas between client forms and server API routes |
| Tailwind CSS + shadcn/ui | 3.x | Utility-first styling with accessible unstyled component primitives |
| Recharts | 2.x | Composable chart library for dashboard analytics |

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)
- MongoDB Atlas account (free M0 tier works)

### 1. Clone and install

```bash
git clone https://github.com/Astronomox/hrflow.git
cd hrflow
pnpm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/hrflow?retryWrites=true&w=majority"
NEXTAUTH_SECRET="generate-with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
NEXTAUTH_URL="http://localhost:3000"
```

**MongoDB Atlas setup:**
1. Create free cluster at mongodb.com/atlas
2. Database Access → Add user with password
3. Network Access → Add IP → Allow from Anywhere (0.0.0.0/0)
4. Connect → Drivers → copy connection string → replace `<password>`

### 3. Database setup

```bash
npx prisma generate
npx prisma db push
pnpm db:seed
```

### 4. Run

```bash
pnpm dev        # development
pnpm build      # production build
pnpm start      # production server
```

---

## Architecture

### Folder Structure

```
src/
  app/
    (auth)/           # Login and register pages - redirects if already authenticated
    (dashboard)/      # All protected pages - auth-guarded via middleware + layout
      page.tsx        # Dashboard home
      employees/      # Employee CRUD
      departments/    # Department management
      attendance/     # Clock in/out + history
      leave/          # Leave requests + management queue
      messages/       # Conversation list + chat view
      files/          # File upload and browser
    api/              # API route handlers - one file per resource
  components/
    ui/               # shadcn/ui primitives (button, input, dialog, etc.)
    shared/           # Reusable app components (EmptyState, PageHeader, Avatar, etc.)
    layout/           # Sidebar, Topbar, MobileNav
    employees/        # Domain-specific components (EmployeeTable, EmployeeForm)
  hooks/              # TanStack Query hooks - one file per domain
  lib/
    auth.ts           # NextAuth config
    prisma.ts         # Prisma singleton client
    utils.ts          # cn(), formatDate(), formatFileSize(), etc.
    constants.ts      # Role labels, status colors, nav items
    validations/      # Zod schemas shared between client and server
  stores/             # Zustand stores (ui-store: sidebar state, theme)
  types/              # Central TypeScript interfaces and API response types
  providers/          # React context wrappers (QueryProvider, SessionProvider, ThemeProvider)
  middleware.ts       # Edge middleware - JWT validation + role-based route protection
```

### Why App Router (not Pages Router)?

Server components allow data fetching without client JavaScript. API routes live alongside pages in the same `app/` directory, reducing cognitive overhead. Route groups (`(auth)`, `(dashboard)`) let us apply layouts selectively without affecting URLs.

### Why React Query + Zustand instead of Redux?

These are fundamentally different kinds of state:

- **Server state** (employees, leave requests, messages) lives on the server and needs fetching, caching, and synchronisation. React Query is purpose-built for this.
- **Client state** (sidebar open/closed, theme) never touches the server. Zustand handles this in 10 lines.

Mixing both into Redux is an anti-pattern. Separating them by concern makes each simpler.

### Why User and Employee are separate models?

`User` holds authentication credentials (email, hashed password, role). `Employee` holds HR profile data (position, department, attendance records). This separation means:

- Auth logic never touches HR fields
- A user account can theoretically exist without an employee profile (admin-only accounts)
- The `onDelete: Cascade` on the User→Employee relation keeps cleanup automatic

### Conversation Participant Pattern

Instead of `senderId`/`receiverId` on `Conversation`, a `ConversationParticipant` join table supports all four conversation types:

| Type | Participants |
|---|---|
| DIRECT | Employee ↔ Employee |
| EMPLOYEE_TO_DEPT | Employee → Department |
| DEPT_TO_DEPT | Department → Department |
| DEPT_TO_EMPLOYEE | Department → Employee |

A single query pattern handles all four, and the model scales to group conversations without schema changes.

---

## API Reference

All endpoints require a valid session cookie (set by NextAuth on login).

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/callback/credentials` | Login (NextAuth) |

### Employees
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/employees` | Any | List with search, filter, pagination |
| POST | `/api/employees` | Admin, HR | Create employee |
| GET | `/api/employees/[id]` | Any | Get employee profile |
| PATCH | `/api/employees/[id]` | Admin, HR | Update employee |
| DELETE | `/api/employees/[id]` | Admin only | Deactivate employee |

### Departments
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/departments` | Any | List all departments |
| POST | `/api/departments` | Admin, HR | Create department |
| GET | `/api/departments/[id]` | Any | Department detail |
| PATCH | `/api/departments/[id]` | Admin, HR | Update department |
| DELETE | `/api/departments/[id]` | Admin only | Delete department |

### Attendance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/attendance` | Own records (Employee), Any (HR/Admin) | Get attendance history |
| POST | `/api/attendance` | Employee | Clock in |
| PATCH | `/api/attendance/clock-out` | Employee | Clock out |

### Leave
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/leave` | Own (Employee), All with `?all=true` (HR/Admin) | List leave requests |
| POST | `/api/leave` | Employee | Submit leave request |
| PATCH | `/api/leave/[id]/review` | Admin, HR | Approve or reject |

### Messages
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/messages/conversations` | Any | List conversations |
| POST | `/api/messages/conversations` | Any | Create conversation |
| GET | `/api/messages/conversations/[id]` | Any | Get messages in conversation |
| POST | `/api/messages/conversations/[id]/messages` | Any | Send message |

### Files
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/files` | Scoped by role | List files (`?scope=mine\|department\|all`) |
| POST | `/api/files` | Any | Upload file (multipart/form-data) |
| DELETE | `/api/files/[id]` | Owner only | Delete file |

### Dashboard
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/stats` | Any | Aggregated stats for dashboard |

---

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT sessions signed with `NEXTAUTH_SECRET`
- Route protection at middleware level (edge runtime) - not just client-side
- Role checks on every mutating API endpoint - middleware alone is not enough
- Employees can only read their own attendance records - HR/Admin can read any
- File `scope=department` returns only the user's own department's files
- `NEXTAUTH_URL` enforced to prevent open redirect attacks
- `.env` excluded from git via `.gitignore`
- Session auto-expires after 5 minutes of user inactivity

---

## Assumptions

1. One employee belongs to one department at a time (not multi-department)
2. File uploads are stored in Vercel Blob for production. In a self-hosted environment this would be S3 or Cloudinary
3. Real-time messaging is implemented via polling (5s interval) - sufficient for an internal tool, with a clear upgrade path to WebSockets
4. The `EMPLOYEE` role can view colleagues' profiles but cannot create or deactivate accounts
5. Attendance is tracked per calendar day - one clock-in per employee per day, enforced at the database level via a unique compound index

---

## Tradeoffs

| Decision | Tradeoff |
|---|---|
| Polling vs WebSockets | WebSockets need a persistent server (not compatible with serverless/Vercel). Polling at 5s is simple, works everywhere, and is acceptable for an internal HR tool |
| Vercel Blob vs S3/Cloudinary | Vercel Blob integrates natively with the deployment platform at zero config. S3 would be more portable but adds IAM setup and SDK complexity for no gain in this context |
| MongoDB vs PostgreSQL | MongoDB's flexible schema suits HR data. Tradeoff: no native foreign key enforcement - referential integrity is handled at the Prisma/application layer |
| JWT sessions vs database sessions | JWT is stateless and scales horizontally without a session store. Tradeoff: tokens can't be instantly revoked server-side (mitigated by the 5-minute idle timeout) |
| shadcn/ui vs a full component library | shadcn gives unstyled accessible primitives we own and customise. A full library like MUI would be faster initially but harder to customise for a branded product |

---

## What I Would Improve With More Time

1. **WebSocket messaging** - replace polling with Socket.io for true real-time
2. **Email notifications** - SendGrid integration for leave approval/rejection emails
3. **Audit log** - every create/update/delete tracked with actor, timestamp, diff
4. **Advanced RBAC** - department-scoped HR permissions (HR Manager can only manage their own department)
5. **File previews** - in-browser PDF viewer and image lightbox
6. **Test coverage** - Vitest unit tests for Zod schemas and API route handlers
7. **Docker** - `docker-compose.yml` with MongoDB container for one-command local setup
8. **PWA** - service worker for offline attendance history viewing
9. **Pagination on messages** - cursor-based pagination for large conversation histories
10. **Profile image upload** - direct image upload to replace the URL input field

---

## Project Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # TypeScript check + production build
pnpm start            # Run production build
pnpm db:seed          # Seed database with demo data
npx prisma studio     # Visual database browser (localhost:5555)
npx prisma db push    # Apply schema changes to database
npx prisma generate   # Regenerate Prisma client after schema changes
```
