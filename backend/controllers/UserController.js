/**
 * User Controller
 * 
 * Controller Layer — handles HTTP requests for user management.
 * Delegates business logic to UserService.
 */

const UserService = require('../services/UserService');

const userService = new UserService();

class UserController {
    async getAllUsers(req, res) {
        try {
            const users = await userService.getAllUsers();
            res.status(200).json({
                success: true,
                data: users,
                count: users.length,
            });
        } catch (err) {
            res.status(500).json({ success: false, error: err.message });
        }
    }

    async getUserById(req, res) {
        try {
            const user = await userService.getUserById(parseInt(req.params.id));
            res.status(200).json({
                success: true,
                data: user,
            });
        } catch (err) {
            const status = err.message.includes('not found') ? 404 : 500;
            res.status(status).json({ success: false, error: err.message });
        }
    }

    async updateUserRole(req, res) {
        try {
            const { role } = req.body;
            const user = await userService.updateUserRole(
                parseInt(req.params.id),
                role,
                req.user
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

    async deleteUser(req, res) {
        try {
            const result = await userService.deleteUser(
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

    async getUsersByRole(req, res) {
        try {
            const users = await userService.getUsersByRole(req.params.roleName);
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
