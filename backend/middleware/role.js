/**
 * Smart Construction Management System
 * Role Authorization Middleware
 *
 * Supports single strings, comma-separated lists, or arrays of roles:
 * e.g. requireRole('Administrator')
 *      requireRole(['Administrator'])
 *      requireRole('Administrator', 'Engineer')
 *      requireRole(['Administrator', 'Engineer'])
 */

function requireRole(...allowedRoles) {
    const flattened = allowedRoles
        .flat(Infinity)
        .map(r => String(r || "").trim().toLowerCase());

    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                success: false,
                error: "Unauthorized. User identity not established."
            });
        }

        const userRole = String(req.user.role).trim().toLowerCase();

        // Check if role matches directly or aliases (e.g. admin === administrator)
        const hasRole = flattened.some(r => {
            if (r === userRole) return true;
            if ((r === "admin" || r === "administrator") && (userRole === "admin" || userRole === "administrator")) {
                return true;
            }
            return false;
        });

        if (!hasRole) {
            return res.status(403).json({
                success: false,
                error: `Forbidden. Requires one of roles: [${flattened.join(", ")}]. Current role: ${req.user.role}`
            });
        }

        next();
    };
}

module.exports = {
    requireRole
};
