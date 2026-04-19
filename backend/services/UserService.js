/**
 * UserService
 * 
 * Design Pattern: SERVICE LAYER — business logic for user management.
 * 
 * Maps to useCaseDiagram:
 *   - Admin → Manage Users (UC implied via Admin.manageUsers())
 *   - All actors → Login/Register (delegated to AuthService)
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
    getAllUsers() {
        const rows = this.#userRepository.findAllWithRoles();
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
    getUserById(userId) {
        const row = this.#userRepository.findById(userId);
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
    updateUserRole(userId, newRole, requestingUser) {
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

        this.#userRepository.updateRole(userId, newRoleId);
        return this.getUserById(userId);
    }

    /**
     * Delete a user (Admin only).
     * @param {number} userId
     * @param {User}   requestingUser
     * @returns {{ message: string }}
     */
    deleteUser(userId, requestingUser) {
        // Polymorphic permission check
        if (!requestingUser.canManageUsers()) {
            throw new Error('Insufficient permissions: only admins can delete users');
        }

        if (userId === requestingUser.id) {
            throw new Error('Cannot delete your own account');
        }

        const row = this.#userRepository.findById(userId);
        if (!row) {
            throw new Error('User not found');
        }

        this.#userRepository.deleteById(userId);
        return { message: `User '${row.username}' deleted successfully` };
    }

    /**
     * Get users filtered by role.
     * @param {string} roleName
     * @returns {Object[]}
     */
    getUsersByRole(roleName) {
        const roleIdMap = { admin: 1, manager: 2, member: 3 };
        const roleId = roleIdMap[roleName.toLowerCase()];
        if (!roleId) {
            throw new Error(`Invalid role: ${roleName}`);
        }
        const rows = this.#userRepository.findByRole(roleId);
        return rows.map(row => UserFactory.createFromDB(row).toJSON());
    }
}

module.exports = UserService;
