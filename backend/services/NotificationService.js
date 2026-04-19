/**
 * NotificationService
 * 
 * Design Pattern: SERVICE LAYER — business logic for notifications.
 */

const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationService {
    #notificationRepository;

    constructor() {
        this.#notificationRepository = new NotificationRepository();
    }

    async getNotifications(requestingUser) {
        const notifications = await this.#notificationRepository.findAllByUserId(requestingUser.id, false);
        const unreadCountArray = await this.#notificationRepository.findAllByUserId(requestingUser.id, true);

        return { notifications, unreadCount: unreadCountArray.length };
    }

    async getUnreadNotifications(requestingUser) {
        return await this.#notificationRepository.findAllByUserId(requestingUser.id, true);
    }

    async markAsRead(notificationId, requestingUser) {
        // Find to ensure it belongs to the user
        const notification = await this.#notificationRepository.findById(notificationId);
        if (!notification || notification.user_id !== requestingUser.id) {
            throw new Error('Notification not found or access denied');
        }

        await this.#notificationRepository.markAsRead(notificationId);
        return { message: 'Notification marked as read' };
    }

    async markAllAsRead(requestingUser) {
        await this.#notificationRepository.markAllAsRead(requestingUser.id);
        return { message: 'All unread notifications marked as read' };
    }
}

module.exports = NotificationService;
