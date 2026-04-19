/**
 * Authentication Middleware
 * 
 * Extracts and verifies the JWT from the Authorization header (Bearer token).
 * Attaches the hydrated User subclass (Admin/Manager/Member) to req.user.
 * 
 * Token is expected in: Authorization: Bearer <token>
 * (Frontend stores the token in localStorage and sends it with each request)
 */

const AuthService = require('../services/AuthService');

const authService = new AuthService();

/**
 * Middleware that requires a valid JWT.
 * Populates req.user with the correct User subclass via Factory pattern.
 */
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Please provide a Bearer token.',
            });
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required. Token is missing.',
            });
        }

        // verifyToken uses Factory pattern to return Admin/Manager/Member
        const user = await authService.verifyToken(token);
        req.user = user;

        next();
    } catch (err) {
        return res.status(401).json({
            success: false,
            error: err.message || 'Invalid or expired token',
        });
    }
}

module.exports = authenticate;
