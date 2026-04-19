/**
 * Notification Controller
 */

const NotificationService = require('../services/NotificationService');

const notificationService = new NotificationService();

class NotificationController {
    async getNotifications(req, res) {
        try {
            const data = await notificationService.getNotifications(req.user);
            res.status(200).json({
                success: true,
                ...data,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async getUnreadNotifications(req, res) {
        try {
            const notifications = await notificationService.getUnreadNotifications(req.user);
            res.status(200).json({
                success: true,
                data: notifications,
                count: notifications.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async markAsRead(req, res) {
        try {
            const result = await notificationService.markAsRead(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async markAllAsRead(req, res) {
        try {
            const result = await notificationService.markAllAsRead(req.user);
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
