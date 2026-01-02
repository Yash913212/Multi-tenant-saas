const db = require('../config/db');

async function getStats(req, res) {
    const { role, tenantId } = req.user;

    try {
        if (role === 'super_admin') {
            const [projects, tasksTotal, tasksCompleted, users] = await Promise.all([
                db.query('SELECT COUNT(*) FROM projects'),
                db.query('SELECT COUNT(*) FROM tasks'),
                db.query("SELECT COUNT(*) FROM tasks WHERE status = 'completed'"),
                db.query('SELECT COUNT(*) FROM users'),
            ]);

            const activeTasks = parseInt(tasksTotal.rows[0].count || '0') - parseInt(tasksCompleted.rows[0].count || '0');

            return res.json({
                success: true,
                data: {
                    scope: 'global',
                    totalProjects: parseInt(projects.rows[0].count || '0'),
                    activeTasks,
                    completedTasks: parseInt(tasksCompleted.rows[0].count || '0'),
                    totalUsers: parseInt(users.rows[0].count || '0'),
                },
            });
        }

        // Tenant-scoped stats
        const [projects, tasksTotal, tasksCompleted, users] = await Promise.all([
            db.query('SELECT COUNT(*) FROM projects WHERE tenant_id = $1', [tenantId]),
            db.query('SELECT COUNT(*) FROM tasks WHERE tenant_id = $1', [tenantId]),
            db.query("SELECT COUNT(*) FROM tasks WHERE tenant_id = $1 AND status = 'completed'", [tenantId]),
            db.query('SELECT COUNT(*) FROM users WHERE tenant_id = $1', [tenantId]),
        ]);

        const activeTasks = parseInt(tasksTotal.rows[0].count || '0') - parseInt(tasksCompleted.rows[0].count || '0');

        res.json({
            success: true,
            data: {
                scope: 'tenant',
                totalProjects: parseInt(projects.rows[0].count || '0'),
                activeTasks,
                completedTasks: parseInt(tasksCompleted.rows[0].count || '0'),
                totalUsers: parseInt(users.rows[0].count || '0'),
            },
        });
    } catch (err) {
        console.error('Dashboard stats error:', err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

module.exports = { getStats };