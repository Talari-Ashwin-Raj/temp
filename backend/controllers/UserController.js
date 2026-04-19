/**
 * User Controller
 * 
 * Controller Layer — handles HTTP requests for user management.
 * Delegates business logic to UserService.
 * 
 * Endpoints:
 *   GET    /api/users          — List all users (Admin only)
 *   GET    /api/users/:id      — Get user by ID
 *   PATCH  /api/users/:id/role — Update user role (Admin only)
 *   DELETE /api/users/:id      — Delete user (Admin only)
 *   GET    /api/users/role/:roleName — Get users by role
 */

const UserService = require('../services/UserService');

const userService = new UserService();

class UserController {
    /**
     * GET /api/users
     */
    getAllUsers(req, res) {
        try {
            const users = userService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users,
                count: users.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    /**
     * GET /api/users/:id
     */
    getUserById(req, res) {
        try {
            const user = userService.getUserById(parseInt(req.params.id));
            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * PATCH /api/users/:id/role
     */
    updateUserRole(req, res) {
        try {
            const { role } = req.body;
            const user = userService.updateUserRole(
                parseInt(req.params.id),
                role,
                req.user // Polymorphic check happens inside service
            );
            res.status(200).json({
                success: true,
                message: 'User role updated successfully',
                data: user,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * DELETE /api/users/:id
     */
    deleteUser(req, res) {
        try {
            const result = userService.deleteUser(
                parseInt(req.params.id),
                req.user
            );
            res.status(200).json({
                success: true,
                ...result,
            });
        } catch (err) {
            const status = err.message.includes('permissions') ? 403
                         : err.message.includes('not found') ? 404 : 400;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    /**
     * GET /api/users/role/:roleName
     */
    getUsersByRole(req, res) {
        try {
            const users = userService.getUsersByRole(req.params.roleName);
            res.status(200).json({
                success: true,
                data: users,
                count: users.length,
            });
        } catch (err) {
            res.status(400).json({ success: false, error: err.message });
        }
    }
}

module.exports = new UserController();
