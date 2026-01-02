// const db = require('../config/db');
// const { logAudit } = require('../utils/auditLogger');

// async function listTasks(req, res) {
//   const { tenantId } = req.user;
//   const result = await db.query(
//     `SELECT * FROM tasks WHERE tenant_id = $1 ORDER BY created_at DESC`,
//     [tenantId]
//   );
//   res.json({ success: true, data: result.rows });
// }

// async function createTask(req, res) {
//   const { tenantId, userId } = req.user;
//   const { projectId, title, description, priority, dueDate, assignedTo } = req.body;
//   const result = await db.query(
//     `INSERT INTO tasks
//      (project_id, tenant_id, title, description, status, priority, due_date, assigned_to)
//      VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
//      RETURNING *`,
//     [projectId, tenantId, title, description || null, priority, dueDate || null, assignedTo || null]
//   );
//   await logAudit({
//     tenantId,
//     userId,
//     action: 'CREATE_TASK',
//     entityType: 'task',
//     entityId: result.rows[0].id,
//     ipAddress: req.ip
//   });
//   res.status(201).json({ success: true, data: result.rows[0] });
// }

// module.exports = { listTasks, createTask };


const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. List Tasks
async function listTasks(req, res) {
  const { tenantId } = req.user;
  const { projectId } = req.query; // Allow filtering by project

  try {
    let query = `SELECT * FROM tasks WHERE tenant_id = $1`;
    const params = [tenantId];

    if (projectId) {
      query += ` AND project_id = $2`;
      params.push(projectId);
    }

    query += ` ORDER BY created_at DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 2. Create Task
async function createTask(req, res) {
  const { tenantId, userId } = req.user;
  const { projectId, title, description, priority, dueDate, assignedTo } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO tasks
       (project_id, tenant_id, title, description, status, priority, due_date, assigned_to)
       VALUES ($1, $2, $3, $4, 'todo', $5, $6, $7)
       RETURNING *`,
      [projectId, tenantId, title, description || null, priority || 'medium', dueDate || null, assignedTo || null]
    );

    await logAudit({ tenantId, userId, action: 'CREATE_TASK', entityType: 'task', entityId: result.rows[0].id, ipAddress: req.ip });
    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 3. Update Task Status (API 18 in Spec)
async function updateTaskStatus(req, res) {
  const { id } = req.params;
  const { tenantId, userId } = req.user;
  const { status } = req.body; // 'todo', 'in_progress', 'completed'

  try {
    const result = await db.query(
      `UPDATE tasks SET status = $1, updated_at = NOW() 
       WHERE id = $2 AND tenant_id = $3 RETURNING *`,
      [status, id, tenantId]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Log audit is optional for status updates, but good practice
    // await logAudit({ tenantId, userId, action: 'UPDATE_TASK_STATUS', entityType: 'task', entityId: id, ipAddress: req.ip });

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 4. Update Task Details (API 19 in Spec)
async function updateTask(req, res) {
  const { id } = req.params;
  const { tenantId, userId } = req.user;
  const { title, description, priority, assignedTo, dueDate } = req.body;

  try {
    const result = await db.query(
      `UPDATE tasks SET 
        title = COALESCE($1, title), 
        description = COALESCE($2, description), 
        priority = COALESCE($3, priority), 
        assigned_to = COALESCE($4, assigned_to), 
        due_date = COALESCE($5, due_date),
        updated_at = NOW()
       WHERE id = $6 AND tenant_id = $7 RETURNING *`,
      [title, description, priority, assignedTo, dueDate, id, tenantId]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    
    await logAudit({ tenantId, userId, action: 'UPDATE_TASK', entityType: 'task', entityId: id, ipAddress: req.ip });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 5. Delete Task
async function deleteTask(req, res) {
  const { id } = req.params;
  const { tenantId, userId } = req.user;

  try {
    const result = await db.query(`DELETE FROM tasks WHERE id = $1 AND tenant_id = $2 RETURNING id`, [id, tenantId]);
    
    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Task not found' });
    
    await logAudit({ tenantId, userId, action: 'DELETE_TASK', entityType: 'task', entityId: id, ipAddress: req.ip });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { listTasks, createTask, updateTaskStatus, updateTask, deleteTask };