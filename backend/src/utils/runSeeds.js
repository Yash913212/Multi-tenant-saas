const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function runSeeds() {
  const alreadySeeded = await db.query(
    "SELECT 1 FROM users WHERE role = 'super_admin'"
  );

  if (alreadySeeded.rowCount > 0) {
    console.log('Seed data already exists');
    return;
  }

  console.log('Running seed data...');

  // Super Admin
  const superAdminPassword = await bcrypt.hash('Admin@123', 10);

  const superAdminResult = await db.query(
    `INSERT INTO users (email, password_hash, full_name, role)
     VALUES ($1, $2, $3, 'super_admin')
     RETURNING id`,
    ['superadmin@system.com', superAdminPassword, 'System Admin']
  );

  // Tenant
  const tenantResult = await db.query(
    `INSERT INTO tenants
     (name, subdomain, status, subscription_plan, max_users, max_projects)
     VALUES ($1, $2, 'active', 'pro', 25, 15)
     RETURNING id`,
    ['Demo Company', 'demo']
  );

  const tenantId = tenantResult.rows[0].id;

  // Tenant Admin
  const tenantAdminPassword = await bcrypt.hash('Demo@123', 10);

  const tenantAdminResult = await db.query(
    `INSERT INTO users
     (tenant_id, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, 'tenant_admin')
     RETURNING id`,
    [tenantId, 'admin@demo.com', tenantAdminPassword, 'Demo Admin']
  );

  // Users
  const userPassword = await bcrypt.hash('User@123', 10);

  const user1 = await db.query(
    `INSERT INTO users
     (tenant_id, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, 'user')
     RETURNING id`,
    [tenantId, 'user1@demo.com', userPassword, 'Demo User One']
  );

  const user2 = await db.query(
    `INSERT INTO users
     (tenant_id, email, password_hash, full_name, role)
     VALUES ($1, $2, $3, $4, 'user')
     RETURNING id`,
    [tenantId, 'user2@demo.com', userPassword, 'Demo User Two']
  );

  // Projects
  const project1 = await db.query(
    `INSERT INTO projects
     (tenant_id, name, description, status, created_by)
     VALUES ($1, $2, $3, 'active', $4)
     RETURNING id`,
    [tenantId, 'Project Alpha', 'First demo project', tenantAdminResult.rows[0].id]
  );

  const project2 = await db.query(
    `INSERT INTO projects
     (tenant_id, name, description, status, created_by)
     VALUES ($1, $2, $3, 'active', $4)
     RETURNING id`,
    [tenantId, 'Project Beta', 'Second demo project', tenantAdminResult.rows[0].id]
  );

  // Tasks
  await db.query(
    `INSERT INTO tasks
     (project_id, tenant_id, title, status, priority)
     VALUES
     ($1, $2, 'Task 1', 'todo', 'low'),
     ($1, $2, 'Task 2', 'in_progress', 'medium'),
     ($1, $2, 'Task 3', 'completed', 'high'),
     ($3, $2, 'Task 4', 'todo', 'medium'),
     ($3, $2, 'Task 5', 'todo', 'low')`,
    [project1.rows[0].id, tenantId, project2.rows[0].id]
  );

  console.log('Seed data inserted successfully');
}

module.exports = runSeeds;
