import db from '../config/db.js';

export async function logAction({ tenant_id = null, user_id = null, action, entity_type = null, entity_id = null, ip_address = null }) {
    if (!action) return;
    await db('audit_logs').insert({ tenant_id, user_id, action, entity_type, entity_id, ip_address });
}