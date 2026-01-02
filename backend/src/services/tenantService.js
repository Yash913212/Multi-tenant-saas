import db from '../config/db.js';
import { PLAN_LIMITS, ROLES } from '../utils/constants.js';
import { logAction } from './auditService.js';

export async function listTenants({ page = 1, limit = 10, status, subscriptionPlan }) {
    const sanitizedLimit = Math.min(Number(limit) || 10, 100);
    const offset = (Number(page) - 1) * sanitizedLimit;
    const baseQuery = db('tenants').modify((qb) => {
        if (status) qb.where({ status });
        if (subscriptionPlan) qb.where({ subscription_plan: subscriptionPlan });
    });

    const totalResult = await baseQuery.clone().count().first();
    const tenants = await baseQuery
        .clone()
        .select('*')
        .limit(sanitizedLimit)
        .offset(offset)
        .orderBy('created_at', 'desc');

    // counts per tenant
    const ids = tenants.map((t) => t.id);
    const userCounts = await db('users').select('tenant_id').count().whereIn('tenant_id', ids).groupBy('tenant_id');
    const projectCounts = await db('projects').select('tenant_id').count().whereIn('tenant_id', ids).groupBy('tenant_id');
    const userMap = Object.fromEntries(userCounts.map((r) => [r.tenant_id, Number(r.count)]));
    const projectMap = Object.fromEntries(projectCounts.map((r) => [r.tenant_id, Number(r.count)]));

    return {
        tenants: tenants.map((t) => ({
            ...t,
            totalUsers: userMap[t.id] || 0,
            totalProjects: projectMap[t.id] || 0
        })),
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil((Number(totalResult ? .count) || 0) / sanitizedLimit) || 0,
            totalTenants: Number(totalResult ? .count) || 0,
            limit: sanitizedLimit
        }
    };
}

export async function getTenantByIdWithStats(id) {
    const tenant = await db('tenants').where({ id }).first();
    if (!tenant) return null;
    const [{ count: totalUsers }] = await db('users').where({ tenant_id: id }).count();
    const [{ count: totalProjects }] = await db('projects').where({ tenant_id: id }).count();
    const [{ count: totalTasks }] = await db('tasks').where({ tenant_id: id }).count();
    return {
        ...tenant,
        stats: {
            totalUsers: Number(totalUsers) || 0,
            totalProjects: Number(totalProjects) || 0,
            totalTasks: Number(totalTasks) || 0
        }
    };
}

export async function updateTenant(id, payload, actor) {
    const tenant = await db('tenants').where({ id }).first();
    if (!tenant) {
        const err = new Error('Tenant not found');
        err.status = 404;
        throw err;
    }

    const updates = {};
    if (payload.name) updates.name = payload.name;

    const isSuper = actor ? .role === ROLES.SUPER_ADMIN;
    if (!isSuper && (payload.status || payload.subscriptionPlan || payload.maxUsers || payload.maxProjects)) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    if (isSuper) {
        if (payload.status) updates.status = payload.status;
        if (payload.subscriptionPlan) {
            updates.subscription_plan = payload.subscriptionPlan;
            updates.max_users = PLAN_LIMITS[payload.subscriptionPlan] ? .max_users || tenant.max_users;
            updates.max_projects = PLAN_LIMITS[payload.subscriptionPlan] ? .max_projects || tenant.max_projects;
        }
        if (payload.maxUsers) updates.max_users = payload.maxUsers;
        if (payload.maxProjects) updates.max_projects = payload.maxProjects;
    }

    updates.updated_at = db.fn.now();

    const [updated] = await db('tenants').where({ id }).update(updates).returning('*');

    await logAction({ tenant_id: actor ? .tenant_id || null, user_id: actor ? .id || null, action: 'UPDATE_TENANT', entity_type: 'tenant', entity_id: id });

    return updated;
}