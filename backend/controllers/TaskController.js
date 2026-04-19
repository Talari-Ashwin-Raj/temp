/**
 * Task Controller
 * 
 * Controller Layer — handles HTTP requests for task management.
 * Delegates business logic to TaskService.
 * 
 * Implements the Sequence Diagram flow:
 *   POST /api/tasks → Validate JWT → Validate Permissions → INSERT → 201 → Notification
 * 
 * Endpoints:
 *   POST   /api/tasks                  — Create task
 *   GET    /api/tasks/my               — Get tasks assigned to me
 *   GET    /api/tasks/project/:projectId — Get tasks by project
 *   GET    /api/tasks/:id              — Get task details
 *   PUT    /api/tasks/:id              — Update task
 *   PATCH  /api/tasks/:id/status       — Update task status
 *   DELETE /api/tasks/:id              — Delete task
 *   GET    /api/tasks/dashboard/stats  — Get dashboard statistics
 */

const TaskService = require('../services/TaskService');

const taskService = new TaskService();

class TaskController {
    /**
     * POST /api/tasks
     * Maps to sequenceDiagram step 3: App → API: POST /api/tasks (JWT Token)
     */
    createTask(req, res) {
        try {
            const task = taskService.createTask(req.body, req.user);

            // Maps to sequenceDiagram step 8: API → App: 201 Created (Success)
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

    /**
     * GET /api/tasks/my
     */
    getMyTasks(req, res) {
        try {
            const tasks = taskService.getMyTasks(req.user);
            res.status(200).json({
                success: true,
                data: tasks,
                count: tasks.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * GET /api/tasks/project/:projectId
     */
    getTasksByProject(req, res) {
        try {
            const tasks = taskService.getTasksByProject(
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

    /**
     * GET /api/tasks/:id
     */
    getTaskById(req, res) {
        try {
            const task = taskService.getTaskById(
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

    /**
     * PUT /api/tasks/:id
     */
    updateTask(req, res) {
        try {
            const task = taskService.updateTask(
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

    /**
     * PATCH /api/tasks/:id/status
     * Maps to useCaseDiagram UC7: Update Task Status
     */
    updateTaskStatus(req, res) {
        try {
            const { status } = req.body;
            const task = taskService.updateTaskStatus(
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

    /**
     * DELETE /api/tasks/:id
     */
    deleteTask(req, res) {
        try {
            const result = taskService.deleteTask(
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

    /**
     * GET /api/tasks/dashboard/stats
     * Maps to useCaseDiagram UC9: View Dashboard
     */
    getDashboardStats(req, res) {
        try {
            const stats = taskService.getDashboardStats(req.user);
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
