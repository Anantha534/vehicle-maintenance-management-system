# Vehicle Maintenance Management System

A full-stack web application for managing vehicle maintenance, service schedules, spare parts, repair history, and costs — built as a college project.

[![Tests](https://img.shields.io/badge/Tests-111%20passed-brightgreen)](./server/)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen)](./)
[![Stack](https://img.shields.io/badge/Stack-React%20%7C%20Express%20%7C%20PostgreSQL-blue)](./)

---

## Features

- **Dashboard** — fleet KPIs (total vehicles, services due, open repairs, total maintenance cost), service warnings, upcoming schedules, and recent activity.
- **Vehicles Directory** — searchable fleet table with type/status filters; full CRUD (ADMIN only).
- **Maintenance Logs** — service and repair records with mileage tracking, cost, description, and automatic vehicle-status synchronisation.
- **Spare Parts Inventory** — parts replacement records with quantity, cost, and vehicle linkage.
- **Financial & Cost Breakdown** — total expenditure, category breakdown (routine / repair / parts), SVG cost chart, and per-vehicle summary.
- **Chronological History** — audit timeline with vehicle-dropdown filtering.
- **User Management** — ADMIN can provision accounts and assign roles via the API.
- **Role-Based Access Control** — ADMIN has full read/write access; USER is read-only. All permissions enforced on the backend.
- **Bcrypt Password Security** — passwords stored as bcrypt hashes (cost factor 12); on-the-fly migration for any legacy plaintext credentials; new accounts always hashed.
- **Session Management** — token-based sessions with 24-hour sliding expiry; automatic invalidation on logout.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Node.js, Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL (embedded via `embedded-postgres`) |
| Auth | Custom token sessions + bcryptjs |
| Testing | 5 custom Node.js test suites (111 automated checks) |

---

## Prerequisites

- **Node.js v18 or later** (includes npm)
- **Windows x64** recommended (embedded-postgres ships a Windows binary)
- No separate PostgreSQL installation is required — the app starts an embedded PostgreSQL instance automatically.

> On another OS (Linux/macOS) you must supply an external PostgreSQL database and set `DATABASE_URL` in a `.env` file.

---

## Setup & First Run

```bash
# 1. Clone the repository
git clone https://github.com/Anantha534/vehicle-maintenance-management-system.git
cd vehicle-maintenance-management-system

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run prisma:generate

# 4. Apply the database schema
npm run prisma:push

# 5. Seed demo data (vehicles, maintenance, parts) and demo accounts
npm run db:seed

# 6. Start both servers together (Express on :5000, Vite on :5173)
npm run dev
```

Open your browser at **http://localhost:5173**.

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@127.0.0.1:5432/vehicle_db?schema=public"
PORT=5000
```

> `.env` is listed in `.gitignore` and is **never committed**. Do not commit real credentials.

---

## Admin Account Provisioning

> **Important:** The seeded demo accounts are for development only. Change credentials before any shared or production deployment.

The `npm run db:seed` command creates two demo accounts:

| Username | Role | Notes |
|---|---|---|
| `admin@fleet.edu` | ADMIN | Full read/write access to all resources |
| `user@fleet.edu` | USER | Read-only access |

Seed passwords are defined only in `server/seed.js` and are stored as bcrypt hashes — never in plaintext.

### Creating additional admin accounts (ADMIN API)

```bash
# POST /api/users  (requires X-Auth-Token from an active ADMIN session)
curl -X POST http://localhost:5000/api/users \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: <admin-token>" \
  -d '{"username":"newadmin@example.com","password":"ChangeMe99!","name":"New Admin","role":"ADMIN"}'
```

There is no public registration endpoint. Role cannot be self-assigned.

---

## ADMIN vs USER Permissions

| Operation | ADMIN | USER |
|---|---|---|
| View vehicles / maintenance / spare parts | ✅ | ✅ |
| Create, update, delete vehicles | ✅ | ❌ 403 |
| Create, update, delete maintenance logs | ✅ | ❌ 403 |
| Create, update, delete spare parts | ✅ | ❌ 403 |
| List users (`GET /api/users`) | ✅ | ❌ 403 |
| Create new user accounts | ✅ | ❌ 403 |

All restrictions are enforced on the **Express backend**. Hiding buttons in the frontend is a UX aid only.

---

## Run Commands Reference

| Command | Purpose |
|---|---|
| `npm run dev` | Start Express + Vite together (development) |
| `npm run server` | Start Express backend only |
| `npm run build` | Build React frontend for production |
| `npm run prisma:generate` | Regenerate Prisma client after schema changes |
| `npm run prisma:push` | Apply schema to database |
| `npm run db:seed` | Seed demo vehicles, maintenance, parts, and accounts |
| `npm test` | Run all 5 automated test suites |
| `npm run test:fullstack` | Fullstack auth + CRUD integration tests |
| `npm run test:rbac` | Role-based access control tests |
| `npm run test:bcrypt` | Bcrypt password hashing and migration tests |
| `npm run test:integrity` | Database integrity and validation tests |
| `npm run test:e2e` | End-to-end workflow tests |

---

## Automated Tests

Five Node.js test suites run against a live backend (must be running on port 5000):

| Suite | Coverage |
|---|---|
| `verify-fullstack.js` | Auth, vehicles, maintenance, spare parts CRUD |
| `verify-rbac.js` | ADMIN/USER permission enforcement on every route |
| `verify-bcrypt.js` | Hashing, migration, new accounts, escalation prevention |
| `verify-integrity.js` | Validation, cascades, orphan prevention, error codes |
| `verify-e2e.js` | Complete lifecycle: auth → CRUD → teardown |

**111 automated checks pass** as of commit `2827402`.

---

## Known Limitations

- **Browser automation testing**: Playwright was unavailable in the build environment. Frontend behaviour must be verified manually (see checklist below).
- **Session storage**: Sessions are in-memory. Restarting the server invalidates all active sessions.
- **Embedded PostgreSQL**: Tested on Windows x64. Linux/macOS deployments should use an external database.
- **No email verification**: User accounts are created directly by an ADMIN.
- **College project**: Not audited for production deployment.

---

## Manual Browser Verification Checklist

### Authentication
- [ ] Unauthenticated visit redirects to the login page
- [ ] Empty fields show a validation message
- [ ] Wrong credentials show a generic error (no account detail leaked)
- [ ] Session persists on page refresh
- [ ] Logout clears the session and returns to login
- [ ] Pressing Back after logout does not restore the authenticated view

### ADMIN Role
- [ ] All sidebar items are accessible
- [ ] Add Vehicle / Add Maintenance / Add Spare Part buttons are visible
- [ ] Edit and Delete controls appear in every table row
- [ ] Missing required fields show an inline validation error
- [ ] Valid form submission creates a record in the table
- [ ] Edit saves the change; Delete removes the record

### USER Role
- [ ] Dashboard and all view pages load correctly
- [ ] Add, Edit, and Delete buttons are **not visible**
- [ ] Direct API write calls return `403 Forbidden`

### Dashboard Data
- [ ] KPI cards display correct counts and costs
- [ ] Setting a maintenance log to "In Progress" → vehicle shows "Under Repair"
- [ ] Completing the log → vehicle returns to "Active" or "Service Due"

---

## Project Structure

```
vehicle-maintenance-management-system/
├── .env.example               # Environment variable template
├── package.json               # Scripts and dependencies
├── vite.config.js
├── index.html
├── src/                       # React frontend
│   ├── App.jsx                # Root component, routing, auth state
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── Modal.jsx
│   └── pages/
│       ├── LoginPage.jsx
│       ├── DashboardPage.jsx
│       ├── VehiclesPage.jsx
│       ├── VehicleDetailsModal.jsx
│       ├── MaintenancePage.jsx
│       ├── SparePartsPage.jsx
│       ├── CostsPage.jsx
│       └── HistoryPage.jsx
└── server/                    # Express backend
    ├── index.js               # API routes, auth, RBAC, sessions
    ├── validation.js          # Payload validation helpers
    ├── seed.js                # Database seeding script
    ├── start-pg.js            # Embedded PostgreSQL startup helper
    ├── verify-fullstack.js
    ├── verify-rbac.js
    ├── verify-bcrypt.js
    ├── verify-integrity.js
    ├── verify-e2e.js
    └── prisma/
        └── schema.prisma      # Prisma data model
```

---

## License

Created for educational / academic project review purposes.
