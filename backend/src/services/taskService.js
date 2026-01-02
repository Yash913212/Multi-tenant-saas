import db from '../config/db.js';
import { logAction } from './auditService.js';

export async function createTask(tenantId, projectId, payload, actor) {
    const project = await db('projects').where({ id: projectId, tenant_id: tenantId }).first();
    if (!project) {
        const err = new Error('Project not found');
        err.status = 403;
        throw err;
    }

    if (payload.assignedTo) {
        const assignee = await db('users').where({ id: payload.assignedTo, tenant_id: tenantId }).first();
        if (!assignee) {
            const err = new Error('Assigned user must belong to tenant');
            err.status = 400;
            throw err;
        }
    }

    const [task] = await db('tasks')
        .insert({
            project_id: projectId,
            tenant_id: tenantId,
            title: payload.title,
            description: payload.description,
            priority: payload.priority || 'medium',
            status: payload.status || 'todo',
            assigned_to: payload.assignedTo || null,
            due_date: payload.dueDate || null
        })
        .returning('*');
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'CREATE_TASK', entity_type: 'task', entity_id: task.id });
    return task;
}

export async function listTasks(tenantId, projectId, { status, assignedTo, priority, search, page = 1, limit = 50 } = {}) {
    const sanitizedLimit = Math.min(Number(limit) || 50, 100);
    const offset = (Number(page) - 1) * sanitizedLimit;
    const base = db('tasks').where({ tenant_id: tenantId, project_id: projectId });
    if (status) base.andWhere({ status });
    if (assignedTo) base.andWhere({ assigned_to: assignedTo });
    if (priority) base.andWhere({ priority });
    if (search) base.andWhereILike('title', `%${search}%`);

    const [{ count }] = await base.clone().count();
    const tasks = await base
        .clone()
        .select('tasks.*', 'u.full_name as assigned_full_name', 'u.email as assigned_email')
        .leftJoin('users as u', 'u.id', 'tasks.assigned_to')
        .orderByRaw('CASE priority WHEN \'high\' THEN 1 WHEN \'medium\' THEN 2 ELSE 3 END')
        .orderBy('due_date', 'asc')
        .limit(sanitizedLimit)
        .offset(offset);

    return {
        tasks: tasks.map((t) => ({
            ...t,
            assignedTo: t.assigned_to ?
                { id: t.assigned_to, fullName: t.assigned_full_name, email: t.assigned_email } :
                null
        })),
        total: Number(count) || 0,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil((Number(count) || 0) / sanitizedLimit) || 0,
            limit: sanitizedLimit
        }
    };
}

export async function getTaskById(id, tenantId) {
    return db('tasks').where({ id, tenant_id: tenantId }).first();
}

export async function updateTaskStatus(id, tenantId, status, actor) {
    const task = await getTaskById(id, tenantId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }
    const [updated] = await db('tasks').where({ id, tenant_id: tenantId }).update({ status, updated_at: db.fn.now() }).returning('*');
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'UPDATE_TASK_STATUS', entity_type: 'task', entity_id: id });
    return updated;
}

export async function updateTask(id, tenantId, updates, actor) {
    const task = await getTaskById(id, tenantId);
    if (!task) {
        const err = new Error('Task not found');
        err.status = 404;
        throw err;
    }

    if (updates.assignedTo) {
        const assignee = await db('users').where({ id: updates.assignedTo, tenant_id: tenantId }).first();
        if (!assignee) {
            const err = new Error('Assigned user must belong to tenant');
            err.status = 400;
            throw err;
        }
    }

    const payload = {
        title: updates.title ? ? task.title,
        description: updates.description ? ? task.description,
        status: updates.status ? ? task.status,
        priority: updates.priority ? ? task.priority,
        assigned_to: updates.hasOwnProperty('assignedTo') ? updates.assignedTo : task.assigned_to,
        due_date: updates.hasOwnProperty('dueDate') ? updates.dueDate : task.due_date,
        updated_at: db.fn.now()
    };

    const [updated] = await db('tasks').where({ id, tenant_id: tenantId }).update(payload).returning('*');
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'UPDATE_TASK', entity_type: 'task', entity_id: id });
    return updated;
}

export async function deleteTask(id, tenantId, actor) {
    await db('tasks').where({ id, tenant_id: tenantId }).del();
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'DELETE_TASK', entity_type: 'task', entity_id: id });
}