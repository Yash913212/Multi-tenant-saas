import { createUser, listUsers, getUserById, updateUser, deleteUser } from '../services/userService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const createUserHandler = async(req, res) => {
    try {
        const tenantId = req.params.tenantId || req.user.tenant_id;
        if (req.user.role !== ROLES.TENANT_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return errorResponse(res, 'Forbidden', 403);
        }
        if (!req.body.email || !req.body.password || !req.body.fullName) {
            return errorResponse(res, 'Missing required fields', 400);
        }
        const user = await createUser(tenantId, {
            email: req.body.email,
            password: req.body.password,
            fullName: req.body.fullName,
            role: req.body.role || ROLES.USER
        }, req.user);
        return successResponse(res, 'User created successfully', user, 201);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const listUsersHandler = async(req, res) => {
    const tenantId = req.params.tenantId || req.user.tenant_id;
    if (req.user.role !== ROLES.SUPER_ADMIN && req.user.tenant_id !== tenantId) {
        return errorResponse(res, 'Unauthorized access', 403);
    }
    const result = await listUsers(tenantId, {
        search: req.query.search,
        role: req.query.role,
        page: req.query.page,
        limit: req.query.limit
    });
    return successResponse(res, 'Users fetched', result);
};

export const getUserHandler = async(req, res) => {
    const tenantId = req.user.role === ROLES.SUPER_ADMIN ? req.query.tenant_id : req.user.tenant_id;
    const user = await getUserById(req.params.id, tenantId);
    if (!user) return errorResponse(res, 'User not found', 404);
    return successResponse(res, 'User fetched', user);
};

export const updateUserHandler = async(req, res) => {
    try {
        const tenantId = req.user.role === ROLES.SUPER_ADMIN ? req.body.tenant_id || req.query.tenant_id : req.user.tenant_id;
        const user = await updateUser(req.params.id, tenantId, req.body, req.user);
        return successResponse(res, 'User updated successfully', user);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const deleteUserHandler = async(req, res) => {
    try {
        if (req.user.role !== ROLES.TENANT_ADMIN && req.user.role !== ROLES.SUPER_ADMIN) {
            return errorResponse(res, 'Forbidden', 403);
        }
        const tenantId = req.user.role === ROLES.SUPER_ADMIN ? req.body.tenant_id || req.query.tenant_id : req.user.tenant_id;
        await deleteUser(req.params.id, tenantId, req.user);
        return successResponse(res, 'User deleted successfully');
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};