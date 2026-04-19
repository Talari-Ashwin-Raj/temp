/**
 * NotificationService
 * 
 * Design Pattern: SERVICE LAYER — business logic for notifications.
 * 
 * Maps to sequenceDiagram → "Asynchronous Notification: API → Member"
 */

const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationService {
    #notificationRepository;

    constructor() {
        this.#notificationRepository = new NotificationRepository();
    }

    /**
     * Get all notifications for the current user.
     * @param {User} requestingUser
     * @returns {Object}
     */
    getNotifications(requestingUser) {
        const notifications = this.#notificationRepository.findByUser(requestingUser.id);
        const unreadCount = this.#notificationRepository.countUnread(requestingUser.id);

        return { notifications, unreadCount };
    }

    /**
     * Get only unread notifications.
     * @param {User} requestingUser
     * @returns {Object[]}
     */
    getUnreadNotifications(requestingUser) {
        return this.#notificationRepository.findUnreadByUser(requestingUser.id);
    }

    /**
     * Mark a specific notification as read.
     * @param {number} notificationId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    markAsRead(notificationId, requestingUser) {
        const result = this.#notificationRepository.markAsRead(notificationId, requestingUser.id);
        if (result.changes === 0) {
            throw new Error('Notification not found or already read');
        }
        return { message: 'Notification marked as read' };
    }

    /**
     * Mark all notifications as read for the current user.
     * @param {User} requestingUser
     * @returns {{ message: string, count: number }}
     */
    markAllAsRead(requestingUser) {
        const result = this.#notificationRepository.markAllAsRead(requestingUser.id);
        return { message: 'All notifications marked as read', count: result.changes };
    }
}

module.exports = NotificationService;
