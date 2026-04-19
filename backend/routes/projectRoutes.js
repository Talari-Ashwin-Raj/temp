/**
 * Project Routes
 * 
 * All routes require authentication.
 * Project creation restricted to Admin/Manager via RBAC.
 * Project deletion restricted to Admin only.
 */

const express = require('express');
const router = express.Router();
const projectController = require('../controllers/ProjectController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All project routes require authentication
router.use(authenticate);

// List projects (filtered by role in service layer)
router.get('/', (req, res) => projectController.getProjects(req, res));

// Create project (Admin or Manager)
router.post('/', authorize('admin', 'manager'), (req, res) => projectController.createProject(req, res));

// Get project details
router.get('/:id', (req, res) => projectController.getProjectById(req, res));

// Update project
router.put('/:id', authorize('admin', 'manager'), (req, res) => projectController.updateProject(req, res));

// Delete project (Admin only)
router.delete('/:id', authorize('admin'), (req, res) => projectController.deleteProject(req, res));

// Member management
router.get('/:id/members', (req, res) => projectController.getMembers(req, res));
router.post('/:id/members', authorize('admin', 'manager'), (req, res) => projectController.addMember(req, res));
router.delete('/:id/members/:userId', authorize('admin', 'manager'), (req, res) => projectController.removeMember(req, res));

module.exports = router;
