// const db = require('../config/db');
// const { logAudit } = require('../utils/auditLogger');

// // 1. LIST TENANTS
// async function listTenants(req, res) {
//   try {
//     const result = await db.query(`SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at FROM tenants ORDER BY created_at DESC`);
//     res.status(200).json({ success: true, data: result.rows });
//   } catch (err) {
//     console.error('List tenants error', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 2. CREATE TENANT
// async function createTenant(req, res) {
//   try {
//     const { userId } = req.user; 
//     const { name, subdomain, subscription_plan } = req.body;

//     const check = await db.query(`SELECT 1 FROM tenants WHERE subdomain = $1`, [subdomain]);
//     if (check.rowCount > 0) return res.status(400).json({ success: false, message: 'Subdomain already exists' });

//     const result = await db.query(
//       `INSERT INTO tenants (name, subdomain, subscription_plan, status) VALUES ($1, $2, $3, 'active') RETURNING *`,
//       [name, subdomain, subscription_plan || 'basic']
//     );
//     const newTenant = result.rows[0];

//     await logAudit({ tenantId: newTenant.id, userId, action: 'CREATE_TENANT', entityType: 'tenant', entityId: newTenant.id, ipAddress: req.ip });

//     res.status(201).json({ success: true, data: newTenant });
//   } catch (err) {
//     console.error('Create tenant error:', err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 3. GET TENANT
// async function getTenant(req, res) {
//   try {
//     const { tenantId } = req.params;
//     const result = await db.query(
//       `SELECT t.*, 
//        (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
//        (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects
//        FROM tenants t WHERE t.id = $1`,
//       [tenantId]
//     );

//     if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
//     res.status(200).json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 4. UPDATE TENANT
// async function updateTenant(req, res) {
//   try {
//     const { tenantId } = req.params;
//     const { name } = req.body; 
    
//     const result = await db.query(
//       `UPDATE tenants SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
//       [name, tenantId]
//     );

//     if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
//     res.status(200).json({ success: true, data: result.rows[0], message: 'Tenant updated' });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 5. DELETE TENANT (Fixed Order)
// async function deleteTenant(req, res) {
//   const { tenantId } = req.params;
//   const client = await db.pool.connect();
  
//   try {
//     await client.query('BEGIN');

//     // 1. Delete Tasks (CRITICAL: Must be deleted first because they link to Projects/Users)
//     await client.query('DELETE FROM tasks WHERE tenant_id = $1', [tenantId]);

//     // 2. Delete Projects (Now safe to delete)
//     await client.query('DELETE FROM projects WHERE tenant_id = $1', [tenantId]);

//     // 3. Delete Users (Now safe to delete)
//     await client.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    
//     // 4. Delete Tenant
//     const result = await client.query('DELETE FROM tenants WHERE id = $1 RETURNING id', [tenantId]);
    
//     if (result.rowCount === 0) {
//       await client.query('ROLLBACK');
//       return res.status(404).json({ success: false, message: 'Tenant not found' });
//     }

//     await client.query('COMMIT');
//     res.json({ success: true, message: 'Tenant and all data deleted successfully' });

//   } catch (err) {
//     await client.query('ROLLBACK');
//     console.error("Delete Tenant Error:", err);
//     res.status(500).json({ success: false, message: 'Server error: ' + err.message });
//   } finally {
//     client.release();
//   }
// }

// module.exports = {
//   listTenants,
//   createTenant,
//   getTenant,
//   updateTenant,
//   deleteTenant 
// };

const db = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

// 1. LIST TENANTS
async function listTenants(req, res) {
  try {
    const result = await db.query(`SELECT id, name, subdomain, status, subscription_plan, max_users, max_projects, created_at FROM tenants ORDER BY created_at DESC`);
    res.status(200).json({ success: true, data: result.rows });
  } catch (err) {
    console.error('List tenants error', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 2. CREATE TENANT
async function createTenant(req, res) {
  try {
    const { userId } = req.user; 
    const { name, subdomain, subscription_plan } = req.body;

    const check = await db.query(`SELECT 1 FROM tenants WHERE subdomain = $1`, [subdomain]);
    if (check.rowCount > 0) return res.status(400).json({ success: false, message: 'Subdomain already exists' });

    const result = await db.query(
      `INSERT INTO tenants (name, subdomain, subscription_plan, status) VALUES ($1, $2, $3, 'active') RETURNING *`,
      [name, subdomain, subscription_plan || 'basic']
    );
    const newTenant = result.rows[0];

    // Try/Catch for Audit to prevent crash if audit fails
    try {
      if (logAudit) {
        await logAudit({ tenantId: newTenant.id, userId, action: 'CREATE_TENANT', entityType: 'tenant', entityId: newTenant.id, ipAddress: req.ip });
      }
    } catch (e) { console.warn("Audit log failed"); }

    res.status(201).json({ success: true, data: newTenant });
  } catch (err) {
    console.error('Create tenant error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 3. GET TENANT
async function getTenant(req, res) {
  try {
    const { tenantId } = req.params;
    const result = await db.query(
      `SELECT t.*, 
       (SELECT COUNT(*) FROM users u WHERE u.tenant_id = t.id) AS total_users,
       (SELECT COUNT(*) FROM projects p WHERE p.tenant_id = t.id) AS total_projects
       FROM tenants t WHERE t.id = $1`,
      [tenantId]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 4. UPDATE TENANT
async function updateTenant(req, res) {
  try {
    const { tenantId } = req.params;
    const { name } = req.body; 
    
    const result = await db.query(
      `UPDATE tenants SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [name, tenantId]
    );

    if (result.rowCount === 0) return res.status(404).json({ success: false, message: 'Tenant not found' });
    res.status(200).json({ success: true, data: result.rows[0], message: 'Tenant updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 5. DELETE TENANT (The Critical Fix)
async function deleteTenant(req, res) {
  const { tenantId } = req.params;
  
  // FIX 1: Use db.connect(), NOT db.pool.connect()
  const client = await db.connect();
  
  try {
    await client.query('BEGIN');

    // FIX 2: Delete in correct order to satisfy Foreign Keys
    // 1. Delete Tasks (They refer to Projects/Users)
    await client.query('DELETE FROM tasks WHERE tenant_id = $1', [tenantId]);

    // 2. Delete Projects (They refer to Users/Tenants)
    await client.query('DELETE FROM projects WHERE tenant_id = $1', [tenantId]);

    // 3. Delete Users (They refer to Tenants)
    await client.query('DELETE FROM users WHERE tenant_id = $1', [tenantId]);
    
    // 4. Finally, Delete Tenant
    const result = await client.query('DELETE FROM tenants WHERE id = $1 RETURNING id', [tenantId]);
    
    if (result.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Tenant not found' });
    }

    await client.query('COMMIT');
    res.json({ success: true, message: 'Tenant and all data deleted successfully' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Delete Tenant Error:", err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  } finally {
    client.release();
  }
}

// Export ALL functions
module.exports = {
  listTenants,
  createTenant,
  getTenant,
  updateTenant,
  deleteTenant 
};