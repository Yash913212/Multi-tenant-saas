import db from '../config/db.js';
import { ROLES } from '../utils/constants.js';
import { logAction } from './auditService.js';

async function ensureProjectLimit(tenantId) {
    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant) {
        const err = new Error('Tenant not found');
        err.status = 404;
        throw err;
    }
    const [{ count }] = await db('projects').where({ tenant_id: tenantId }).count();
    if (Number(count) >= tenant.max_projects) {
        const err = new Error('Project limit reached for current plan');
        err.status = 403;
        throw err;
    }
}

export async function createProject(tenantId, payload, actor) {
    await ensureProjectLimit(tenantId);
    const [project] = await db('projects')
        .insert({...payload, tenant_id: tenantId })
        .returning('*');
    await logAction({ tenant_id: tenantId, user_id: actor ?.id || null, action: 'CREATE_PROJECT', entity_type: 'project', entity_id: project.id });
    return project;
}

export async function listProjects(tenantId, { status, search, page = 1, limit = 20 } = {}) {
    const sanitizedLimit = Math.min(Number(limit) || 20, 100);
    const offset = (Number(page) - 1) * sanitizedLimit;
    const base = db('projects').where({ tenant_id: tenantId });
    if (status) base.andWhere({ status });
    if (search) base.andWhereILike('name', `%${search}%`);

    const [{ count }] = await base.clone().count();
    const projects = await base
        .clone()
        .select('projects.*', 'u.full_name as created_by_name')
        .leftJoin('users as u', 'u.id', 'projects.created_by')
        .orderBy('projects.created_at', 'desc')
        .limit(sanitizedLimit)
        .offset(offset);

    const ids = projects.map((p) => p.id);
    const tasksCounts = await db('tasks').select('project_id').count().whereIn('project_id', ids).groupBy('project_id');
    const completedCounts = await db('tasks').select('project_id').count().whereIn('project_id', ids).andWhere({ status: 'completed' }).groupBy('project_id');
    const taskMap = Object.fromEntries(tasksCounts.map((r) => [r.project_id, Number(r.count)]));
    const completedMap = Object.fromEntries(completedCounts.map((r) => [r.project_id, Number(r.count)]));

    return {
        projects: projects.map((p) => ({
            ...p,
            taskCount: taskMap[p.id] || 0,
            completedTaskCount: completedMap[p.id] || 0,
            createdBy: p.created_by ? { id: p.created_by, fullName: p.created_by_name } : null
        })),
        total: Number(count) || 0,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil((Number(count) || 0) / sanitizedLimit) || 0,
            limit: sanitizedLimit
        }
    };
}

export async function getProjectById(id, tenantId) {
    return db('projects').where({ id, tenant_id: tenantId }).first();
}

export async function updateProject(id, tenantId, updates, actor) {
    const project = await db('projects').where({ id, tenant_id: tenantId }).first();
    if (!project) {
        const err = new Error('Project not found');
        err.status = 404;
        throw err;
    }
    const actorId = actor ?.id;
    const actorRole = actor ?.role;
    const isOwner = project.created_by && actorId ? project.created_by === actorId : false;
    const isAdmin = [ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN].includes(actorRole);
    if (!isOwner && !isAdmin) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    const [updated] = await db('projects')
        .where({ id, tenant_id: tenantId })
        .update({...updates, updated_at: db.fn.now() })
        .returning('*');
    await logAction({
        tenant_id: tenantId,
        user_id: actorId || null,
        action: 'UPDATE_PROJECT',
        entity_type: 'project',
        entity_id: id
    });
    return updated;
}

export async function deleteProject(id, tenantId, actor) {
    const project = await db('projects').where({ id, tenant_id: tenantId }).first();
    if (!project) {
        const err = new Error('Project not found');
        err.status = 404;
        throw err;
    }
    const actorId = actor ?.id;
    const actorRole = actor ?.role;
    const isOwner = project.created_by && actorId ? project.created_by === actorId : false;
    const isAdmin = [ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN].includes(actorRole);
    if (!isOwner && !isAdmin) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    await db('projects').where({ id, tenant_id: tenantId }).del();
    await logAction({
        tenant_id: tenantId,
        user_id: actorId || null,
        action: 'DELETE_PROJECT',
        entity_type: 'project',
        entity_id: id
    });
}
