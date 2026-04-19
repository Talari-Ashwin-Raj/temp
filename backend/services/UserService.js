/**
 * UserService
 * 
 * Design Pattern: SERVICE LAYER — business logic for user management.
 */

const UserRepository = require('../repositories/UserRepository');
const UserFactory = require('../factories/UserFactory');

class UserService {
    #userRepository;

    constructor() {
        this.#userRepository = new UserRepository();
    }

    /**
     * Get all users (Admin only).
     * @returns {Object[]}
     */
    async getAllUsers() {
        const rows = await this.#userRepository.findAll();
        return rows.map(row => {
            const user = UserFactory.createFromDB(row);
            return user.toJSON();
        });
    }

    /**
     * Get a user by ID.
     * @param {number} userId
     * @returns {Object}
     * @throws {Error} if user not found
     */
    async getUserById(userId) {
        const row = await this.#userRepository.findById(userId);
        if (!row) {
            throw new Error('User not found');
        }
        const user = UserFactory.createFromDB(row);
        return user.toJSON();
    }

    /**
     * Update a user's role (Admin only).
     * @param {number} userId
     * @param {string} newRole - 'admin', 'manager', or 'member'
     * @param {User}   requestingUser - the admin performing the action
     * @returns {Object}
     */
    async updateUserRole(userId, newRole, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canManageUsers()) {
            throw new Error('Insufficient permissions: only admins can change user roles');
        }

        const roleIdMap = { admin: 1, manager: 2, member: 3 };
        const newRoleId = roleIdMap[newRole.toLowerCase()];

        if (!newRoleId) {
            throw new Error(`Invalid role: ${newRole}`);
        }

        // Prevent self-demotion
        if (userId === requestingUser.id) {
            throw new Error('Cannot change your own role');
        }

        await this.#userRepository.updateRole(userId, newRoleId);
        return this.getUserById(userId);
    }

    /**
     * Delete a user (Admin only).
     * @param {number} userId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    async deleteUser(userId, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canManageUsers()) {
            throw new Error('Insufficient permissions: only admins can delete users');
        }

        if (userId === requestingUser.id) {
            throw new Error('Cannot delete your own account');
        }

        const row = await this.#userRepository.findById(userId);
        if (!row) {
            throw new Error('User not found');
        }

        await this.#userRepository.delete(userId);
        return { message: `User '${row.username}' deleted successfully` };
    }

    /**
     * Get users filtered by role.
     * @param {string} roleName
     * @returns {Object[]}
     */
    async getUsersByRole(roleName) {
        const roleIdMap = { admin: 1, manager: 2, member: 3 };
        const roleId = roleIdMap[roleName.toLowerCase()];
        if (!roleId) {
            throw new Error(`Invalid role: ${roleName}`);
        }
        const rows = await this.#userRepository.findByRole(roleName);
        return rows.map(row => UserFactory.createFromDB(row).toJSON());
    }
}

module.exports = UserService;
