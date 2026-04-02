/**
 * Auth Middleware - JWT verification
 */
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'No token provided' }
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify access token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Fetch user with roles and permissions
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'User not found' }
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Account is not active' }
      });
    }

    // Extract permissions
    const permissions = user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => ({
        module: rp.permission.module,
        action: rp.permission.action
      }))
    );

    // Check if user is super admin
    const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles.map(ur => ur.role),
      permissions,
      isSuperAdmin
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Token expired' }
      });
    }

    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid token' }
    });
  }
};

module.exports = authMiddleware;
