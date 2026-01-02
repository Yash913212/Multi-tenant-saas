import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export async function seed(knex) {
    await knex('audit_logs').del();
    await knex('tasks').del();
    await knex('projects').del();
    await knex('users').del();
    await knex('tenants').del();

    const demoTenantId = uuidv4();
    const superAdminId = uuidv4();
    const tenantAdminId = uuidv4();
    const user1Id = uuidv4();
    const user2Id = uuidv4();
    const project1Id = uuidv4();
    const project2Id = uuidv4();

    const password = (plain) => bcrypt.hashSync(plain, 10);

    await knex('tenants').insert([{
        id: demoTenantId,
        name: 'Demo Company',
        subdomain: 'demo',
        status: 'active',
        subscription_plan: 'pro',
        max_users: 25,
        max_projects: 15
    }]);

    await knex('users').insert([{
            id: superAdminId,
            tenant_id: null,
            email: process.env.DEFAULT_SUPERADMIN_EMAIL || 'superadmin@system.com',
            password_hash: password(process.env.DEFAULT_SUPERADMIN_PASSWORD || 'Admin@123'),
            full_name: 'Super Admin',
            role: 'super_admin',
            is_active: true
        },
        {
            id: tenantAdminId,
            tenant_id: demoTenantId,
            email: 'admin@demo.com',
            password_hash: password('Demo@123'),
            full_name: 'Demo Admin',
            role: 'tenant_admin',
            is_active: true
        },
        {
            id: user1Id,
            tenant_id: demoTenantId,
            email: 'user1@demo.com',
            password_hash: password('User@123'),
            full_name: 'Demo User One',
            role: 'user',
            is_active: true
        },
        {
            id: user2Id,
            tenant_id: demoTenantId,
            email: 'user2@demo.com',
            password_hash: password('User@123'),
            full_name: 'Demo User Two',
            role: 'user',
            is_active: true
        }
    ]);

    await knex('projects').insert([{
            id: project1Id,
            tenant_id: demoTenantId,
            name: 'Onboarding Portal',
            description: 'Build onboarding experience for new customers.',
            status: 'active',
            created_by: tenantAdminId
        },
        {
            id: project2Id,
            tenant_id: demoTenantId,
            name: 'Mobile App',
            description: 'Create cross-platform mobile app.',
            status: 'active',
            created_by: tenantAdminId
        }
    ]);

    const tasks = [{
            title: 'Design landing page',
            description: 'Create responsive landing page for onboarding.',
            status: 'todo',
            priority: 'high',
            assigned_to: user1Id,
            project_id: project1Id
        },
        {
            title: 'Set up CI/CD',
            description: 'Add pipelines for backend and frontend.',
            status: 'in_progress',
            priority: 'medium',
            assigned_to: tenantAdminId,
            project_id: project1Id
        },
        {
            title: 'Implement auth screens',
            description: 'Login, registration, forgot password flows.',
            status: 'todo',
            priority: 'high',
            assigned_to: user2Id,
            project_id: project1Id
        },
        {
            title: 'Build API client',
            description: 'Create shared API client for mobile app.',
            status: 'todo',
            priority: 'medium',
            assigned_to: user1Id,
            project_id: project2Id
        },
        {
            title: 'Task sync',
            description: 'Sync tasks between mobile and web.',
            status: 'todo',
            priority: 'high',
            assigned_to: user2Id,
            project_id: project2Id
        }
    ];

    await knex('tasks').insert(tasks.map((task) => ({
        id: uuidv4(),
        tenant_id: demoTenantId,
        ...task
    })));
}