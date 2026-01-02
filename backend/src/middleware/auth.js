import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return errorResponse(res, 'Unauthorized', 401);
    }

    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_jwt_secret');
        req.user = decoded;
        next();
    } catch (err) {
        return errorResponse(res, 'Invalid or expired token', 401);
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return errorResponse(res, 'Forbidden', 403);
    }
    next();
};

export const enforceTenantAccess = (req, res, next) => {
    if (req.user.role === ROLES.SUPER_ADMIN) {
        return next();
    }

    const tenantId = req.user.tenant_id;
    const paramTenantId = req.params.tenantId || req.body.tenant_id || req.query.tenant_id;
    if (paramTenantId && paramTenantId !== tenantId) {
        return errorResponse(res, 'Cross-tenant access is not allowed', 403);
    }

    req.tenantId = tenantId;
    next();
};