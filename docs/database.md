# Database Schema Documentation

## Overview

The database uses PostgreSQL 15 with UUID primary keys and comprehensive foreign key relationships to ensure data integrity and tenant isolation.

## Schema Design Principles

1. **Tenant Isolation**: All multi-tenant tables include `tenant_id` column
2. **UUID Primary Keys**: Use `gen_random_uuid()` for globally unique identifiers
3. **Soft Deletes**: Use `is_active` flags instead of hard deletes where appropriate
4. **Audit Trail**: Automatic `created_at` and `updated_at` timestamps
5. **Cascading Deletes**: Proper CASCADE rules to maintain referential integrity

## Tables

### tenants

Stores tenant organizations.

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  max_users INTEGER NOT NULL DEFAULT 5,
  max_projects INTEGER NOT NULL DEFAULT 3,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_is_active ON tenants(is_active);
```

**Columns:**
- `id`: Unique identifier
- `name`: Display name of the organization
- `subdomain`: Unique subdomain for tenant identification (e.g., "acme" → "acme.saas-platform.com")
- `plan`: Subscription plan (starter, professional, enterprise)
- `max_users`: User limit based on plan
- `max_projects`: Project limit based on plan
- `is_active`: Soft delete flag
- `created_at`: Tenant creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `subdomain` must be unique
- `plan` must be one of: starter, professional, enterprise

### users

Stores user accounts with role-based access.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

**Columns:**
- `id`: Unique identifier
- `tenant_id`: Foreign key to tenants (NULL for super admins)
- `email`: User email address (unique per tenant)
- `password_hash`: bcrypt hashed password
- `full_name`: User's display name
- `role`: Access level (super_admin, tenant_admin, user)
- `is_active`: Account status
- `created_at`: Account creation timestamp
- `updated_at`: Last profile update

**Constraints:**
- `(tenant_id, email)` must be unique
- `role` must be one of: super_admin, tenant_admin, user
- Super admins have `tenant_id = NULL`

### projects

Stores project information within tenants.

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_projects_tenant_id ON projects(tenant_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_by ON projects(created_by);
```

**Columns:**
- `id`: Unique identifier
- `tenant_id`: Foreign key to tenants
- `name`: Project name
- `description`: Optional project description
- `status`: Project status (active, archived, completed)
- `created_by`: User who created the project
- `created_at`: Project creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `status` must be one of: active, archived, completed
- Projects are deleted when tenant is deleted (CASCADE)

### tasks

Stores tasks within projects.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_tenant_id ON tasks(tenant_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
```

**Columns:**
- `id`: Unique identifier
- `project_id`: Foreign key to projects
- `tenant_id`: Foreign key to tenants (for query optimization)
- `title`: Task title
- `description`: Optional detailed description
- `status`: Task status (todo, in_progress, done, blocked)
- `priority`: Task priority (low, medium, high, urgent)
- `assigned_to`: User assigned to the task
- `due_date`: Optional due date
- `created_at`: Task creation timestamp
- `updated_at`: Last modification timestamp

**Constraints:**
- `status` must be one of: todo, in_progress, done, blocked
- `priority` must be one of: low, medium, high, urgent
- Tasks are deleted when project is deleted (CASCADE)

### audit_logs

Stores audit trail for compliance and debugging.

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Columns:**
- `id`: Unique identifier
- `tenant_id`: Foreign key to tenants
- `user_id`: User who performed the action
- `action`: Action type (CREATE_USER, UPDATE_PROJECT, DELETE_TASK, etc.)
- `entity_type`: Type of entity affected (user, project, task, tenant)
- `entity_id`: ID of the affected entity
- `old_values`: Previous state (JSONB)
- `new_values`: New state (JSONB)
- `ip_address`: Request IP address
- `user_agent`: User agent string
- `created_at`: Action timestamp

**Retention:**
- Logs are kept indefinitely by default
- Consider implementing 90-day rotation for GDPR compliance

## Relationships

### One-to-Many

- **tenants → users**: One tenant has many users
- **tenants → projects**: One tenant has many projects
- **projects → tasks**: One project has many tasks
- **users → created projects**: One user creates many projects
- **users → assigned tasks**: One user is assigned many tasks

### Cascade Rules

- **ON DELETE CASCADE**: 
  - Deleting a tenant deletes all its users, projects, tasks, and audit logs
  - Deleting a project deletes all its tasks
  
- **ON DELETE SET NULL**:
  - Deleting a user sets `created_by` in projects to NULL
  - Deleting a user sets `assigned_to` in tasks to NULL
  - Deleting a user sets `user_id` in audit_logs to NULL

## Indexes

### Performance Optimization

All foreign keys have indexes:
- `users(tenant_id)`
- `projects(tenant_id)`
- `tasks(project_id, tenant_id)`
- `audit_logs(tenant_id, user_id)`

### Query Optimization

Common query patterns indexed:
- `users(email)` - Login lookups
- `tenants(subdomain)` - Tenant resolution
- `tasks(status)` - Status filtering
- `tasks(assigned_to)` - Assignment queries
- `audit_logs(created_at)` - Time-based queries

## Enums

### Tenant Plans

```sql
CREATE TYPE plan_type AS ENUM ('starter', 'professional', 'enterprise');
```

**Limits:**
- `starter`: 5 users, 3 projects
- `professional`: 25 users, 25 projects
- `enterprise`: Unlimited

### User Roles

```sql
CREATE TYPE user_role AS ENUM ('super_admin', 'tenant_admin', 'user');
```

**Permissions:**
- `super_admin`: System-wide access
- `tenant_admin`: Full tenant access
- `user`: Limited to assigned resources

### Project Status

```sql
CREATE TYPE project_status AS ENUM ('active', 'archived', 'completed');
```

### Task Status

```sql
CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'done', 'blocked');
```

### Task Priority

```sql
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
```

## Migrations

### Migration Tool

Knex.js handles database migrations:

```bash
# Run migrations
npx knex migrate:latest

