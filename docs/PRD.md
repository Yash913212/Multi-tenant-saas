# Product Requirements Document (PRD)

## User Personas
- **Super Admin**: System-level operator who onboards tenants, monitors health, and intervenes when needed. Goals: approve/suspend tenants, observe audit logs, ensure uptime. Pain points: visibility across tenants, fast remediation.
- **Tenant Admin**: Organization owner/manager. Goals: manage users, create projects, enforce plan limits, oversee tasks. Pain points: keeping team organized, preventing overages, quick onboarding.
- **End User**: Regular team member. Goals: view and update assigned projects/tasks, collaborate within tenant boundaries. Pain points: simple UI, clear permissions, responsive app.

## Functional Requirements (FR)
Auth & Access
- FR-001: The system shall allow tenant registration with unique subdomain.
- FR-002: The system shall issue JWTs with 24h expiry on successful login.
- FR-003: The system shall require authentication for all non-auth endpoints.
- FR-004: The system shall enforce role-based access control for protected routes.

Tenants
- FR-005: The system shall create tenants with default `free` plan limits.
- FR-006: The system shall let super admins list and view all tenants.
- FR-007: The system shall let super admins update tenant status and plan.

Users
- FR-008: The system shall allow tenant admins to create users within plan limits.
- FR-009: The system shall enforce email uniqueness per tenant.
- FR-010: The system shall allow tenant admins to list, update, and delete users in their tenant.

Projects
- FR-011: The system shall allow tenant admins to create projects within plan limits.
- FR-012: The system shall allow authenticated tenant members to list and view projects.
- FR-013: The system shall allow tenant admins to update or delete projects.

Tasks
- FR-014: The system shall allow authenticated tenant members to create tasks inside a project.
- FR-015: The system shall allow authenticated tenant members to update task status and details; tenant admins may delete tasks.

Audit & Health
- FR-016: The system shall log significant actions into audit_logs.
- FR-017: The system shall expose `/api/health` reporting API and DB status.

## Non-Functional Requirements (NFR)
- NFR-001 (Performance): 90% of API requests should respond < 300ms under typical load.
- NFR-002 (Security): All passwords must be hashed; JWT expiry is 24h; CORS restricted to frontend host.
- NFR-003 (Scalability): The system shall support at least 100 concurrent tenant users without functional degradation on the given stack.
- NFR-004 (Availability): Target 99% uptime for API during business hours (development goal).
- NFR-005 (Usability): Frontend shall be responsive for mobile and desktop; protected routes redirect unauthenticated users to login.
