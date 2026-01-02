# API Documentation

Complete API documentation for the Multi-Tenant SaaS Platform.

**Base URL**: `http://localhost:5000/api`  
**Authentication**: Most endpoints require JWT token in `Authorization: Bearer <token>` header.

All responses follow format: `{ success: boolean, message: string, data: object }`

---

## Authentication Endpoints

### 1. Register Tenant
Create a new tenant and initial admin user.

**Endpoint**: `POST /auth/register-tenant`  
**Authentication**: None (Public)  
**Request Body**:
```json
{
  "tenantName": "Acme Corp",
  "subdomain": "acme",
  "adminEmail": "admin@acme.com",
  "adminPassword": "SecurePass@123",
  "adminFullName": "John Admin"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "Tenant and admin user created successfully",
  "data": {
    "tenant": { "id": "uuid", "name": "Acme Corp", "subdomain": "acme" },
    "user": { "id": "uuid", "email": "admin@acme.com", "role": "tenant_admin" },
    "token": "jwt.token.here"
  }
}
```

**Errors**: 400 (subdomain exists), 403 (plan limit), 500

---

### 2. Login
Authenticate user and receive JWT token.

**Endpoint**: `POST /auth/login`  
**Authentication**: None (Public)  
**Request Body**:
```json
{
  "email": "admin@demo.com",
  "password": "Demo@123",
  "subdomain": "demo"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "jwt.token.here",
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "full_name": "Demo Admin",
      "role": "tenant_admin",
      "tenant": { "id": "uuid", "name": "Demo Company", "subdomain": "demo" }
    }
  }
}
```

**Errors**: 400 (missing fields), 401 (invalid credentials), 403 (suspended tenant)

---

## Health Check

### 3. Health Check
Verify API and database connectivity.

**Endpoint**: `GET /health`  
**Authentication**: None (Public)  

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "api": "healthy",
    "database": "healthy",
    "timestamp": "2026-01-02T10:30:00.000Z"
  }
}
```

---

## Tenant Endpoints (Super Admin)

### 4. List Tenants
**Endpoint**: `GET /tenants`  
**Authentication**: Required (super_admin)  
**Query Params**: `page`, `limit`, `status`, `subscriptionPlan`  
**Response**: Array of tenants with pagination

### 5. Get Tenant Details
**Endpoint**: `GET /tenants/:id`  
**Authentication**: Required (super_admin or own tenant_admin)  
**Response**: Tenant object with stats (totalUsers, totalProjects, totalTasks)

### 6. Update Tenant
**Endpoint**: `PATCH /tenants/:id`  
**Authentication**: Required (super_admin)  
**Body**: `{ status?, subscriptionPlan?, maxUsers?, maxProjects? }`

---

## User Endpoints

### 7. Create User
**Endpoint**: `POST /users` or `POST /tenants/:tenantId/users`  
**Authentication**: Required (tenant_admin or super_admin)  
**Body**:
```json
{
  "email": "newuser@demo.com",
  "password": "User@123",
  "fullName": "New User",
  "role": "user"
}
```
**Errors**: 400 (email exists), 403 (plan limit reached)

### 8. List Users
**Endpoint**: `GET /users` or `GET /tenants/:tenantId/users`  
**Authentication**: Required  
**Query Params**: `page`, `limit`, `search`, `role`, `isActive`  
**Response**: Array of users with pagination

### 9. Get User Details
**Endpoint**: `GET /users/:id`  
**Authentication**: Required  

### 10. Update User
**Endpoint**: `PATCH /users/:id`  
**Authentication**: Required (tenant_admin or super_admin)  
**Body**: `{ fullName?, role?, isActive?, password? }`

### 11. Delete User
**Endpoint**: `DELETE /users/:id`  
**Authentication**: Required (tenant_admin or super_admin)

---

## Project Endpoints

### 12. Create Project
**Endpoint**: `POST /projects`  
**Authentication**: Required (tenant_admin)  
**Body**:
```json
{
  "name": "Website Redesign",
  "description": "Redesign company website",
  "status": "active"
}
```
**Errors**: 403 (project limit reached)

### 13. List Projects
**Endpoint**: `GET /projects`  
**Authentication**: Required  
**Query Params**: `page`, `limit`, `search`, `status`  
**Response**: Array of projects with task counts

### 14. Get Project Details
**Endpoint**: `GET /projects/:id`  
**Authentication**: Required  
**Response**: Project with taskCount and completedTaskCount

### 15. Update Project
**Endpoint**: `PATCH /projects/:id`  
**Authentication**: Required (tenant_admin)  
**Body**: `{ name?, description?, status? }`

### 16. Delete Project
**Endpoint**: `DELETE /projects/:id`  
**Authentication**: Required (tenant_admin)  
**Note**: Cascades to all tasks

---

## Task Endpoints

### 17. Create Task
**Endpoint**: `POST /projects/:projectId/tasks`  
**Authentication**: Required  
**Body**:
```json
{
  "title": "Design homepage mockup",
  "description": "Create mobile and desktop mockups",
  "priority": "high",
  "status": "todo",
  "assignedTo": "user-uuid",
  "dueDate": "2026-01-15"
}
```

### 18. List Tasks
**Endpoint**: `GET /projects/:projectId/tasks`  
**Authentication**: Required  
**Query Params**: `page`, `limit`, `search`, `status`, `priority`, `assignedTo`  
**Response**: Array of tasks with assignee details

### 19. Update Task
**Endpoint**: `PATCH /projects/:projectId/tasks/:id`  
**Authentication**: Required  
**Body**: `{ title?, description?, status?, priority?, assignedTo?, dueDate? }`

### 20. Delete Task
**Endpoint**: `DELETE /projects/:projectId/tasks/:id`  
**Authentication**: Required (tenant_admin)

---

## Authorization Rules

- **Bearer JWT** required for all endpoints except `/auth/*` and `/health`
- **Roles**: `super_admin` (global access), `tenant_admin` (tenant scope), `user` (read + assigned tasks)
- **Tenant Isolation**: Non-super-admin tokens include `tenant_id`; cross-tenant access returns 403
- **Plan Limits**: Enforced on user/project creation based on subscription_plan

---

## Error Response Format

```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Specific validation error"]
}
```

**Status Codes**: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 403 (Forbidden), 404 (Not Found), 500 (Server Error)

---

## Testing Examples

### cURL

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@demo.com","password":"Demo@123","subdomain":"demo"}'

# List projects (with token)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Frontend
Access React app at `http://localhost:3000` after running `docker-compose up -d`.

---

## Summary

**Total Endpoints**: 19+  
**Coverage**: Auth (2), Health (1), Tenants (3), Users (5), Projects (5), Tasks (4)  
**Security**: JWT authentication, RBAC, tenant isolation, audit logging  
**Pagination**: All list endpoints support `page` and `limit` query parameters
- 400 validation/limit errors
- 401 unauthorized
- 403 forbidden/tenant mismatch
- 404 not found
- 409 conflict (e.g., duplicate email/subdomain)
