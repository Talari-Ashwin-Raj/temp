/**
 * ProjectRepository
 * 
 * Design Pattern: REPOSITORY — abstracts data access for projects and project_members.
 * Inherits generic CRUD from BaseRepository.
 */

const BaseRepository = require('./BaseRepository');

class ProjectRepository extends BaseRepository {
    constructor() {
        super('projects');
    }

    /**
     * Create a new project.
     * @param {Object} data
     * @param {string} data.title
     * @param {string} data.description
     * @param {number} data.managerId
     * @returns {Object}
     */
    create({ title, description, managerId }) {
        const stmt = this.db.prepare(
            `INSERT INTO projects (title, description, manager_id) VALUES (?, ?, ?)`
        );
        const result = stmt.run(title, description, managerId);
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Update project details.
     * @param {number} id
     * @param {Object} data
     * @returns {Object}
     */
    update(id, { title, description, managerId }) {
        const stmt = this.db.prepare(
            `UPDATE projects SET title = COALESCE(?, title), 
             description = COALESCE(?, description), 
             manager_id = COALESCE(?, manager_id) 
             WHERE id = ?`
        );
        stmt.run(title, description, managerId, id);
        return this.findById(id);
    }

    /**
     * Get projects managed by a specific user.
     * @param {number} managerId
     * @returns {Object[]}
     */
    findByManager(managerId) {
        const stmt = this.db.prepare('SELECT * FROM projects WHERE manager_id = ?');
        return stmt.all(managerId);
    }

    /**
     * Get all projects a user is a member of (or manages).
     * @param {number} userId
     * @returns {Object[]}
     */
    findByUser(userId) {
        const stmt = this.db.prepare(`
            SELECT DISTINCT p.* FROM projects p
            LEFT JOIN project_members pm ON p.id = pm.project_id
            WHERE p.manager_id = ? OR pm.user_id = ?
            ORDER BY p.id DESC
        `);
        return stmt.all(userId, userId);
    }

    /**
     * Get a project with its manager info.
     * @param {number} id
     * @returns {Object|undefined}
     */
    findByIdWithManager(id) {
        const stmt = this.db.prepare(`
            SELECT p.*, u.username as manager_name, u.email as manager_email
            FROM projects p
            LEFT JOIN users u ON p.manager_id = u.id
            WHERE p.id = ?
        `);
        return stmt.get(id);
    }

    // ── Member management ──────────────────────────────────────

    /**
     * Add a user to a project.
     * @param {number} projectId
     * @param {number} userId
     * @returns {Object}
     */
    addMember(projectId, userId) {
        const stmt = this.db.prepare(
            `INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)`
        );
        return stmt.run(projectId, userId);
    }

    /**
     * Remove a user from a project.
     * @param {number} projectId
     * @param {number} userId
     * @returns {{ changes: number }}
     */
    removeMember(projectId, userId) {
        const stmt = this.db.prepare(
            `DELETE FROM project_members WHERE project_id = ? AND user_id = ?`
        );
        return stmt.run(projectId, userId);
    }

    /**
     * Get all members of a project.
     * @param {number} projectId
     * @returns {Object[]}
     */
    getMembers(projectId) {
        const stmt = this.db.prepare(`
            SELECT u.id, u.username, u.email, r.role_name, u.role_id
            FROM project_members pm
            JOIN users u ON pm.user_id = u.id
            JOIN roles r ON u.role_id = r.id
            WHERE pm.project_id = ?
        `);
        return stmt.all(projectId);
    }

    /**
     * Check if a user is a member of a project.
     * @param {number} projectId
     * @param {number} userId
     * @returns {boolean}
     */
    isMember(projectId, userId) {
        const stmt = this.db.prepare(
            `SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?`
        );
        return !!stmt.get(projectId, userId);
    }
}

module.exports = ProjectRepository;
