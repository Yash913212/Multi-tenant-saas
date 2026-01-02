import { registerTenant, login, getCurrentUser, logout } from '../services/authService.js';
import db from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const registerTenantHandler = async(req, res) => {
    try {
        const { tenantName, subdomain, adminEmail, adminPassword, adminFullName } = req.body;
        if (!tenantName || !subdomain || !adminEmail || !adminPassword || !adminFullName) {
            return errorResponse(res, 'Missing required fields', 400);
        }
        const result = await registerTenant({ tenantName, subdomain, adminEmail, adminPassword, adminFullName }, req.ip);
        return successResponse(res, 'Tenant registered successfully', result, 201);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const loginHandler = async(req, res) => {
    try {
        const { email, password, tenantSubdomain, tenantId } = req.body;
        if (!email || !password) return errorResponse(res, 'Email and password required', 400);
        const result = await login({ email, password, tenantSubdomain, tenantId });
        return successResponse(res, 'Login successful', {
            user: result.user,
            token: result.token,
            expiresIn: result.expiresIn
        });
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const meHandler = async(req, res) => {
    const data = await getCurrentUser(req.user.id);
    if (!data) return errorResponse(res, 'User not found', 404);
    const { user, tenant } = data;
    return successResponse(res, 'User fetched', {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        isActive: user.is_active,
        tenant: tenant ? {
            id: tenant.id,
            name: tenant.name,
            subdomain: tenant.subdomain,
            subscriptionPlan: tenant.subscription_plan,
            maxUsers: tenant.max_users,
            maxProjects: tenant.max_projects
        } : null
    });
};

export const logoutHandler = async(req, res) => {
    await logout(req.user);
    return successResponse(res, 'Logged out successfully');
};

export const healthHandler = async(_req, res) => {
    try {
        await db.raw('SELECT 1');
        return res.status(200).json({ status: 'ok', database: 'connected' });
    } catch (err) {
        return res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
};