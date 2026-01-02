# Research Document

## Multi-Tenancy Analysis (shared vs. isolated)

Three classic approaches dominate multi-tenancy designs:

1) **Shared Database, Shared Schema (tenant_id column)** — A single database hosts all tenants in common tables, with every row tagged by `tenant_id`. **Pros:** lowest infrastructure cost; simplest provisioning; easy to scale horizontally with connection pooling; straightforward cross-tenant analytics for super-admins. **Cons:** the greatest blast radius for coding mistakes—any missing `tenant_id` filter becomes a data-leak risk; noisy-neighbor performance contention; complex per-tenant migrations are impossible because schema is uniform.

2) **Shared Database, Separate Schemas (per-tenant schema)** — One database per environment, multiple schemas, one per tenant. **Pros:** stronger logical isolation than a shared schema; tenant-specific migrations are possible; operational cost lower than separate DBs. **Cons:** migration orchestration is harder (must loop schemas); object counts (tables × tenants) grow quickly; connection pool size and search_path management add complexity; some PaaS offerings limit schema counts.

3) **Separate Database per Tenant** — Each tenant gets its own database instance. **Pros:** strongest isolation (credentials, backups, encryption domains); performance noisy-neighbor risk minimized; easiest legal/takedown isolation. **Cons:** highest cost; operational overhead for migrations, monitoring, and pooling; analytical queries across tenants become ETL-heavy.

### Chosen approach: Shared DB + Shared Schema with strict tenant_id and row-level access controls

For this project’s footprint and the requirement to run from a single docker-compose, the shared schema model is the most pragmatic. It keeps infra minimal (one Postgres) and lets us deliver all required features (RBAC, plan limits, audit logs) quickly. To mitigate its classic risks, we implement:
- **Mandatory tenant_id on every table (except super_admin users)**.
- **Authorization middleware** that injects tenant context and forbids cross-tenant IDs.
- **Row-scoped queries only** (all services include tenant predicates).
- **Audit logging** on every critical mutation to trace access.

This balances speed, cost, and clarity for a teaching-friendly, production-style starter.

### Operational considerations
- **Performance isolation:** Use indexes on `tenant_id` and (`tenant_id`, `project_id`) to reduce contention. Future: PostgreSQL RLS could add a second safety net.
- **Migrations:** One ordered migration set; transactional by default. Because there is a single schema, rollbacks are simple.
- **Backup/restore:** Single DB snapshot suffices; point-in-time recovery feasible via WAL archiving in production.
- **Scaling path:** If growth demands stricter isolation, promotion paths exist: (a) migrate heavy tenants to per-schema; (b) federate into multiple databases and shard by tenant_id.

### Data lifecycle & deletion
- **CASCADE deletes** on foreign keys ensure tenant or project removal cleans dependent rows, preventing orphan data and accidental cross-tenant visibility.
- **Timestamps** support audit trails and retention policies.

### Tenant identification
- **Subdomains** captured on tenant registration; login optionally requires subdomain for tenant-scoped users. Super admin bypasses subdomain matching.

## Technology Stack Justification (why this stack) ~500+ words

- **Backend: Node.js + Express + Knex + PostgreSQL**
  - Express is lightweight, unopinionated, and pairs well with REST requirements and custom RBAC middleware. Knex provides safe migrations/seeds and query composition; we need explicit SQL control for tenant filters and plan-limit checks. PostgreSQL offers strong relational integrity, enums, indexes, and UUID generation—ideal for multi-tenant tagging.
  - Alternatives considered: NestJS (more structure but heavier), TypeORM/Prisma (faster modeling but extra abstraction), MongoDB (document flexibility but weaker relational guarantees for this use-case).

- **Authentication: JWT (stateless)**
  - JWT with 24h expiry meets requirement for stateless auth and simplifies horizontal scaling. Super admin tokens omit tenant_id, tenant users include it. Alternatives: opaque session store (Redis) adds infra not required by spec.

- **Frontend: React + Vite + React Router + Axios**
  - Vite offers fast dev/build, React Router handles protected routes, Axios simplifies token injection and error handling. Alternatives: Next.js (SSR not required), Vue/Svelte (viable but React is common for teams and hiring).

- **Containerization: Docker & docker-compose**
  - Mandated by requirements; provides reproducible one-command startup with fixed ports and service names.

- **Tooling & DX:**
  - Nodemon for local backend dev reloads.
  - Helmet + CORS for baseline API hardening.
  - Joi could be added for richer validation; for brevity we use simple checks plus service-level guards.

### Why not multi-service microservices?
The footprint is small; monorepo with three services (db/backend/frontend) is sufficient. Microservices would add network hops, deployment overhead, and transactional consistency challenges without benefits here.

## Security Considerations (~400+ words)

1) **Data isolation by tenant_id** — Every query filters by tenant_id for non-super-admin users; middleware enforces tenant context and rejects cross-tenant IDs. Foreign keys reference tenant-scoped parents with CASCADE deletes to avoid orphaned cross-tenant rows.

2) **Authentication & authorization** — JWT tokens signed with `JWT_SECRET`, 24h expiry. RBAC middleware checks roles per route (super_admin, tenant_admin, user). Login validates subdomain for tenant users and blocks suspended tenants.

3) **Password handling** — Bcrypt with salt rounds; only password_hash stored. Super admin and seed users are hashed. No plaintext logging.

4) **API hardening** — Helmet for secure headers; CORS restricted to frontend service; consistent error structure reduces info leakage. Rate limiting can be added at reverse-proxy layer.

5) **Audit logging** — All critical mutations (tenant, user, project, task) record action, actor, tenant, and entity for traceability.

6) **Transport & secrets** — In production use HTTPS termination in front of containers. All secrets provided via environment variables; repo uses development placeholders only.

7) **Plan-limit enforcement** — Guards before user/project creation to prevent resource exhaustion attacks within a tenant.

8) **Future RLS** — PostgreSQL Row-Level Security could be enabled to add another enforcement layer; schema already tenant-tagged, so RLS policies would be straightforward.

## Summary
This research phase concludes with a pragmatic shared-schema multi-tenant design on Postgres, Express/React stack, JWT auth, RBAC middleware, and Dockerized services for reproducible startup. Security is layered via tenant filters, RBAC, hashing, audit logs, and sensible defaults.
