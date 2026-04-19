/**
 * Database Singleton
 * 
 * Design Pattern: SINGLETON
 * Ensures only one database connection instance exists throughout the application.
 * Initialises tables from schema.sql on first instantiation.
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class DatabaseConnection {
    /** @type {DatabaseConnection|null} Singleton instance */
    static #instance = null;

    /** @type {Database} The underlying better-sqlite3 connection */
    #db;

    /**
     * Private constructor — use DatabaseConnection.getInstance() instead.
     */
    constructor() {
        if (DatabaseConnection.#instance) {
            throw new Error(
                'Cannot instantiate DatabaseConnection directly. Use getInstance().'
            );
        }

        const dbPath = path.join(__dirname, 'taskhandler.db');
        this.#db = new Database(dbPath);

        // Enable WAL mode for better concurrent read performance
        this.#db.pragma('journal_mode = WAL');
        // Enforce foreign key constraints
        this.#db.pragma('foreign_keys = ON');

        this.#initialiseSchema();
    }

    /**
     * Returns the singleton DatabaseConnection instance.
     * Creates it on first call.
     * @returns {DatabaseConnection}
     */
    static getInstance() {
        if (!DatabaseConnection.#instance) {
            DatabaseConnection.#instance = new DatabaseConnection();
        }
        return DatabaseConnection.#instance;
    }

    /**
     * Runs the schema.sql file to create tables if they don't exist.
     * @private
     */
    #initialiseSchema() {
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');
        this.#db.exec(schema);
    }

    /**
     * Exposes the raw better-sqlite3 connection for repositories.
     * @returns {Database}
     */
    getConnection() {
        return this.#db;
    }

    /**
     * Gracefully closes the database connection.
     */
    close() {
        this.#db.close();
        DatabaseConnection.#instance = null;
    }
}

module.exports = DatabaseConnection;
