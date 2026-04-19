/**
 * Notification Controller
 * 
 * Controller Layer — handles HTTP requests for notifications.
 * 
 * Endpoints:
 *   GET   /api/notifications          — Get all notifications for current user
 *   GET   /api/notifications/unread   — Get unread notifications
 *   PATCH /api/notifications/:id/read — Mark notification as read
 *   PATCH /api/notifications/read-all — Mark all as read
 */

const NotificationService = require('../services/NotificationService');

const notificationService = new NotificationService();

class NotificationController {
    /**
     * GET /api/notifications
     */
    getNotifications(req, res) {
        try {
            const data = notificationService.getNotifications(req.user);
            res.status(200).json({
                success: true,
                data,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * GET /api/notifications/unread
     */
    getUnreadNotifications(req, res) {
        try {
            const notifications = notificationService.getUnreadNotifications(req.user);
            res.status(200).json({
                success: true,
                data: notifications,
                count: notifications.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * PATCH /api/notifications/:id/read
     */
    markAsRead(req, res) {
        try {
            const result = notificationService.markAsRead(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * PATCH /api/notifications/read-all
     */
    markAllAsRead(req, res) {
        try {
            const result = notificationService.markAllAsRead(req.user);
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }
}

module.exports = new NotificationController();
