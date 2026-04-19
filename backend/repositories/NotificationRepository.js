/**
 * NotificationRepository
 * 
 * Design Pattern: REPOSITORY — abstracts data access for the notifications table.
 * Supports the async notification flow from the Sequence Diagram.
 */

const BaseRepository = require('./BaseRepository');

class NotificationRepository extends BaseRepository {
    constructor() {
        super('notifications');
    }

    /**
     * Create a notification.
     * @param {Object} data
     * @param {number} data.userId   - recipient
     * @param {string} data.message
     * @param {string} data.type     - e.g. 'task_assigned', 'comment_added'
     * @param {number} [data.referenceId] - related entity ID
     * @returns {Object}
     */
    create({ userId, message, type, referenceId }) {
        const stmt = this.db.prepare(
            `INSERT INTO notifications (user_id, message, type, reference_id)
             VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(userId, message, type || 'task_assigned', referenceId || null);
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Find all notifications for a user (newest first).
     * @param {number} userId
     * @returns {Object[]}
     */
    findByUser(userId) {
        const stmt = this.db.prepare(
            `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
        );
        return stmt.all(userId);
    }

    /**
     * Find unread notifications for a user.
     * @param {number} userId
     * @returns {Object[]}
     */
    findUnreadByUser(userId) {
        const stmt = this.db.prepare(
            `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`
        );
        return stmt.all(userId);
    }

    /**
     * Mark a notification as read.
     * @param {number} id
     * @param {number} userId - ensures the user owns this notification
     * @returns {{ changes: number }}
     */
    markAsRead(id, userId) {
        const stmt = this.db.prepare(
            `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`
        );
        return stmt.run(id, userId);
    }

    /**
     * Mark all notifications as read for a user.
     * @param {number} userId
     * @returns {{ changes: number }}
     */
    markAllAsRead(userId) {
        const stmt = this.db.prepare(
            `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`
        );
        return stmt.run(userId);
    }

    /**
     * Count unread notifications.
     * @param {number} userId
     * @returns {number}
     */
    countUnread(userId) {
        const stmt = this.db.prepare(
            `SELECT COUNT(*) as total FROM notifications WHERE user_id = ? AND is_read = 0`
        );
        return stmt.get(userId).total;
    }
}

module.exports = NotificationRepository;
