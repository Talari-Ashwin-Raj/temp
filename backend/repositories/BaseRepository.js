/**
 * BaseRepository — Abstract Repository
 * 
 * Design Pattern: REPOSITORY + TEMPLATE METHOD
 * 
 * Provides common CRUD operations that all concrete repositories inherit.
 * Subclasses specify the table name and can override methods for custom queries.
 * 
 * OOP Principle: ABSTRACTION — hides raw SQL behind a clean interface
 * OOP Principle: INHERITANCE — concrete repos extend this base
 */

const DatabaseConnection = require('../db/database');

class BaseRepository {
    /** @type {string} The database table this repository operates on */
    #tableName;

    /**
     * @param {string} tableName
     */
    constructor(tableName) {
        if (new.target === BaseRepository) {
            throw new Error('Cannot instantiate BaseRepository directly.');
        }
        this.#tableName = tableName;
    }

    /**
     * Returns the better-sqlite3 database connection.
     * @protected
     * @returns {import('better-sqlite3').Database}
     */
    get db() {
        return DatabaseConnection.getInstance().getConnection();
    }

    /**
     * Returns the table name.
     * @protected
     * @returns {string}
     */
    get tableName() {
        return this.#tableName;
    }

    // ── Generic CRUD (Template Method pattern) ─────────────────

    /**
     * Find a single record by ID.
     * @param {number} id
     * @returns {Object|undefined}
     */
    findById(id) {
        const stmt = this.db.prepare(`SELECT * FROM ${this.#tableName} WHERE id = ?`);
        return stmt.get(id);
    }

    /**
     * Find all records, with optional limit and offset.
     * @param {Object}  options
     * @param {number}  [options.limit=100]
     * @param {number}  [options.offset=0]
     * @returns {Object[]}
     */
    findAll({ limit = 100, offset = 0 } = {}) {
        const stmt = this.db.prepare(
            `SELECT * FROM ${this.#tableName} ORDER BY id DESC LIMIT ? OFFSET ?`
        );
        return stmt.all(limit, offset);
    }

    /**
     * Delete a record by ID.
     * @param {number} id
     * @returns {{ changes: number }}
     */
    deleteById(id) {
        const stmt = this.db.prepare(`DELETE FROM ${this.#tableName} WHERE id = ?`);
        return stmt.run(id);
    }

    /**
     * Count total records in the table.
     * @returns {number}
     */
    count() {
        const stmt = this.db.prepare(`SELECT COUNT(*) as total FROM ${this.#tableName}`);
        return stmt.get().total;
    }

    /**
     * Find records matching a WHERE clause.
     * @param {string}   whereClause - e.g. 'status = ? AND project_id = ?'
     * @param {any[]}    params      - bound parameter values
     * @returns {Object[]}
     */
    findWhere(whereClause, params = []) {
        const stmt = this.db.prepare(
            `SELECT * FROM ${this.#tableName} WHERE ${whereClause}`
        );
        return stmt.all(...params);
    }
}

module.exports = BaseRepository;
