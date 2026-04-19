/**
 * User Routes
 * 
 * All routes require authentication.
 * Admin-only routes are additionally guarded by RBAC middleware.
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/rbac');

// All user routes require authentication
router.use(authenticate);

// Get users by role (must come before /:id to avoid conflict)
router.get('/role/:roleName', (req, res) => userController.getUsersByRole(req, res));

// Get all users (Admin only)
router.get('/', authorize('admin'), (req, res) => userController.getAllUsers(req, res));

// Get user by ID
router.get('/:id', (req, res) => userController.getUserById(req, res));

// Update user role (Admin only)
router.patch('/:id/role', authorize('admin'), (req, res) => userController.updateUserRole(req, res));

// Delete user (Admin only)
router.delete('/:id', authorize('admin'), (req, res) => userController.deleteUser(req, res));

module.exports = router;
