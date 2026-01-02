# Architecture Document

## System Architecture Diagram
See `docs/images/system-architecture.png` (placeholder path). Components: Browser → Frontend (React/Vite) → Backend API (Express) → PostgreSQL. JWT auth flow from backend issues tokens stored client-side; requests carry Bearer token; RBAC middleware gates routes.

## Database ERD
See `docs/images/database-erd.png` (placeholder path). Entities: tenants (1)→(n) users; tenants (1)→(n) projects; projects (1)→(n) tasks; tenants (1)→(n) audit_logs; users (0..1)→(n) audit_logs. Foreign keys cascade on delete; indexes on tenant_id columns.

## API Endpoints (19+)
Auth
- POST /api/auth/register-tenant — public
- POST /api/auth/login — public
- GET /api/health — public health

Tenants (super_admin)
- GET /api/tenants — list tenants
- GET /api/tenants/:id — tenant detail
- PATCH /api/tenants/:id — update status/plan

Users (auth; create/update/delete require tenant_admin or super_admin)
- POST /api/users — create user
- GET /api/users — list users (tenant-scoped)
- GET /api/users/:id — get user
- PATCH /api/users/:id — update user
- DELETE /api/users/:id — delete user

Projects (auth; create/update/delete require tenant_admin or super_admin)
- POST /api/projects — create project
- GET /api/projects — list tenant projects
- GET /api/projects/:id — project detail
- PATCH /api/projects/:id — update project
- DELETE /api/projects/:id — delete project

Tasks (auth)
- POST /api/projects/:projectId/tasks — create task
- GET /api/projects/:projectId/tasks — list tasks for project
- PATCH /api/projects/:projectId/tasks/:id — update task
- DELETE /api/projects/:projectId/tasks/:id — delete task (admin only)

## Component Responsibilities
- Frontend: React routes, protected views, role-based UI, Axios client with JWT header.
- Backend: Express controllers + services; middleware for auth and RBAC; Knex migrations/seeds; audit logging.
- Database: Postgres with enums, FK constraints, indexes.

## Deployment & Networking
- docker-compose with fixed service names: database, backend, frontend.
- Ports: 5432, 5000, 3000 respectively.
- Services communicate via DNS names (backend → database, frontend → backend).

## Tenant Isolation Strategy
- Every table (except super_admin rows) includes tenant_id.
- Middleware enforces tenant context; service queries include tenant filters.
- FK cascade ensures cleanup on tenant delete; indexes accelerate scoped queries.
