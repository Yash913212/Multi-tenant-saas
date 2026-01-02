import bcrypt from 'bcryptjs';
import db from '../config/db.js';
import { PLAN_LIMITS, ROLES } from '../utils/constants.js';
import { logAction } from './auditService.js';

async function ensureUserLimit(tenantId) {
    const tenant = await db('tenants').where({ id: tenantId }).first();
    if (!tenant) {
        const err = new Error('Tenant not found');
        err.status = 404;
        throw err;
    }
    const [{ count }] = await db('users').where({ tenant_id: tenantId }).count();
    if (Number(count) >= tenant.max_users) {
        const err = new Error('User limit reached for current plan');
        err.status = 403;
        throw err;
    }
}

export async function createUser(tenantId, { email, password, fullName, role = ROLES.USER }, actor) {
    await ensureUserLimit(tenantId);
    const existing = await db('users').where({ tenant_id: tenantId, email }).first();
    if (existing) {
        const err = new Error('Email already exists for this tenant');
        err.status = 409;
        throw err;
    }

    const [inserted] = await db('users')
        .insert({
            tenant_id: tenantId,
            email,
            password_hash: await bcrypt.hash(password, 10),
            full_name: fullName,
            role
        })
        .returning(['id', 'email', 'full_name', 'role', 'tenant_id', 'is_active', 'created_at']);

    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'CREATE_USER', entity_type: 'user', entity_id: inserted.id });
    return inserted;
}

export async function listUsers(tenantId, { search, role, page = 1, limit = 50 } = {}) {
    const sanitizedLimit = Math.min(Number(limit) || 50, 100);
    const offset = (Number(page) - 1) * sanitizedLimit;
    const base = db('users').where({ tenant_id: tenantId });
    if (search) {
        base.andWhere((qb) => {
            qb.whereILike('full_name', `%${search}%`).orWhereILike('email', `%${search}%`);
        });
    }
    if (role) base.andWhere({ role });

    const [{ count }] = await base.clone().count();
    const users = await base
        .clone()
        .select('id', 'email', 'full_name', 'role', 'is_active', 'created_at')
        .orderBy('created_at', 'desc')
        .limit(sanitizedLimit)
        .offset(offset);

    return {
        users,
        total: Number(count) || 0,
        pagination: {
            currentPage: Number(page),
            totalPages: Math.ceil((Number(count) || 0) / sanitizedLimit) || 0,
            limit: sanitizedLimit
        }
    };
}

export async function getUserById(id, tenantId) {
    const query = db('users').where({ id });
    if (tenantId) query.andWhere({ tenant_id: tenantId });
    return query.first();
}

export async function updateUser(id, tenantId, updates, actor) {
    const user = await db('users').where({ id, tenant_id: tenantId }).first();
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    const isSelf = actor.id === user.id;
    const isAdmin = [ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN].includes(actor.role);

    const payload = {};
    if (updates.fullName) payload.full_name = updates.fullName;

    if (updates.password) {
        payload.password_hash = await bcrypt.hash(updates.password, 10);
    }

    if (updates.role || typeof updates.isActive === 'boolean') {
        if (!isAdmin) {
            const err = new Error('Forbidden');
            err.status = 403;
            throw err;
        }
        if (updates.role) payload.role = updates.role;
        if (typeof updates.isActive === 'boolean') payload.is_active = updates.isActive;
    }

    if (!isAdmin && !isSelf) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    payload.updated_at = db.fn.now();
    const [updated] = await db('users').where({ id, tenant_id: tenantId }).update(payload).returning('*');
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'UPDATE_USER', entity_type: 'user', entity_id: id });
    return updated;
}

export async function deleteUser(id, tenantId, actor) {
    if (actor.id === id) {
        const err = new Error('Cannot delete own account');
        err.status = 403;
        throw err;
    }
    await db('users').where({ id, tenant_id: tenantId }).del();
    await logAction({ tenant_id: tenantId, user_id: actor ? .id || null, action: 'DELETE_USER', entity_type: 'user', entity_id: id });
}