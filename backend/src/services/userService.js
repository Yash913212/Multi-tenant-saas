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
    const [{ count }] = await db('users').where({ tenant_id: tenantId }).count('* as count');
    if (Number(count) >= tenant.max_users) {
        const err = new Error('User limit reached for current plan');
        err.status = 403;
        throw err;
    }
}

// Helper function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Helper function to validate password strength
function validatePassword(password) {
    if (password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
        throw new Error('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
        throw new Error('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
        throw new Error('Password must contain at least one number');
    }
}

export async function createUser(tenantId, { email, password, fullName, role = ROLES.USER }, actor) {
    // Validate inputs
    if (!email || !password || !fullName) {
        const err = new Error('Email, password, and full name are required');
        err.status = 400;
        throw err;
    }

    if (!isValidEmail(email)) {
        const err = new Error('Invalid email format');
        err.status = 400;
        throw err;
    }

    validatePassword(password);

    if (role && ![ROLES.USER, ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN].includes(role)) {
        const err = new Error('Invalid role specified');
        err.status = 400;
        throw err;
    }

    // Check if actor has permission to create this role
    if (actor ? .role !== ROLES.SUPER_ADMIN && role === ROLES.SUPER_ADMIN) {
        const err = new Error('Forbidden: Cannot create super admin user');
        err.status = 403;
        throw err;
    }

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
            email: email.toLowerCase().trim(),
            password_hash: await bcrypt.hash(password, 10),
            full_name: fullName.trim(),
            role,
            is_active: true
        })
        .returning(['id', 'email', 'full_name', 'role', 'tenant_id', 'is_active', 'created_at']);

    await logAction({
        tenant_id: tenantId,
        user_id: actor ? .id || null,
        action: 'CREATE_USER',
        entity_type: 'user',
        entity_id: inserted.id
    });

    return inserted;
}

export async function listUsers(tenantId, { search, role, page = 1, limit = 50 } = {}) {
    // Validate pagination parameters
    const sanitizedPage = Math.max(1, parseInt(page) || 1);
    const sanitizedLimit = Math.min(parseInt(limit) || 50, 100);
    const offset = (sanitizedPage - 1) * sanitizedLimit;

    const base = db('users').where({ tenant_id: tenantId });

    if (search) {
        const searchTerm = `%${search}%`;
        base.andWhere((qb) => {
            qb.whereILike('full_name', searchTerm).orWhereILike('email', searchTerm);
        });
    }

    if (role) {
        base.andWhere({ role });
    }

    const [{ count }] = await base.clone().count('* as count');

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
            currentPage: sanitizedPage,
            totalPages: Math.ceil((Number(count) || 0) / sanitizedLimit) || 0,
            limit: sanitizedLimit
        }
    };
}

export async function getUserById(id, tenantId) {
    const query = db('users').where({ id });
    if (tenantId) query.andWhere({ tenant_id: tenantId });

    const user = await query.first();

    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    return user;
}

export async function updateUser(id, tenantId, updates, actor) {
    const user = await db('users').where({ id, tenant_id: tenantId }).first();
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    const isSelf = actor ? .id === user.id;
    const isSuperAdmin = actor ? .role === ROLES.SUPER_ADMIN;
    const isTenantAdmin = actor ? .role === ROLES.TENANT_ADMIN;
    const isAdmin = isSuperAdmin || isTenantAdmin;

    const payload = {};

    // Validate full name
    if (updates.fullName) {
        if (typeof updates.fullName !== 'string' || updates.fullName.trim().length === 0) {
            const err = new Error('Full name must be a non-empty string');
            err.status = 400;
            throw err;
        }
        payload.full_name = updates.fullName.trim();
    }

    // Handle password update
    if (updates.password) {
        if (!isSelf && !isAdmin) {
            const err = new Error('Forbidden: Cannot change another user\'s password');
            err.status = 403;
            throw err;
        }
        validatePassword(updates.password);
        payload.password_hash = await bcrypt.hash(updates.password, 10);
    }

    // Handle role updates
    if (updates.role) {
        if (!isAdmin) {
            const err = new Error('Forbidden: Only admins can change user roles');
            err.status = 403;
            throw err;
        }

        // Validate role
        if (![ROLES.USER, ROLES.TENANT_ADMIN, ROLES.SUPER_ADMIN].includes(updates.role)) {
            const err = new Error('Invalid role specified');
            err.status = 400;
            throw err;
        }

        // Prevent non-super-admins from creating super admins
        if (!isSuperAdmin && updates.role === ROLES.SUPER_ADMIN) {
            const err = new Error('Forbidden: Cannot assign super admin role');
            err.status = 403;
            throw err;
        }

        // Prevent changing own role
        if (isSelf) {
            const err = new Error('Cannot change your own role');
            err.status = 403;
            throw err;
        }

        payload.role = updates.role;
    }

    // Handle isActive updates
    if (typeof updates.isActive === 'boolean') {
        if (!isAdmin) {
            const err = new Error('Forbidden: Only admins can change user active status');
            err.status = 403;
            throw err;
        }

        // Prevent deactivating own account
        if (isSelf && updates.isActive === false) {
            const err = new Error('Cannot deactivate your own account');
            err.status = 403;
            throw err;
        }

        payload.is_active = updates.isActive;
    }

    // Check general permissions
    if (!isAdmin && !isSelf) {
        const err = new Error('Forbidden');
        err.status = 403;
        throw err;
    }

    // If no updates, return the current user
    if (Object.keys(payload).length === 0) {
        return user;
    }

    payload.updated_at = db.fn.now();

    const [updated] = await db('users')
        .where({ id, tenant_id: tenantId })
        .update(payload)
        .returning(['id', 'email', 'full_name', 'role', 'is_active', 'created_at', 'updated_at']);

    await logAction({
        tenant_id: tenantId,
        user_id: actor ? .id || null,
        action: 'UPDATE_USER',
        entity_type: 'user',
        entity_id: id
    });

    return updated;
}

export async function deleteUser(id, tenantId, actor) {
    if (actor ? .id === id) {
        const err = new Error('Cannot delete own account');
        err.status = 403;
        throw err;
    }

    const user = await db('users').where({ id, tenant_id: tenantId }).first();
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }

    // Check if actor has permission to delete this user
    const isSuperAdmin = actor ? .role === ROLES.SUPER_ADMIN;
    const isTenantAdmin = actor ? .role === ROLES.TENANT_ADMIN;

    // Non-admin users cannot delete anyone
    if (!isSuperAdmin && !isTenantAdmin) {
        const err = new Error('Forbidden: Only admins can delete users');
        err.status = 403;
        throw err;
    }

    // Tenant admins cannot delete super admins
    if (isTenantAdmin && user.role === ROLES.SUPER_ADMIN) {
        const err = new Error('Forbidden: Cannot delete super admin user');
        err.status = 403;
        throw err;
    }

    // Tenant admins can only delete users in their own tenant
    if (isTenantAdmin && user.tenant_id !== tenantId) {
        const err = new Error('Forbidden: Cannot delete user from another tenant');
        err.status = 403;
        throw err;
    }

    await db('users').where({ id, tenant_id: tenantId }).del();

    await logAction({
        tenant_id: tenantId,
        user_id: actor ? .id || null,
        action: 'DELETE_USER',
        entity_type: 'user',
        entity_id: id
    });

    return { success: true, message: 'User deleted successfully' };
}