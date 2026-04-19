/**
 * Task Controller
 * 
 * Controller Layer — handles HTTP requests for task management.
 */

const TaskService = require('../services/TaskService');

const taskService = new TaskService();

class TaskController {
    async createTask(req, res) {
        try {
            const task = await taskService.createTask(req.body, req.user);

            res.status(201).json({
                success: true,
                message: 'Task created successfully',
                data: task,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async getMyTasks(req, res) {
        try {
            const tasks = await taskService.getMyTasks(req.user);
            res.status(200).json({
                success: true,
                data: tasks,
                count: tasks.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async getTasksByProject(req, res) {
        try {
            const tasks = await taskService.getTasksByProject(
                parseInt(req.params.projectId),
                req.user
            );
            res.status(200).json({
                success: true,
                data: tasks,
                count: tasks.length,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async getTaskById(req, res) {
        try {
            const task = await taskService.getTaskById(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                data: task,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async updateTask(req, res) {
        try {
            const task = await taskService.updateTask(
                parseInt(req.params.id),
                req.body,
                req.user
            );
            res.status(200).json({
                success: true,
                message: 'Task updated successfully',
                data: task,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            const task = await taskService.updateTaskStatus(
                parseInt(req.params.id),
                status,
                req.user
            );
            res.status(200).json({
                success: true,
                message: `Task status updated to '${status}'`,
                data: task,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404
                         : err.message.includes('denied') ? 403
                         : err.message.includes('Cannot transition') ? 422 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async deleteTask(req, res) {
        try {
            const result = await taskService.deleteTask(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async getDashboardStats(req, res) {
        try {
            const stats = await taskService.getDashboardStats(req.user);
            res.status(200).json({
                success: true,
                data: stats,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new TaskController();
