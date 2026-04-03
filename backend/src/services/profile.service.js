/**
 * @module profileService
 * @description Profile Service - Handle user profile and permission shaping
 */
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');

/**
 * Shapes user data with roles and permissions
 * @param {Object} user - Full user object with roles
 * @returns {Object} Shaped user object
 */
const shapeUser = (user) => {
  const roles = user.roles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    isSuperAdmin: ur.role.isSuperAdmin
  }));

  const permissions = user.roles.flatMap(ur =>
    ur.role.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    }))
  );

  const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles,
    permissions,
    isSuperAdmin
  };
};

/**
 * Retrieves the current user's profile
 * @param {string} userId - The user's ID
 * @returns {Promise<{id: string, email: string, name: string, status: string, roles: Array, permissions: Array, isSuperAdmin: boolean}>}
 * @throws {AppError} 404 - User not found
 */
const getProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
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
    throw new AppError('User not found', 404);
  }

  const roles = user.roles.map(ur => ({
    id: ur.role.id,
    name: ur.role.name,
    isSuperAdmin: ur.role.isSuperAdmin
  }));

  const permissions = user.roles.flatMap(ur => 
    ur.role.permissions.map(rp => ({
      module: rp.permission.module,
      action: rp.permission.action
    }))
  );

  const isSuperAdmin = user.roles.some(ur => ur.role.isSuperAdmin);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    roles,
    permissions,
    isSuperAdmin
  };
};

module.exports = {
  shapeUser,
  getProfile
};