# Testing Guide

## Overview

This document provides comprehensive testing instructions for the Multi-Tenant SaaS Platform.

## Test Environment

The application includes seeded test data accessible via Docker deployment:

```bash
docker-compose up -d
```

## Test Credentials

### Super Admin (System-Wide Access)
- **Email**: superadmin@system.com
- **Password**: Admin@123
- **Access**: All tenants, can create new tenants
- **Login**: Does not require tenant subdomain

### Tenant Admin (Demo Company)
- **Email**: admin@demo.com
- **Password**: Demo@123
- **Tenant**: demo
- **Access**: Full access to Demo Company tenant
- **Login**: Requires tenant subdomain "demo"

### Regular Users (Demo Company)
- **User 1**:
  - Email: user1@demo.com
  - Password: User@123
  - Tenant: demo
- **User 2**:
  - Email: user2@demo.com
  - Password: User@123
  - Tenant: demo
- **Access**: Limited to assigned projects and tasks

## API Testing

### Authentication

**Login as Tenant Admin:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@demo.com",
    "password": "Demo@123",
    "tenantSubdomain": "demo"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "admin@demo.com",
      "fullName": "Demo Admin",
      "role": "tenant_admin",
      "tenantId": "uuid"
    },
    "token": "jwt_token_here",
    "expiresIn": "24h"
  }
}
```

### Projects

**List Projects (authenticated):**
```bash
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Project:**
```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Testing project creation"
  }'
```

### Tasks

**List Tasks for Project:**
```bash
curl -X GET http://localhost:5000/api/projects/{projectId}/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create Task:**
```bash
curl -X POST http://localhost:5000/api/projects/{projectId}/tasks \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing task creation",
    "priority": "high",
    "status": "todo"
  }'
```

### Users (Admin Only)

**List Users:**
```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

**Create User:**
```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@demo.com",
    "password": "NewUser@123",
    "fullName": "New User",
    "role": "user"
  }'
```

## Frontend Testing

### Manual Testing Flow

1. **Access Application**
   - Open http://localhost:3000

2. **Registration (Optional)**
   - Click "Create New Account"
   - Fill tenant and admin details
   - Verify account creation

3. **Login**
   - Use tenant admin credentials
   - Enter tenant subdomain: "demo"
   - Verify successful login and dashboard access

4. **Dashboard**
   - Verify statistics display
   - Check project and task counts
   - Verify recent activity log

5. **Projects**
   - Navigate to Projects page
   - Create new project
   - Edit existing project
   - Verify tenant isolation

6. **Tasks**
   - Open project details
   - Create new task
   - Update task status (drag-and-drop or dropdown)
   - Assign task to user
   - Verify task filtering

7. **Users (Admin Only)**
   - Navigate to Users page
   - Create new user
   - Edit user role
   - Deactivate user
   - Verify role-based access

8. **Logout**
   - Click logout
   - Verify redirect to login page
   - Verify token cleared

## Role-Based Access Testing

### Super Admin
- ✅ Can access all tenants
- ✅ Can create new tenants
- ✅ Can view system-wide audit logs
- ✅ Can manage users across tenants

### Tenant Admin
- ✅ Can access own tenant only
- ✅ Can create/edit/delete projects
- ✅ Can create/edit/delete users within tenant
- ✅ Can assign tasks
- ✅ Can view tenant audit logs
- ❌ Cannot access other tenants
- ❌ Cannot create tenants

### Regular User
- ✅ Can view assigned projects
- ✅ Can create/edit tasks in assigned projects
- ✅ Can update own task status
- ✅ Can edit own profile
- ❌ Cannot create projects
- ❌ Cannot manage users
- ❌ Cannot delete projects/tasks
- ❌ Cannot access admin pages

## Security Testing

### Tenant Isolation
1. Login as user from Demo Company (demo subdomain)
2. Attempt to access projects with different tenant_id in URL
3. **Expected**: 403 Forbidden or 404 Not Found

### JWT Expiration
1. Login and save JWT token
2. Wait 24+ hours
3. Attempt API call with expired token
4. **Expected**: 401 Unauthorized

### SQL Injection Prevention
1. Attempt login with email: `admin@demo.com' OR '1'='1`
2. **Expected**: Login fails, no SQL error

### XSS Prevention
1. Create project with name: `<script>alert('XSS')</script>`
2. View project in frontend
3. **Expected**: Name displayed as text, script not executed

## Database Testing

### Verify Migrations
```bash
docker exec database psql -U postgres -d saas_db -c "\dt"
```

**Expected Tables:**
- audit_logs
- knex_migrations
- knex_migrations_lock
- projects
- tasks
- tenants
- users

### Verify Seeds
```bash
docker exec database psql -U postgres -d saas_db -c "SELECT email, role FROM users"
```

**Expected Users:**
- superadmin@system.com (super_admin)
- admin@demo.com (tenant_admin)
- user1@demo.com (user)
- user2@demo.com (user)

### Check Constraints
```bash
docker exec database psql -U postgres -d saas_db -c "
  SELECT conname, contype 
  FROM pg_constraint 
  WHERE conrelid = 'tasks'::regclass"
```

**Expected**: Foreign key constraints on project_id, tenant_id, assigned_to

## Performance Testing

### Load Testing with Apache Bench
```bash
# Test health endpoint
ab -n 1000 -c 10 http://localhost:5000/api/health

# Test authenticated endpoint (replace TOKEN)
ab -n 100 -c 5 -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/projects
```

### Expected Performance
- Health check: <10ms p50, <50ms p99
- List projects: <100ms p50, <500ms p99
- Create task: <200ms p50, <1000ms p99

## Automated Testing

### Backend Unit Tests (if implemented)
```bash
cd backend
npm test
```

### Frontend Unit Tests (if implemented)
```bash
cd frontend
npm test
```

### Integration Tests (if implemented)
```bash
npm run test:integration
```

## Bug Reporting

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Docker logs: `docker-compose logs backend frontend`
5. Browser console errors (for frontend issues)
6. API response (for backend issues)

## Test Checklist

- [ ] Docker deployment successful (all 3 services running)
- [ ] Health endpoint returns 200 OK
- [ ] Login with all test credentials works
- [ ] Dashboard loads and displays data
- [ ] Projects CRUD operations work
- [ ] Tasks CRUD operations work
- [ ] User management works (admin only)
- [ ] Tenant isolation enforced
- [ ] Role-based access control enforced
- [ ] JWT authentication working
- [ ] Logout clears session
- [ ] Database migrations applied
- [ ] Seed data loaded
- [ ] Frontend-backend communication working
- [ ] No console errors in browser
- [ ] No errors in Docker logs
