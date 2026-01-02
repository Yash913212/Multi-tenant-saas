import { listTenants, getTenantByIdWithStats, updateTenant } from '../services/tenantService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const listTenantsHandler = async(req, res) => {
    const result = await listTenants({
        page: req.query.page,
        limit: req.query.limit,
        status: req.query.status,
        subscriptionPlan: req.query.subscriptionPlan
    });
    return successResponse(res, 'Tenants fetched', result);
};

export const getTenantHandler = async(req, res) => {
    const tenantId = req.params.tenantId || req.params.id;
    const tenant = await getTenantByIdWithStats(tenantId);
    if (!tenant) return errorResponse(res, 'Tenant not found', 404);

    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.tenant_id !== tenant.id) {
        return errorResponse(res, 'Unauthorized access', 403);
    }

    return successResponse(res, 'Tenant fetched', tenant);
};

export const updateTenantHandler = async(req, res) => {
    try {
        const tenantId = req.params.tenantId || req.params.id;
        if (req.user.role !== ROLES.SUPER_ADMIN && req.user.tenant_id !== tenantId) {
            return errorResponse(res, 'Unauthorized access', 403);
        }
        const tenant = await updateTenant(tenantId, req.body, req.user);
        return successResponse(res, 'Tenant updated successfully', tenant);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};