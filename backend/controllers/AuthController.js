/**
 * Auth Controller
 * 
 * Controller Layer — handles HTTP requests for authentication.
 * Delegates business logic to AuthService.
 * 
 * Endpoints:
 *   POST /api/auth/register — Register a new user
 *   POST /api/auth/login    — Login and receive JWT
 *   GET  /api/auth/me       — Get current user info
 */

const AuthService = require('../services/AuthService');

const authService = new AuthService();

class AuthController {
    /**
     * POST /api/auth/register
     */
    async register(req, res) {
        try {
            const { username, email, password, role } = req.body;

            const result = await authService.register({ username, email, password, role });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: result,
            });
        } catch (err) {
            const status = err.message.includes('already exists') ? 409 : 400;
            res.status(status).json({
                success: false,
                error: err.message,
            });
        }
    }

    /**
     * POST /api/auth/login
     */
    async login(req, res) {
        try {
            const { email, password } = req.body;

            const result = await authService.login({ email, password });

            res.status(200).json({
                success: true,
                message: 'Login successful',
                data: result,
            });
        } catch (err) {
            res.status(401).json({
                success: false,
                error: err.message,
            });
        }
    }

    /**
     * GET /api/auth/me
     * Returns the authenticated user's profile.
     * Requires auth middleware to populate req.user.
     */
    getMe(req, res) {
        res.status(200).json({
            success: true,
            data: req.user.toJSON(),
        });
    }
}

module.exports = new AuthController();
