# Multi-Tenant SaaS Platform

A friendlier guide to a production-style multi-tenant project & task manager. You get tenant isolation, RBAC, subscription limits, audit logs, and a one-command Docker stack. React + Vite on the front; Node + Postgres on the back.

## Why you might care
- True tenant isolation and role-based access (`super_admin`, `tenant_admin`, `user`).
- Plan limits (Free / Pro / Enterprise) enforced before creating users or projects.
- Projects and tasks with status/assignment, plus audit trails for every important action.
- Docker Compose spins up database, backend, frontend, migrations, and seeds in one go.

## What’s inside (tech)
- **Backend:** Node 20, Express, PostgreSQL 15, raw SQL migrations, audit logging.
- **Frontend:** React 18, Vite 5, React Router 6, Axios, theme toggle.
- **Infra:** Docker Compose (Postgres Alpine, Node Alpine), ready for local or demo use.

## Quick start (Docker)
Prereqs: Docker 24+, Docker Compose, Git.

Clone and run:
```bash
git clone https://github.com/Yash913212/Multi-tenant-saas.git
cd Multi-tenant-sass-platform
docker-compose up -d
```

What that does:
- Boots Postgres on 5432
- Runs migrations & seeds
- Starts backend on 5000
- Starts frontend on 3000

Check it’s healthy:
```bash
docker-compose ps
curl http://localhost:5000/api/health
```

Open:
- Frontend: http://localhost:3000
- API: http://localhost:5000/api

Test logins (from `submission.json`):
- Super Admin: `superadmin@system.com` / `Admin@123`
- Demo Tenant Admin (subdomain `demo`): `admin@demo.com` / `Demo@123`
- Demo Users: `user1@demo.com` / `User@123`, `user2@demo.com` / `User@123`

Stop / clean:
```bash
docker-compose down          # stop
docker-compose down -v       # stop + wipe volumes/data
```

## Running without Docker
Backend:
```bash
cd backend
npm install
npm run migrate   # run SQL migrations
npm run seed      # load demo data
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

You’ll need PostgreSQL 15+ locally and `DATABASE_URL` set in `.env`.

## Handy API summary
- Auth: `POST /api/auth/login`, `POST /api/auth/register-tenant`
- Health: `GET /api/health`
- Tenants (super_admin): list, get, update
- Users: CRUD + `GET /api/tenants/:id/users`
- Projects: CRUD
- Tasks: CRUD per project

Full details live in [docs/api.md](docs/api.md).

## Project map
```
Multi-tenant-sass-platform/
├── backend/        # API, middleware, audit, migrations
├── frontend/       # React SPA
├── docs/           # API, architecture, PRD, technical spec, diagrams
├── docker-compose.yml
├── submission.json # test credentials
└── README.md
```

## Security highlights
- bcrypt password hashing
- JWT auth (24h), RBAC middleware
- Parameterized queries
- CORS locked to the frontend
- Tenant isolation in middleware
- Audit logging on critical actions

## Troubleshooting quick hits
- Logs: `docker-compose logs backend|database|frontend`
- Restart: `docker-compose restart`
- Rerun migrations inside backend container: `docker-compose exec backend sh` then `npm run migrate`
- Port conflicts? Adjust mappings in `docker-compose.yml`

## Environment you’ll touch most
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `PORT` (backend, default 5000)
- `FRONTEND_URL` (CORS, default http://localhost:3000)
- `VITE_API_BASE_URL` (frontend)

## If you’re demoing
- Show tenant isolation: create a second tenant and compare data visibility.
- Show roles: log in as super admin vs tenant admin vs user.
- Create a project and tasks; watch audit logs.

## Contributing / next steps
This repo is set up for evaluation. If you extend it, consider: tests (Jest/Supertest), rate limiting, input validation (Joi/Zod), refresh tokens, CI/CD, metrics/alerts, caching.

---

Made with ☕ and a focus on clear multi-tenant rails—enjoy!
