
// const db = require('../config/db');
// const bcrypt = require('bcryptjs');
// const { logAudit } = require('../utils/auditLogger');

// // Helper to validate UUID
// const isUUID = (str) => {
//   const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
//   return regex.test(str);
// };

// // 1. LIST USERS
// async function listUsers(req, res) {
//   const { tenantId, role } = req.user;
//   const targetTenantId = req.params.tenantId;

//   try {
//     let result;
    
//     // CASE A: Super Admin - View ALL Users from ALL Tenants
//     if (role === 'super_admin') {
//       result = await db.query(
//         `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, t.name as tenant_name 
//          FROM users u 
//          LEFT JOIN tenants t ON u.tenant_id = t.id 
//          ORDER BY u.created_at DESC`
//       );
//     } 
//     // CASE B: Regular Admin - View ONLY their own users
//     else {
//       // Security Check: Tenant Admins cannot spy on other tenants
//       if (tenantId !== targetTenantId) {
//         return res.status(403).json({ success: false, message: 'Access denied' });
//       }
      
//       result = await db.query(
//         `SELECT id, email, full_name, role, is_active, created_at 
//          FROM users 
//          WHERE tenant_id = $1 
//          ORDER BY created_at DESC`,
//         [targetTenantId]
//       );
//     }

//     res.json({ success: true, data: result.rows });
//   } catch (err) {
//     console.error("List Users Error:", err.message);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 2. CREATE USER
// async function createUser(req, res) {
//   const { tenantId: requesterTenantId, role: requesterRole } = req.user;
//   const targetTenantId = req.params.tenantId;
//   const { email, password, fullName, role } = req.body;

//   // Security Check
//   if (requesterRole !== 'super_admin' && requesterTenantId !== targetTenantId) {
//     return res.status(403).json({ success: false, message: 'Access denied' });
//   }

//   try {
//     // Check Limits (Max Users)
//     const limitCheck = await db.query(
//       `SELECT max_users, (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as current_count FROM tenants WHERE id = $1`,
//       [targetTenantId]
//     );
//     if (limitCheck.rowCount === 0) return res.status(404).json({ message: 'Tenant not found' });
    
//     const { max_users, current_count } = limitCheck.rows[0];
//     if (parseInt(current_count) >= max_users) {
//       return res.status(403).json({ success: false, message: `Plan limit reached (${max_users} users).` });
//     }

//     // Check if Email Exists
//     const emailCheck = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
//     if (emailCheck.rowCount > 0) return res.status(400).json({ success: false, message: 'Email already exists' });

//     // Create User
//     const hash = await bcrypt.hash(password, 10);
//     const result = await db.query(
//       `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
//        VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
//       [targetTenantId, email, hash, fullName, role || 'user']
//     );

//     // Audit Log
//     try {
//       await logAudit({ tenantId: targetTenantId, userId: req.user.id || req.user.userId, action: 'CREATE_USER', entityType: 'user', entityId: result.rows[0].id, ipAddress: req.ip });
//     } catch (e) {}

//     res.status(201).json({ success: true, data: result.rows[0], message: 'User added successfully' });

//   } catch (err) {
//     console.error("Create User Error:", err);
//     res.status(500).json({ success: false, message: 'Server error: ' + err.message });
//   }
// }

// // 3. UPDATE USER
// async function updateUser(req, res) {
//   const { tenantId, role: requesterRole } = req.user;
//   const { userId } = req.params; 
//   const { fullName, role } = req.body;

//   try {
//     // If not Super Admin, ensure they are updating a user in their own tenant
//     if (requesterRole !== 'super_admin') {
//        const userCheck = await db.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
//        if (userCheck.rowCount === 0) {
//          return res.status(404).json({ success: false, message: 'User not found' });
//        }
//     }

//     const result = await db.query(
//       `UPDATE users SET full_name = $1, role = $2 WHERE id = $3 RETURNING id, full_name, email, role`,
//       [fullName, role, userId]
//     );

//     res.json({ success: true, data: result.rows[0], message: 'User updated successfully' });

//   } catch (err) {
//     console.error("Update User Error:", err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 4. DELETE USER
// async function deleteUser(req, res) {
//   const { tenantId, role: requesterRole } = req.user;
//   const { userId } = req.params;

//   try {
//     let result;
    
//     if (requesterRole === 'super_admin') {
//        result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
//     } else {
//        // Regular admin can only delete their own users
//        result = await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [userId, tenantId]);
//     }
    