# Rollback last migration
npx knex migrate:rollback

# Create new migration
npx knex migrate:make migration_name
```

### Migration Files

Located in `backend/migrations/`:

1. `20240101000000_create_tenants.js`
2. `20240101000001_create_users.js`
3. `20240101000002_create_projects.js`
4. `20240101000003_create_tasks.js`
5. `20240101000004_create_audit_logs.js`

## Seeds

### Seed Data

Located in `backend/seeds/`:

1. `01_tenants.js` - Demo Company tenant
2. `02_users.js` - Super admin, tenant admin, users
3. `03_projects.js` - Sample projects (optional)
4. `04_tasks.js` - Sample tasks (optional)

### Running Seeds

```bash
# Run all seeds
npx knex seed:run

# Run specific seed
npx knex seed:run --specific=01_tenants.js
```

## Query Patterns

### Tenant-Scoped Queries

Always filter by `tenant_id`:

```javascript
// Get user's projects
const projects = await db('projects')
  .where({ tenant_id: req.user.tenantId })
  .select('*');

// Get project tasks
const tasks = await db('tasks')
  .where({ 
    project_id: projectId,
    tenant_id: req.user.tenantId 
  })
  .select('*');
```

### Joins with Tenant Isolation

```javascript
// Get tasks with assigned user info
const tasks = await db('tasks')
  .leftJoin('users', 'tasks.assigned_to', 'users.id')
  .where({ 'tasks.tenant_id': tenantId })
  .select(
    'tasks.*',
    'users.full_name as assigned_name',
    'users.email as assigned_email'
  );
```

### Aggregations

```javascript
// Count tasks by status
const statusCounts = await db('tasks')
  .where({ tenant_id: tenantId, project_id: projectId })
  .groupBy('status')
  .select('status')
  .count('* as count');
```

## Backup & Recovery

### Backup Command

```bash
# Full backup
docker exec database pg_dump -U postgres saas_db > backup.sql

# Schema only
docker exec database pg_dump -U postgres -s saas_db > schema.sql

# Data only
docker exec database pg_dump -U postgres -a saas_db > data.sql
```

### Restore Command

```bash
# Restore from backup
docker exec -i database psql -U postgres saas_db < backup.sql
```

### Automated Backups

Production should implement:
- Daily full backups
- Hourly incremental backups (WAL archiving)
- Off-site backup storage (S3)
- 30-day retention policy
- Backup restoration testing

## Performance Tuning

### Connection Pooling

```javascript
const db = knex({
  client: 'postgresql',
  connection: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  },
  pool: {
    min: 2,
    max: 10
  }
});
```

### Query Analysis

```sql
-- Explain query plan
EXPLAIN ANALYZE 
SELECT * FROM tasks 
WHERE tenant_id = 'uuid' AND status = 'todo';

-- Find slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;
```

### Optimization Recommendations

1. Keep indexes on all foreign keys
2. Use `LIMIT` for pagination
3. Avoid `SELECT *`, specify columns
4. Use `COUNT(*)` sparingly on large tables
5. Consider materialized views for dashboards
6. Implement read replicas for reporting

## Future Enhancements

1. **Partitioning**: Partition `audit_logs` by date
2. **Read Replicas**: Separate read/write databases
3. **Caching**: Redis cache for frequent queries
4. **Full-Text Search**: PostgreSQL full-text search or Elasticsearch
5. **Time-Series Data**: TimescaleDB for metrics
6. **JSONB Indexes**: GIN indexes on JSONB columns
