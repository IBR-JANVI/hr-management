/**
 * @module rbac.middleware
 * @description Role-Based Access Control middleware for enforcing permission-based authorization on routes
 */
const rbacMiddleware = (module, action) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Unauthorized' }
      });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

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

// Helper to check multiple permissions (OR/ANY logic - authorize if at least one required permission is present, short-circuits on first match via requiredPermissions.some(...))
const rbacMiddlewareAny = (requiredPermissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Unauthorized' }
      });
    }

    if (req.user.isSuperAdmin) {
      return next();
    }

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