//     if (result.rowCount === 0) {
//       return res.status(404).json({ success: false, message: 'User not found or access denied' });
//     }

//     res.json({ success: true, message: 'User deleted successfully' });

//   } catch (err) {
//     console.error("Delete User Error:", err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// module.exports = { listUsers, createUser, updateUser, deleteUser };



const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/auditLogger');

// Helper to validate UUID
const isUUID = (str) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

// 1. LIST USERS
async function listUsers(req, res) {
  const { tenantId, role } = req.user;
  const targetTenantId = req.params.tenantId;

  try {
    let result;
    
    // CASE A: Super Admin - View ALL Users from ALL Tenants
    if (role === 'super_admin') {
      result = await db.query(
        `SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, t.name as tenant_name 
         FROM users u 
         LEFT JOIN tenants t ON u.tenant_id = t.id 
         ORDER BY u.created_at DESC`
      );
    } 
    // CASE B: Regular Admin - View ONLY their own users
    else {
      // Security Check: Tenant Admins cannot spy on other tenants
      if (tenantId !== targetTenantId) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }
      
      result = await db.query(
        `SELECT id, email, full_name, role, is_active, created_at 
         FROM users 
         WHERE tenant_id = $1 
         ORDER BY created_at DESC`,
        [targetTenantId]
      );
    }

    res.json({ success: true, data: result.rows });
  } catch (err) {
    console.error("List Users Error:", err.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 2. CREATE USER
async function createUser(req, res) {
  const { tenantId: requesterTenantId, role: requesterRole } = req.user;
  const targetTenantId = req.params.tenantId;
  const { email, password, fullName, role } = req.body;

  // Security Check
  if (requesterRole !== 'super_admin' && requesterTenantId !== targetTenantId) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }

  try {
    // Check Limits (Max Users)
    const limitCheck = await db.query(
      `SELECT max_users, (SELECT COUNT(*) FROM users WHERE tenant_id = $1) as current_count FROM tenants WHERE id = $1`,
      [targetTenantId]
    );
    if (limitCheck.rowCount === 0) return res.status(404).json({ message: 'Tenant not found' });
    
    const { max_users, current_count } = limitCheck.rows[0];
    if (parseInt(current_count) >= max_users) {
      return res.status(403).json({ success: false, message: `Plan limit reached (${max_users} users).` });
    }

    // Check if Email Exists
    const emailCheck = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (emailCheck.rowCount > 0) return res.status(400).json({ success: false, message: 'Email already exists' });

    // Create User
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, role`,
      [targetTenantId, email, hash, fullName, role || 'user']
    );

    // Audit Log
    try {
      await logAudit({ tenantId: targetTenantId, userId: req.user.id || req.user.userId, action: 'CREATE_USER', entityType: 'user', entityId: result.rows[0].id, ipAddress: req.ip });
    } catch (e) {}

    res.status(201).json({ success: true, data: result.rows[0], message: 'User added successfully' });

  } catch (err) {
    console.error("Create User Error:", err);
    res.status(500).json({ success: false, message: 'Server error: ' + err.message });
  }
}

// 3. UPDATE USER
async function updateUser(req, res) {
  const { tenantId, role: requesterRole } = req.user;
  const { userId } = req.params; 
  const { fullName, role } = req.body;

  try {
    // If not Super Admin, ensure they are updating a user in their own tenant
    if (requesterRole !== 'super_admin') {
       const userCheck = await db.query('SELECT * FROM users WHERE id = $1 AND tenant_id = $2', [userId, tenantId]);
       if (userCheck.rowCount === 0) {
         return res.status(404).json({ success: false, message: 'User not found' });
       }
    }

    const result = await db.query(
      `UPDATE users SET full_name = $1, role = $2 WHERE id = $3 RETURNING id, full_name, email, role`,
      [fullName, role, userId]
    );

    res.json({ success: true, data: result.rows[0], message: 'User updated successfully' });

  } catch (err) {
    console.error("Update User Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 4. DELETE USER
async function deleteUser(req, res) {
  const { tenantId, role: requesterRole } = req.user;
  const { userId } = req.params;

  try {
    let result;
    
    if (requesterRole === 'super_admin') {
       result = await db.query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    } else {
       // Regular admin can only delete their own users
       result = await db.query('DELETE FROM users WHERE id = $1 AND tenant_id = $2 RETURNING id', [userId, tenantId]);
    }
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'User not found or access denied' });
    }

    res.json({ success: true, message: 'User deleted successfully' });

  } catch (err) {
    console.error("Delete User Error:", err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser };