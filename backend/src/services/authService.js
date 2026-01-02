import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import { PLAN_LIMITS, ROLES } from '../utils/constants.js';
import { logAction } from './auditService.js';

const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET || 'dev_jwt_secret', { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

export async function registerTenant({ tenantName, subdomain, adminEmail, adminPassword, adminFullName }, ipAddress) {
    return await db.transaction(async(trx) => {
        const existingSubdomain = await trx('tenants').where({ subdomain }).first();
        if (existingSubdomain) {
            const err = new Error('Subdomain already exists');
            err.status = 409;
            throw err;
        }

        const plan = 'free';
        const [tenant] = await trx('tenants')
            .insert({
                name: tenantName,
                subdomain,
                subscription_plan: plan,
                max_users: PLAN_LIMITS[plan].max_users,
                max_projects: PLAN_LIMITS[plan].max_projects
            })
            .returning(['id', 'subdomain']);

        const existingEmail = await trx('users').where({ tenant_id: tenant.id, email: adminEmail }).first();
        if (existingEmail) {
            const err = new Error('Email already exists for this tenant');
            err.status = 409;
            throw err;
        }

        const [admin] = await trx('users')
            .insert({
                tenant_id: tenant.id,
                email: adminEmail,
                password_hash: await bcrypt.hash(adminPassword, 10),
                full_name: adminFullName,
                role: ROLES.TENANT_ADMIN
            })
            .returning(['id', 'email', 'full_name', 'role']);

        await logAction({ tenant_id: tenant.id, user_id: admin.id, action: 'CREATE_TENANT', entity_type: 'tenant', entity_id: tenant.id, ip_address: ipAddress });

        return {
            tenantId: tenant.id,
            subdomain: tenant.subdomain,
            adminUser: {
                id: admin.id,
                email: admin.email,
                fullName: admin.full_name,
                role: admin.role
            }
        };
    });
}

export async function login({ email, password, tenantSubdomain, tenantId }) {
    const tenantClause = tenantId ? { id: tenantId } : tenantSubdomain ? { subdomain: tenantSubdomain } : null;
    let tenant = null;

    if (tenantClause) {
        tenant = await db('tenants').where(tenantClause).first();
        if (!tenant) {
            const err = new Error('Tenant not found');
            err.status = 404;
            throw err;
        }
        if (tenant.status === 'suspended') {
            const err = new Error('Account suspended');
            err.status = 403;
            throw err;
        }
    }

    const user = await db('users').where({ email }).first();
    if (!user) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        throw err;
    }

    if (user.role !== ROLES.SUPER_ADMIN) {
        if (!tenant) {
            const err = new Error('Tenant context required');
            err.status = 400;
            throw err;
        }
        if (user.tenant_id !== tenant.id) {
            const err = new Error('Invalid credentials');
            err.status = 401;
            throw err;
        }
    } else {
        tenant = tenant || null;
    }

    if (!user.is_active) {
        const err = new Error('Account inactive');
        err.status = 403;
        throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        const err = new Error('Invalid credentials');
        err.status = 401;
        throw err;
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role, tenant_id: user.tenant_id });
    return {
        token,
        expiresIn: 60 * 60 * 24,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            role: user.role,
            tenantId: user.tenant_id
        },
        tenant
    };
}

export async function getCurrentUser(userId) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) return null;
    const tenant = user.tenant_id ? await db('tenants').where({ id: user.tenant_id }).first() : null;
    return { user, tenant };
}

export async function logout(user) {
    await logAction({ tenant_id: user.tenant_id || null, user_id: user.id, action: 'LOGOUT', entity_type: 'user', entity_id: user.id });
    return true;
}