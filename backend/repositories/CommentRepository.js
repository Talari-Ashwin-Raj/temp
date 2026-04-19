/**
 * CommentRepository
 * 
 * Design Pattern: REPOSITORY — abstracts data access for the comments table.
 * Inherits generic CRUD from BaseRepository.
 */

const BaseRepository = require('./BaseRepository');

class CommentRepository extends BaseRepository {
    constructor() {
        super('comments');
    }

    /**
     * Create a new comment on a task.
     * @param {Object} data
     * @param {number} data.taskId
     * @param {number} data.userId
     * @param {string} data.message
     * @returns {Object}
     */
    create({ taskId, userId, message }) {
        const stmt = this.db.prepare(
            `INSERT INTO comments (task_id, user_id, message) VALUES (?, ?, ?)`
        );
        const result = stmt.run(taskId, userId, message);
        return this.findByIdWithUser(result.lastInsertRowid);
    }

    /**
     * Find all comments for a task, with author info.
     * @param {number} taskId
     * @returns {Object[]}
     */
    findByTask(taskId) {
        const stmt = this.db.prepare(`
            SELECT c.*, u.username as author_name, r.role_name as author_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE c.task_id = ?
            ORDER BY c.created_at ASC
        `);
        return stmt.all(taskId);
    }

    /**
     * Find a single comment by ID with user info.
     * @param {number} id
     * @returns {Object|undefined}
     */
    findByIdWithUser(id) {
        const stmt = this.db.prepare(`
            SELECT c.*, u.username as author_name, r.role_name as author_role
            FROM comments c
            JOIN users u ON c.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE c.id = ?
        `);
        return stmt.get(id);
    }

    /**
     * Count comments for a task.
     * @param {number} taskId
     * @returns {number}
     */
    countByTask(taskId) {
        const stmt = this.db.prepare(
            'SELECT COUNT(*) as total FROM comments WHERE task_id = ?'
        );
        return stmt.get(taskId).total;
    }
}

module.exports = CommentRepository;
