/**
 * UserRepository
 * 
 * Design Pattern: REPOSITORY — abstracts data access for the users table.
 * Inherits generic CRUD from BaseRepository and adds user-specific queries.
 */

const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    /**
     * Find a user by email (for login).
     * @param {string} email
     * @returns {Object|undefined}
     */
    findByEmail(email) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE email = ?');
        return stmt.get(email);
    }

    /**
     * Find a user by username.
     * @param {string} username
     * @returns {Object|undefined}
     */
    findByUsername(username) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE username = ?');
        return stmt.get(username);
    }

    /**
     * Create a new user.
     * @param {Object} userData
     * @param {string} userData.username
     * @param {string} userData.email
     * @param {string} userData.passwordHash
     * @param {number} userData.roleId
     * @returns {Object} - The created user row
     */
    create({ username, email, passwordHash, roleId }) {
        const stmt = this.db.prepare(
            `INSERT INTO users (username, email, password_hash, role_id) 
             VALUES (?, ?, ?, ?)`
        );
        const result = stmt.run(username, email, passwordHash, roleId);
        return this.findById(result.lastInsertRowid);
    }

    /**
     * Update a user's role.
     * @param {number} userId
     * @param {number} newRoleId
     * @returns {{ changes: number }}
     */
    updateRole(userId, newRoleId) {
        const stmt = this.db.prepare('UPDATE users SET role_id = ? WHERE id = ?');
        return stmt.run(newRoleId, userId);
    }

    /**
     * Find all users with a specific role.
     * @param {number} roleId
     * @returns {Object[]}
     */
    findByRole(roleId) {
        const stmt = this.db.prepare('SELECT * FROM users WHERE role_id = ?');
        return stmt.all(roleId);
    }

    /**
     * Find all users with role name joined from roles table.
     * @returns {Object[]}
     */
    findAllWithRoles() {
        const stmt = this.db.prepare(`
            SELECT u.id, u.username, u.email, u.role_id, r.role_name, u.created_at
            FROM users u
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id
        `);
        return stmt.all();
    }
}

module.exports = UserRepository;
