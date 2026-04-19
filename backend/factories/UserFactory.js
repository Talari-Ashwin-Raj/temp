/**
 * UserFactory
 * 
 * Design Pattern: FACTORY
 * Creates the correct User subclass (Admin, Manager, Member) based on role.
 * Centralises object creation logic — callers don't need to know which
 * concrete class to instantiate.
 * 
 * Maps to idea.md → "Factory Pattern: Creating specific user types based on roles"
 */

const Admin = require('../models/Admin');
const Manager = require('../models/Manager');
const Member = require('../models/Member');

class UserFactory {
    /**
     * Role ID → Constructor mapping.
     * @private
     */
    static #roleMap = {
        1: Admin,
        2: Manager,
        3: Member,
    };

    /**
     * Role name → Constructor mapping (convenience).
     * @private
     */
    static #roleNameMap = {
        admin:   Admin,
        manager: Manager,
        member:  Member,
    };

    /**
     * Creates a User subclass instance from a raw database row.
     * 
     * @param {Object} dbRow - Raw row from the users table
     * @param {number} dbRow.id
     * @param {string} dbRow.username
     * @param {string} dbRow.email
     * @param {string} dbRow.password_hash
     * @param {number} dbRow.role_id
     * @param {string} dbRow.created_at
     * @returns {Admin|Manager|Member}
     * @throws {Error} if role_id is unknown
     */
    static createFromDB(dbRow) {
        const Constructor = UserFactory.#roleMap[dbRow.role_id];

        if (!Constructor) {
            throw new Error(`Unknown role_id: ${dbRow.role_id}`);
        }

        return new Constructor({
            id:           dbRow.id,
            username:     dbRow.username,
            email:        dbRow.email,
            passwordHash: dbRow.password_hash,
            roleId:       dbRow.role_id,
            createdAt:    dbRow.created_at,
        });
    }

    /**
     * Creates a User subclass instance from a role name string.
     * Useful during registration when the role comes from the request body.
     * 
     * @param {string} roleName - 'admin', 'manager', or 'member'
     * @param {Object} userData - User properties
     * @returns {Admin|Manager|Member}
     * @throws {Error} if roleName is unknown
     */
    static createFromRole(roleName, userData) {
        const Constructor = UserFactory.#roleNameMap[roleName.toLowerCase()];

        if (!Constructor) {
            throw new Error(`Unknown role name: ${roleName}`);
        }

        return new Constructor(userData);
    }

    /**
     * Returns all valid role names.
     * @returns {string[]}
     */
    static getValidRoles() {
        return Object.keys(UserFactory.#roleNameMap);
    }
}

module.exports = UserFactory;
