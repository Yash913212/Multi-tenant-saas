// const db = require('../config/db'); // db is the pool directly
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const { logAudit } = require('../utils/auditLogger');

// // Generate JWT Helper
// const generateToken = (user) => {
//   return jwt.sign(
//     { userId: user.id, role: user.role, tenantId: user.tenant_id },
//     process.env.JWT_SECRET || 'secret_key',
//     { expiresIn: '24h' }
//   );
// };

// // 1. REGISTER TENANT (Public)
// async function registerTenant(req, res) {
//   const client = await db.connect(); 
  
//   try {
//     const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

//     await client.query('BEGIN'); // Start Transaction

//     // A. Check if subdomain exists
//     const subCheck = await client.query('SELECT 1 FROM tenants WHERE subdomain = $1', [subdomain]);
//     if (subCheck.rowCount > 0) {
//       await client.query('ROLLBACK');
//       return res.status(409).json({ success: false, message: 'Subdomain already taken' });
//     }

//     // B. Create Tenant (FIX: Added max_users and max_projects)
//     const tenantResult = await client.query(
//       `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
//        VALUES ($1, $2, 'active', 'free', 5, 3) 
//        RETURNING id, name, subdomain`,
//       [tenantName, subdomain]
//     );
//     const newTenant = tenantResult.rows[0];

//     // C. Hash Password
//     const hashedPassword = await bcrypt.hash(adminPassword, 10);

//     // D. Create Admin User
//     const userResult = await client.query(
//       `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
//        VALUES ($1, $2, $3, $4, 'tenant_admin')
//        RETURNING id, email, full_name, role`,
//       [newTenant.id, adminEmail, hashedPassword, adminFullName]
//     );
//     const newUser = userResult.rows[0];

//     await client.query('COMMIT'); // Commit Transaction

//     // E. Audit Log
//     try {
//       await logAudit({
//         tenantId: newTenant.id,
//         userId: newUser.id,
//         action: 'REGISTER_TENANT',
//         entityType: 'tenant',
//         entityId: newTenant.id,
//         ipAddress: req.ip
//       });
//     } catch (e) { console.log('Audit log skipped'); }

//     return res.status(201).json({
//       success: true,
//       message: 'Tenant registered successfully',
//       data: { tenant: newTenant, admin: newUser }
//     });

//   } catch (error) {
//     await client.query('ROLLBACK'); // Undo on error
//     console.error('Register Tenant Error:', error);
//     return res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
//   } finally {
//     client.release(); // Always release the client
//   }
// }

// // 2. LOGIN
// async function login(req, res) {
//   try {
//     const { email, password, tenantSubdomain } = req.body;

//     const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
//     if (result.rowCount === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
//     const user = result.rows[0];

//     const isMatch = await bcrypt.compare(password, user.password_hash);
//     if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

//     if (user.role === 'super_admin') {
//       const token = generateToken(user);
//       return res.status(200).json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role } } });
//     }

//     if (tenantSubdomain) {
//       const tRes = await db.query('SELECT id FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
//       if (tRes.rowCount === 0 || tRes.rows[0].id !== user.tenant_id) {
//         return res.status(403).json({ success: false, message: 'User does not belong to this tenant' });
//       }
//     }

//     const token = generateToken(user);
    
//     res.json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id } } });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// // 3. GET CURRENT USER
// async function getCurrentUser(req, res) {
//   try {
//     const { userId } = req.user;
//     const result = await db.query(
//       `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, t.name as tenant_name, t.subdomain
//        FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1`, [userId]
//     );
//     if (result.rowCount === 0) return res.status(404).json({ success: false });
//     res.json({ success: true, data: result.rows[0] });
//   } catch (err) {
//     res.status(500).json({ success: false, message: 'Server error' });
//   }
// }

// async function logout(req, res) {
//   res.json({ success: true, message: 'Logged out' });
// }

