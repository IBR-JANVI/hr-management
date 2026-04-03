/**
 * @module auth.middleware
 * @description JWT authentication middleware for verifying tokens and protecting routes
 */
const jwt = require('jsonwebtoken');
const prisma = require('../../lib/prisma');
const { getConfig } = require('../../config/env');
const { userCache } = require('../../config/cache');

const config = getConfig();
const { JWT_SECRET, nodeEnv: NODE_ENV } = config;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in environment variables');
}

const CACHE_TTL_SECONDS = 300;

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

  if (!decoded || typeof decoded.userId !== 'string') {
    return res.status(401).json({
      success: false,
      data: null,
      error: { message: 'Invalid token payload' }
    });
  }

  try {
    const cacheKey = `user:${decoded.userId}`;
    let userData = userCache.get(cacheKey);

    if (!userData) {
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

      const permissions = user.roles.flatMap(ur => 
        ur.role.permissions.map(rp => ({
          module: rp.permission.module,
          action: rp.permission.action
        }))
      );

      const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

      userData = {
        id: user.id,
        email: user.email,
        name: user.name,
        status: user.status,
        roles: user.roles.map(ur => ur.role),
        permissions,
        isSuperAdmin
      };

      userCache.set(cacheKey, userData, CACHE_TTL_SECONDS);
    }

    if (userData.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        data: null,
        error: { message: 'Account is not active' }
      });
    }

    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      roles: userData.roles,
      permissions: userData.permissions,
      isSuperAdmin: userData.isSuperAdmin
    };

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
