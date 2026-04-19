/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Design Pattern: MIDDLEWARE FACTORY
 * Returns a middleware function that checks if the authenticated user
 * has one of the allowed roles.
 * 
 * Maps to idea.md → "Role-Based Access Control (RBAC): Distinct roles for
 * Admin, Manager, and Member with varying permission levels."
 * 
 * Usage:
 *   router.get('/admin-only', authenticate, authorize('admin'), handler);
 *   router.post('/tasks', authenticate, authorize('admin', 'manager'), handler);
 */

/**
 * Creates a middleware that restricts access to specific roles.
 * 
 * @param {...string} allowedRoles - Role names that are permitted (e.g. 'admin', 'manager')
 * @returns {Function} Express middleware
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required',
            });
        }

        // Uses polymorphism: req.user.getRoleName() returns the correct role
        // regardless of whether the object is Admin, Manager, or Member
        const userRole = req.user.getRoleName();

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                error: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${userRole}.`,
            });
        }

        next();
    };
}

module.exports = authorize;
