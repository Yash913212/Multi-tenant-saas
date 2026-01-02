import { createTask, listTasks, updateTask, deleteTask, updateTaskStatus, getTaskById } from '../services/taskService.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const createTaskHandler = async(req, res) => {
    try {
        if (!req.body.title) return errorResponse(res, 'Title is required', 400);
        const task = await createTask(req.user.tenant_id, req.params.projectId, req.body, req.user);
        return successResponse(res, 'Task created', task, 201);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const listTasksHandler = async(req, res) => {
    const tasks = await listTasks(req.user.tenant_id, req.params.projectId, {
        status: req.query.status,
        assignedTo: req.query.assignedTo,
        priority: req.query.priority,
        search: req.query.search,
        page: req.query.page,
        limit: req.query.limit
    });
    return successResponse(res, 'Tasks fetched', tasks);
};

export const updateTaskHandler = async(req, res) => {
    try {
        const id = req.params.id || req.params.taskId;
        const task = await updateTask(id, req.user.tenant_id, req.body, req.user);
        return successResponse(res, 'Task updated successfully', task);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const updateTaskStatusHandler = async(req, res) => {
    try {
        const task = await updateTaskStatus(req.params.taskId, req.user.tenant_id, req.body.status, req.user);
        return successResponse(res, 'Task status updated', task);
    } catch (err) {
        return errorResponse(res, err.message, err.status || 400);
    }
};

export const getTaskHandler = async(req, res) => {
    const task = await getTaskById(req.params.taskId, req.user.tenant_id);
    if (!task) return errorResponse(res, 'Task not found', 404);
    return successResponse(res, 'Task fetched', task);
};

export const deleteTaskHandler = async(req, res) => {
    if (!['tenant_admin', 'super_admin'].includes(req.user.role)) {
        return errorResponse(res, 'Forbidden', 403);
    }
    await deleteTask(req.params.id || req.params.taskId, req.user.tenant_id, req.user);
    return successResponse(res, 'Task deleted');
};