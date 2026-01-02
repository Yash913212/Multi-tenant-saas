const db = require('../config/db');

async function logAudit({
  tenantId = null,
  userId = null,
  action,
  entityType = null,
  entityId = null,
  ipAddress = null
}) {
  await db.query(
    `INSERT INTO audit_logs
     (tenant_id, user_id, action, entity_type, entity_id, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [tenantId, userId, action, entityType, entityId, ipAddress]
  );
}

module.exports = {
  logAudit
};
