/**
 * @module userRoleService
 * @description User Role Service - Role assignment management
 */
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const { invalidateUserCache } = require('../config/cache');
const { logger } = require('../config/logger');

const safeInvalidateUserCache = (userId) => {
  try {
    invalidateUserCache(userId);
  } catch (error) {
    logger.error('Failed to invalidate user cache', {
      userId,
      message: error.message
    });
  }
};

/**
 * Assigns roles to a user
 * @param {string} id - User UUID
 * @param {Object} params - Parameters
 * @param {Array<string>} params.roleIds - Array of role IDs to assign
 * @returns {Promise<{id: string, email: string, name: string, status: string, roles: Array}>} - Updated user
 * @throws {AppError} 404 - User not found
 * @throws {AppError} 400 - roleIds must be an array
 */
const assignRoles = async (id, { roleIds }) => {
  if (!Array.isArray(roleIds)) {
    throw new AppError('roleIds must be an array', 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const roleIdsArray = Array.from(new Set(roleIds));

  const user = await prisma.$transaction(async (tx) => {
    await tx.userRole.deleteMany({
      where: { userId: id }
    });

    return tx.user.update({
      where: { id },
      data: {
        roles: {
          create: roleIdsArray.map(roleId => ({ roleId }))
        }
      },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  });

  safeInvalidateUserCache(id);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    roles: user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }))
  };
};

module.exports = {
  assignRoles
};