// module.exports = { registerTenant, login, getCurrentUser, logout };




const db = require('../config/db'); // Importing the pool directly
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../utils/auditLogger');

// Generate JWT Helper
const generateToken = (user) => {
  return jwt.sign(
    { userId: user.id, role: user.role, tenantId: user.tenant_id },
    process.env.JWT_SECRET || 'secret_key',
    { expiresIn: '24h' }
  );
};

// 1. REGISTER TENANT (FIXED: Now sends max_users=5, max_projects=3)
async function registerTenant(req, res) {
  // Get a dedicated client for the transaction
  const client = await db.connect(); 
  
  try {
    const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;

    await client.query('BEGIN'); // Start Transaction

    // A. Check if subdomain exists
    const subCheck = await client.query('SELECT 1 FROM tenants WHERE subdomain = $1', [subdomain]);
    if (subCheck.rowCount > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, message: 'Subdomain already taken' });
    }

    // B. Create Tenant (THIS IS THE FIX 👇)
    const tenantResult = await client.query(
      `INSERT INTO tenants (name, subdomain, status, subscription_plan, max_users, max_projects)
       VALUES ($1, $2, 'active', 'free', 5, 3) 
       RETURNING id, name, subdomain`,
      [tenantName, subdomain]
    );
    const newTenant = tenantResult.rows[0];

    // C. Hash Password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // D. Create Admin User
    const userResult = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, 'tenant_admin')
       RETURNING id, email, full_name, role`,
      [newTenant.id, adminEmail, hashedPassword, adminFullName]
    );
    const newUser = userResult.rows[0];

    await client.query('COMMIT'); // Commit Transaction

    // Audit Log (Safe check)
    try {
      if (logAudit) {
        await logAudit({
          tenantId: newTenant.id,
          userId: newUser.id,
          action: 'REGISTER_TENANT',
          entityType: 'tenant',
          entityId: newTenant.id,
          ipAddress: req.ip
        });
      }
    } catch (e) { console.warn('Audit log skipped'); }

    return res.status(201).json({
      success: true,
      message: 'Tenant registered successfully',
      data: { tenant: newTenant, admin: newUser }
    });

  } catch (error) {
    await client.query('ROLLBACK'); // Undo if error
    console.error('Register Tenant Error:', error); // Log exact error to terminal
    return res.status(500).json({ success: false, message: 'Registration failed: ' + error.message });
  } finally {
    client.release(); // Release connection
  }
}

// 2. LOGIN
async function login(req, res) {
  try {
    const { email, password, tenantSubdomain } = req.body;

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rowCount === 0) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    // Super Admin Bypass
    if (user.role === 'super_admin') {
      const token = generateToken(user);
      return res.status(200).json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role } } });
    }

    // Tenant Check
    if (tenantSubdomain) {
      const tRes = await db.query('SELECT id FROM tenants WHERE subdomain = $1', [tenantSubdomain]);
      if (tRes.rowCount === 0 || tRes.rows[0].id !== user.tenant_id) {
        return res.status(403).json({ success: false, message: 'User does not belong to this tenant' });
      }
    }

    const token = generateToken(user);
    
    // Audit Log
    try {
        if(logAudit) await logAudit({ tenantId: user.tenant_id, userId: user.id, action: 'LOGIN', entityType: 'auth', ipAddress: req.ip });
    } catch (e) { console.warn('Audit log skipped'); }

    res.json({ success: true, data: { token, user: { id: user.id, email: user.email, role: user.role, tenantId: user.tenant_id } } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

// 3. GET CURRENT USER
async function getCurrentUser(req, res) {
  try {
    const { userId } = req.user;
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.tenant_id, t.name as tenant_name, t.subdomain
       FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id WHERE u.id = $1`, [userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false });
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
}

async function logout(req, res) {
  res.json({ success: true, message: 'Logged out' });
}

module.exports = { registerTenant, login, getCurrentUser, logout };