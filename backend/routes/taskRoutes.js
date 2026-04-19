/**
 * Task Routes
 * 
 * All routes require authentication.
 * Task creation restricted to Admin/Manager.
 * Status updates allowed for Admin/Manager/Member.
 */

const express = require('express');
const router = express.Router();
const taskController = require('../controllers/TaskController');
const commentController = require('../controllers/CommentController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All task routes require authentication
router.use(authenticate);

// Dashboard stats (must come before /:id)
router.get('/dashboard/stats', (req, res) => taskController.getDashboardStats(req, res));

// My tasks (must come before /:id)
router.get('/my', (req, res) => taskController.getMyTasks(req, res));

// Tasks by project (must come before /:id)
router.get('/project/:projectId', (req, res) => taskController.getTasksByProject(req, res));

// Create task (Admin or Manager)
router.post('/', authorize('admin', 'manager'), (req, res) => taskController.createTask(req, res));

// Get task by ID
router.get('/:id', (req, res) => taskController.getTaskById(req, res));

// Update task (Admin or Manager)
router.put('/:id', authorize('admin', 'manager'), (req, res) => taskController.updateTask(req, res));

// Update task status (all roles can update status — service layer checks ownership)
router.patch('/:id/status', (req, res) => taskController.updateTaskStatus(req, res));

// Delete task (Admin or Manager)
router.delete('/:id', authorize('admin', 'manager'), (req, res) => taskController.deleteTask(req, res));

// Comment routes nested under tasks
router.get('/:taskId/comments', (req, res) => commentController.getCommentsByTask(req, res));
router.post('/:taskId/comments', (req, res) => commentController.addComment(req, res));

module.exports = router;
