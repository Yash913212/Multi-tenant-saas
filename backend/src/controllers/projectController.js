import { createProject, listProjects, getProjectById, updateProject, deleteProject } from '../services/projectService.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { ROLES } from '../utils/constants.js';

export const createProjectHandler = async(req, res) => {
    try {
        if (![ROLES.SUPER_ADMIN, ROLES.TENANT_ADMIN].includes(req.user.role)) {
            return errorResponse(res, 'Forbidden', 403);
        }
        if (!req.body.name) return errorResponse(res, 'Name is required', 400);
        const tenantId = req.user.tenant_id;
        const payload = {
            name: req.body.name,
            description: req.body.description,
            status: req.body.status || 'active',
            created_by: req.user.id
        };
        const project = await createProject(tenantId, payload, req.user);
        return successResponse(res, 'Project created successfully', project, 201);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const listProjectsHandler = async(req, res) => {
    const result = await listProjects(req.user.tenant_id, {
        status: req.query.status,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
    });
    return successResponse(res, 'Projects fetched', result);
};

export const getProjectHandler = async(req, res) => {
    const project = await getProjectById(req.params.id, req.user.tenant_id);
    if (!project) return errorResponse(res, 'Project not found', 404);
    return successResponse(res, 'Project fetched', project);
};

export const updateProjectHandler = async(req, res) => {
    try {
        const project = await updateProject(req.params.id, req.user.tenant_id, req.body, req.user);
        return successResponse(res, 'Project updated successfully', project);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const deleteProjectHandler = async(req, res) => {
    try {
        await deleteProject(req.params.id, req.user.tenant_id, req.user);
        return successResponse(res, 'Project deleted successfully');
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};