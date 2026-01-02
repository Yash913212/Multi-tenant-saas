# Multi-Tenant SaaS Platform

A production-style starter for a multi-tenant project/task management SaaS. Includes tenant isolation, RBAC, subscription plan limits, audit logging, and Dockerized backend/frontend/database.

## Stack
- Backend: Node.js, Express, Knex, PostgreSQL, JWT
- Frontend: React (Vite), React Router, Axios
- Infra: Docker Compose (database, backend, frontend)

## Quick start (Docker)
1. Ensure Docker is running.
2. From repository root: `docker-compose up -d`
3. Backend: http://localhost:5000/api — health at `/api/health`
4. Frontend: http://localhost:3000
5. Database: localhost:5432 (credentials in `.env`)

Migrations and seeds run automatically when the backend container starts.

### Seeded accounts
- Super Admin: `superadmin@system.com` / `Admin@123`
- Demo tenant admin: `admin@demo.com` / `Demo@123`
- Demo users: `user1@demo.com`, `user2@demo.com` (password `User@123`)

## Development (local, optional)
Backend:
- `cd backend && npm install`
- Ensure Postgres is running; set `DATABASE_URL`
- `npm run dev`

Frontend:
- `cd frontend && npm install`
- `npm run dev`

## Environment variables
See `.env` in repo for development-safe defaults (required by automated evaluation). Key values: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `VITE_API_BASE_URL`.

## Project layout
- `backend/` Express API, migrations, seeds
- `frontend/` React SPA
- `docs/` research, PRD, architecture, API docs

## Notes
- Plan limits enforced: free (5 users, 3 projects), pro (25/15), enterprise (100/50).
- RBAC: super_admin (global), tenant_admin, user.
- Tenant isolation: all records carry `tenant_id`; middleware blocks cross-tenant access.
