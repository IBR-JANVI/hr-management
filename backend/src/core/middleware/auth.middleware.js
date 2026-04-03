/**
 * @module auth.middleware
 * @description JWT authentication middleware for verifying tokens and protecting routes
 */
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { getConfig } = require('../../config/env');

const { JWT_SECRET } = getConfig();

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'No token provided' }
    });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Token expired' }
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        data: null,
        error: { message: 'Invalid token' }
      });
    }

    return next(error);
  }

  try {
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

    const permissions = user.roles.flatMap(ur => 
      ur.role.permissions.map(rp => ({
        module: rp.permission.module,
        action: rp.permission.action
      }))
    );

    const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

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
    next(error);
  }
};

module.exports = authMiddleware;
