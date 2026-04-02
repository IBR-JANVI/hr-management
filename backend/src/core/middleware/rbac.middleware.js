/**
 * RBAC Middleware - Role-Based Access Control
 * 
 * Usage: rbacMiddleware('module', 'action')
 * Example: rbacMiddleware('users', 'view')
 */
const rbacMiddleware = (module, action) => {
  return (req, res, next) => {
    // If user is super admin, allow all access
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has the required permission
    const hasPermission = req.user.permissions.some(
      p => p.module === module && p.action === action
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Access denied. Insufficient permissions.' }
      });
    }

    next();
  };
};

// Helper to check multiple permissions (AND logic)
const rbacMiddlewareAny = (requiredPermissions) => {
  return (req, res, next) => {
    // If user is super admin, allow all access
    if (req.user.isSuperAdmin) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = requiredPermissions.some(
      ({ module, action }) => req.user.permissions.some(
        p => p.module === module && p.action === action
      )
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Access denied. Insufficient permissions.' }
      });
    }

    next();
  };
};

module.exports = { rbacMiddleware, rbacMiddlewareAny };
