/**
 * Notification Routes
 * 
 * All routes require authentication.
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/NotificationController');
const authenticate = require('../middleware/auth');

// All notification routes require authentication
router.use(authenticate);

router.get('/', (req, res) => notificationController.getNotifications(req, res));
router.get('/unread', (req, res) => notificationController.getUnreadNotifications(req, res));
router.patch('/read-all', (req, res) => notificationController.markAllAsRead(req, res));
router.patch('/:id/read', (req, res) => notificationController.markAsRead(req, res));

module.exports = router;
