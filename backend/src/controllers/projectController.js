const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. LIST PROJECTS with filters/search/pagination and task counts
async function listProjects(req, res) {
    const { tenantId, role } = req.user;
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;
    const statusFilter = req.query.status;
    const search = req.query.search ? req.query.search.toLowerCase() : null;

    try {
        const params = [];
        const filters = [];

        if (role !== 'super_admin') {
            params.push(tenantId);
            filters.push(`p.tenant_id = $${params.length}`);
        }

        if (statusFilter) {
            params.push(statusFilter);
            filters.push(`p.status = $${params.length}`);
        }

        if (search) {
            params.push(`%${search}%`);
            filters.push(`LOWER(p.name) LIKE $${params.length}`);
        }

        const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

        const projectsQuery = `
      SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at, p.tenant_id, p.created_by,
             t.name as tenant_name,
             u.full_name as creator_name,
             (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id) AS task_count,
             (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id AND tk.status = 'completed') AS completed_task_count
      FROM projects p
      LEFT JOIN tenants t ON p.tenant_id = t.id
      LEFT JOIN users u ON p.created_by = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

        const totalQuery = `SELECT COUNT(*) AS count FROM projects p ${whereClause}`;

        const projectsResult = await db.query(projectsQuery, [...params, limit, offset]);
        const totalResult = await db.query(totalQuery, params);

        const total = parseInt(totalResult.rows[0].count || '0', 10);
        const totalPages = Math.max(Math.ceil(total / limit), 1);

        return res.json({
            success: true,
            data: {
                projects: projectsResult.rows,
                total,
                pagination: {
                    currentPage: page,
                    totalPages,
                    limit
                }
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 1b. GET PROJECT DETAILS with task counts
async function getProject(req, res) {
    const { id } = req.params;
    const { tenantId, role } = req.user;

    try {
        const projectResult = await db.query(
            `SELECT p.id, p.name, p.description, p.status, p.created_at, p.updated_at, p.tenant_id, p.created_by,
                    t.name as tenant_name,
                    u.full_name as creator_name,
                    (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id) AS task_count,
                    (SELECT COUNT(*) FROM tasks tk WHERE tk.project_id = p.id AND tk.status = 'completed') AS completed_task_count
             FROM projects p
             LEFT JOIN tenants t ON p.tenant_id = t.id
             LEFT JOIN users u ON p.created_by = u.id
             WHERE p.id = $1`, [id]
        );

        if (projectResult.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const project = projectResult.rows[0];
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        return res.json({ success: true, data: project });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 2. CREATE PROJECT (With Subscription Limit Check)
async function createProject(req, res) {
    const { tenantId, userId, role } = req.user;
    const { name, description, status } = req.body;

    if (role !== 'tenant_admin' && role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only admins can create projects' });
    }

    if (!name) {
        return res.status(400).json({ success: false, message: 'Project name is required' });
    }

    const allowedStatuses = ['active', 'archived', 'completed'];
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    // Allow super_admin to create for any tenant via body.tenantId (optional) or use provided tenantId for others
    let targetTenantId = tenantId;
    if (role === 'super_admin' && req.body.tenantId) {
        targetTenantId = req.body.tenantId;
    }

    if (!targetTenantId) {
        return res.status(400).json({ success: false, message: 'tenantId is required to create a project' });
    }

    try {
        // --- LIMIT CHECK START ---
        const limitCheck = await db.query(
            `SELECT max_projects, (SELECT COUNT(*) FROM projects WHERE tenant_id = $1) as current_count 
       FROM tenants WHERE id = $1`, [targetTenantId]
        );
        if (limitCheck.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        const { max_projects, current_count } = limitCheck.rows[0];
        if (parseInt(current_count) >= max_projects) {
            return res.status(403).json({ success: false, message: `Plan limit reached (${max_projects} projects). Please upgrade.` });
        }
        // --- LIMIT CHECK END ---

        const result = await db.query(
            `INSERT INTO projects (tenant_id, name, description, status, created_by)
       VALUES ($1, $2, $3, COALESCE($4, 'active'), $5) RETURNING *`, [targetTenantId, name, description, status, userId]
        );

        await logAudit({ tenantId: targetTenantId, userId, action: 'CREATE_PROJECT', entityType: 'project', entityId: result.rows[0].id, ipAddress: req.ip });
        res.status(201).json({ success: true, message: 'Project created', data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 3. UPDATE PROJECT (API 14 in Spec)
async function updateProject(req, res) {
    const { id } = req.params;
    const { tenantId, userId, role } = req.user;
    const { name, description, status } = req.body;

    if (role !== 'tenant_admin' && role !== 'super_admin') {
        return res.status(403).json({ success: false, message: 'Only admins can update projects' });
    }

    const allowedStatuses = ['active', 'archived', 'completed'];
    if (status && !allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    try {
        const check = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
        if (check.rowCount === 0) return res.status(404).json({ success: false, message: 'Project not found' });

        const project = check.rows[0];
        if (role !== 'super_admin' && project.tenant_id !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(
            `UPDATE projects SET 
       name = COALESCE($1, name), 
       description = COALESCE($2, description), 
       status = COALESCE($3, status), 
       updated_at = NOW()
       WHERE id = $4 RETURNING *`, [name, description, status, id]
        );

        await logAudit({ tenantId: project.tenant_id, userId, action: 'UPDATE_PROJECT', entityType: 'project', entityId: id, ipAddress: req.ip });
        res.json({ success: true, message: 'Project updated', data: result.rows[0] });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// 4. DELETE PROJECT
async function deleteProject(req, res) {
    const { id } = req.params;
    const { tenantId, userId, role } = req.user;

    try {
        if (role !== 'tenant_admin' && role !== 'super_admin') {
            return res.status(403).json({ success: false, message: 'Only admins can delete projects' });
        }

        const project = await db.query('SELECT tenant_id FROM projects WHERE id = $1', [id]);
        if (project.rowCount === 0) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const projectTenantId = project.rows[0].tenant_id;
        if (role !== 'super_admin' && projectTenantId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const result = await db.query(`DELETE FROM projects WHERE id = $1 RETURNING *`, [id]);

        await logAudit({ tenantId: projectTenantId, userId, action: 'DELETE_PROJECT', entityType: 'project', entityId: id, ipAddress: req.ip });
        res.json({ success: true, message: "Project deleted successfully" });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { listProjects, getProject, createProject, updateProject, deleteProject };