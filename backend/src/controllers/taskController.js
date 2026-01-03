const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. List Tasks
async function listTasks(req, res) {
    const { tenantId, role } = req.user;
    const { projectId } = req.query; // Allow filtering by project

    try {
        // For non-super admins, verify the project (if provided) belongs to their tenant
        if (role !== 'super_admin' && projectId) {
            const projectCheck = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [projectId]);
            if (projectCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'Project not found' });
            if (projectCheck.rows[0].tenant_id !== tenantId) return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        let query;
        const params = [];

        if (role === 'super_admin') {
            query = `SELECT t.*, p.name as project_name, ten.name as tenant_name
               FROM tasks t
               LEFT JOIN projects p ON t.project_id = p.id
               LEFT JOIN tenants ten ON t.tenant_id = ten.id`;
            if (projectId) {
                query += ` WHERE t.project_id = $1`;
                params.push(projectId);
            }
            query += ` ORDER BY t.created_at DESC`;
        } else {
            query = `SELECT * FROM tasks WHERE tenant_id = $1`;
            params.push(tenantId);
            if (projectId) {
                query += ` AND project_id = $2`;
                params.push(projectId);
            }
            query += ` ORDER BY created_at DESC`;
        }

        const result = await db.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 2. Create Task
async function createTask(req, res) {
    const { tenantId, userId, role } = req.user;
    const { projectId, title, description, priority, dueDate, assignedTo } = req.body;

    if (!projectId || !title) {
        return res.status(400).json({ success: false, message: 'projectId and title are required' });
    }

    const allowedPriorities = ['low', 'medium', 'high'];
    if (priority && !allowedPriorities.includes(priority)) {
        return res.status(400).json({ success: false, message: 'Invalid priority' });
    }

    try {
        const project = await db.query('SELECT id, tenant_id FROM projects WHERE id = $1', [projectId]);
        if (project.rowCount === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        const targetTenantId = project.rows[0].tenant_id;
        if (role !== 'super_admin' && targetTenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(
            `INSERT INTO tasks
       (project_id, tenant_id, title, description, status, priority, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
       RETURNING *`, [projectId, targetTenantId, title, description || null, priority || 'medium', dueDate || null, assignedTo || null]
        );

        await logAudit({ tenantId: targetTenantId, userId, action: 'CREATE_TASK', entityType: 'task', entityId: result.rows[0].id, ipAddress: req.ip });
        res.status(201).json({ success: true, data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 3. Update Task Status (API 18 in Spec)
async function updateTaskStatus(req, res) {
    const { id } = req.params;
    const { tenantId, userId, role } = req.user;
    const { status } = req.body; // 'todo', 'in_progress', 'completed'

    const allowedStatuses = ['todo', 'in_progress', 'completed'];
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const taskCheck = await db.query(
            `SELECT t.id, t.tenant_id, t.project_id, p.tenant_id as project_tenant_id
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = $1`, [id]
        );

        if (taskCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const taskTenantId = taskCheck.rows[0].tenant_id;
        if (role !== 'super_admin' && taskTenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(
            `UPDATE tasks SET status = $1, updated_at = NOW() 
       WHERE id = $2 RETURNING *`, [status, id]
        );

        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 4. Update Task Details (API 19 in Spec)
async function updateTask(req, res) {
    const { id } = req.params;
    const { tenantId, userId, role } = req.user;
    const { title, description, priority, assignedTo, dueDate } = req.body;

    if (priority) {
        const allowedPriorities = ['low', 'medium', 'high'];
        if (!allowedPriorities.includes(priority)) {
            return res.status(400).json({ success: false, message: 'Invalid priority' });
        }
    }

    try {
        const taskCheck = await db.query(
            `SELECT t.id, t.tenant_id, t.project_id, p.tenant_id as project_tenant_id
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = $1`, [id]
        );

        if (taskCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const taskTenantId = taskCheck.rows[0].tenant_id;
        if (role !== 'super_admin' && taskTenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(
            `UPDATE tasks SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        priority = COALESCE($3, priority), 
        assigned_to = COALESCE($4, assigned_to), 
        due_date = COALESCE($5, due_date),
        updated_at = NOW()
       WHERE id = $6 RETURNING *`, [title, description, priority, assignedTo, dueDate, id]
        );

        await logAudit({ tenantId: taskTenantId, userId, action: 'UPDATE_TASK', entityType: 'task', entityId: id, ipAddress: req.ip });
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 5. Delete Task
async function deleteTask(req, res) {
    const { id } = req.params;
    const { tenantId, userId, role } = req.user;

    try {
        const taskCheck = await db.query(
            `SELECT t.id, t.tenant_id, t.project_id, p.tenant_id as project_tenant_id
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.id = $1`, [id]
        );

        if (taskCheck.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });

        const taskTenantId = taskCheck.rows[0].tenant_id;
        if (role !== 'super_admin' && taskTenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        await db.query(`DELETE FROM tasks WHERE id = $1`, [id]);

        await logAudit({ tenantId: taskTenantId, userId, action: 'DELETE_TASK', entityType: 'task', entityId: id, ipAddress: req.ip });
        res.json({ success: true, message: 'Task deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { listTasks, createTask, updateTaskStatus, updateTask, deleteTask };