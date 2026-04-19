/**
 * TaskRepository
 * 
 * Design Pattern: REPOSITORY — abstracts data access for the tasks table.
 * Inherits generic CRUD from BaseRepository.
 */

const BaseRepository = require('./BaseRepository');

class TaskRepository extends BaseRepository {
    constructor() {
        super('tasks');
    }

    /**
     * Create a new task.
     * @param {Object} data
     * @returns {Object}
     */
    create({ projectId, title, description, status, deadline, assignedTo, createdBy }) {
        const stmt = this.db.prepare(
            `INSERT INTO tasks (project_id, title, description, status, deadline, assigned_to, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        const result = stmt.run(
            projectId, title, description, status || 'todo', deadline, assignedTo, createdBy
        );
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Update task details.
     * @param {number} id
     * @param {Object} data
     * @returns {Object}
     */
    update(id, { title, description, deadline, assignedTo }) {
        const stmt = this.db.prepare(
            `UPDATE tasks SET 
             title = COALESCE(?, title),
             description = COALESCE(?, description),
             deadline = COALESCE(?, deadline),
             assigned_to = COALESCE(?, assigned_to),
             updated_at = CURRENT_TIMESTAMP
             WHERE id = ?`
        );
        stmt.run(title, description, deadline, assignedTo, id);
        return this.findById(id);
    }

    /**
     * Update only the task status.
     * @param {number} id
     * @param {string} status
     * @returns {{ changes: number }}
     */
    updateStatus(id, status) {
        const stmt = this.db.prepare(
            `UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
        );
        return stmt.run(status, id);
    }

    /**
     * Find all tasks for a project.
     * @param {number} projectId
     * @returns {Object[]}
     */
    findByProject(projectId) {
        const stmt = this.db.prepare(
            `SELECT t.*, u.username as assigned_to_name
             FROM tasks t
             LEFT JOIN users u ON t.assigned_to = u.id
             WHERE t.project_id = ?
             ORDER BY t.created_at DESC`
        );
        return stmt.all(projectId);
    }

    /**
     * Find all tasks assigned to a specific user.
     * @param {number} userId
     * @returns {Object[]}
     */
    findByAssignee(userId) {
        const stmt = this.db.prepare(
            `SELECT t.*, p.title as project_title
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             WHERE t.assigned_to = ?
             ORDER BY t.deadline ASC`
        );
        return stmt.all(userId);
    }

    /**
     * Find a task by ID with full details (assignee, project, creator).
     * @param {number} id
     * @returns {Object|undefined}
     */
    findByIdWithDetails(id) {
        const stmt = this.db.prepare(
            `SELECT t.*, 
                    p.title as project_title,
                    u1.username as assigned_to_name,
                    u2.username as created_by_name
             FROM tasks t
             JOIN projects p ON t.project_id = p.id
             LEFT JOIN users u1 ON t.assigned_to = u1.id
             LEFT JOIN users u2 ON t.created_by = u2.id
             WHERE t.id = ?`
        );
        return stmt.get(id);
    }

    /**
     * Get task statistics for a project.
     * @param {number} projectId
     * @returns {Object} { todo, in_progress, done, total }
     */
    getStatsByProject(projectId) {
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
            FROM tasks WHERE project_id = ?
        `);
        return stmt.get(projectId);
    }

    /**
     * Get overall task statistics (for dashboard).
     * @returns {Object}
     */
    getOverallStats() {
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done,
                SUM(CASE WHEN deadline < date('now') AND status != 'done' THEN 1 ELSE 0 END) as overdue
            FROM tasks
        `);
        return stmt.get();
    }

    /**
     * Get task stats for a specific user.
     * @param {number} userId
     * @returns {Object}
     */
    getStatsByUser(userId) {
        const stmt = this.db.prepare(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done
            FROM tasks WHERE assigned_to = ?
        `);
        return stmt.get(userId);
    }
}

module.exports = TaskRepository;
