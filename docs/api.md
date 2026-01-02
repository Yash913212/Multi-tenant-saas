# API Documentation

All responses use `{ success, message, data }`.
Base URL in Docker: `http://backend:5000/api`

## Auth
- POST `/auth/register-tenant`
  - body: { name, subdomain, adminName, adminEmail, adminPassword }
  - 201 → { tenantId, adminId, token }
- POST `/auth/login`
  - body: { email, password, subdomain }
  - 200 → { token, user }
- GET `/health`
  - 200 → { api, database }

## Tenants (super_admin)
- GET `/tenants`
- GET `/tenants/:id`
- PATCH `/tenants/:id` { status?, subscription_plan? }

## Users
- POST `/users` (super_admin or tenant_admin)
  - body: { email, password, full_name, role, tenant_id? }
- GET `/users`
- GET `/users/:id`
- PATCH `/users/:id` (super_admin or tenant_admin)
- DELETE `/users/:id` (super_admin or tenant_admin)

## Projects
- POST `/projects` (super_admin or tenant_admin)
  - body: { name, description }
- GET `/projects`
- GET `/projects/:id`
- PATCH `/projects/:id` (super_admin or tenant_admin)
- DELETE `/projects/:id` (super_admin or tenant_admin)

## Tasks
- POST `/projects/:projectId/tasks` (auth)
  - body: { title, description, priority, assigned_to?, status? }
- GET `/projects/:projectId/tasks`
- PATCH `/projects/:projectId/tasks/:id` (auth)
- DELETE `/projects/:projectId/tasks/:id` (tenant_admin or super_admin)

## Authorization
- Bearer JWT required for all except `/auth/*` and `/health`.
- Roles: super_admin (global), tenant_admin, user.
- Tenancy enforcement: non-super-admin tokens carry tenant_id; cross-tenant IDs rejected.

## Error Codes
- 200/201 success
- 400 validation/limit errors
- 401 unauthorized
- 403 forbidden/tenant mismatch
- 404 not found
- 409 conflict (e.g., duplicate email/subdomain)
