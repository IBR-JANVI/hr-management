/**
 * @module userWorkflowService
 * @description User Workflow Service - State transitions and statistics
 */
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const { invalidateUserCache } = require('../config/cache');
const { logger } = require('../config/logger');
const { normalizePagination } = require('../utils/pagination');

const DEFAULT_LIMIT = 20;

const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  REJECTED: 'REJECTED'
};

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
 * Gets user statistics counts
 * @returns {Promise<{totalUsers: number, activeUsers: number, pendingUsers: number, rejectedUsers: number}>} - User statistics
 * @throws {Error} When database/query or aggregation fails
 */
const getStats = async () => {
  const [totalUsers, activeUsers, pendingUsers, rejectedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: USER_STATUS.ACTIVE } }),
    prisma.user.count({ where: { status: USER_STATUS.PENDING } }),
    prisma.user.count({ where: { status: USER_STATUS.REJECTED } })
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    rejectedUsers
  };
};

/**
 * Approves a pending user
 * @param {string} id - User UUID
 * @param {Object} params - Parameters
 * @param {Array<string>} [params.roleIds] - Array of role IDs to assign
 * @returns {Promise<{id: string, email: string, name: string, status: string, createdAt: Date, roles: Array}>} - Approved user
 * @throws {AppError} 404 - User not found
 * @throws {AppError} 400 - Only pending users can be approved
 */
const approveUser = async (id, params = {}) => {
  const { roleIds } = params;
  
  if (roleIds !== undefined && !Array.isArray(roleIds)) {
    throw new AppError('roleIds must be an array', 400);
  }
  
  const roleIdsArray = roleIds ? Array.from(new Set(roleIds)) : [];
  
  if (roleIdsArray.length > 0) {
    const existingRoles = await prisma.role.findMany({
      where: { id: { in: roleIdsArray } },
      select: { id: true }
    });
    const existingIds = new Set(existingRoles.map(r => r.id));
    const unknown = roleIdsArray.filter(rid => !existingIds.has(rid));
    if (unknown.length) {
      throw new AppError(`Unknown roleIds: ${unknown.join(',')}`, 400);
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id, status: USER_STATUS.PENDING },
      data: { status: USER_STATUS.ACTIVE }
    });

    if (result.count === 0) {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Only pending users can be approved', 400);
    }

    if (roleIds !== undefined) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      if (roleIdsArray.length > 0) {
        await tx.userRole.createMany({
          data: roleIdsArray.map(roleId => ({ userId: id, roleId }))
        });
      }
    }

    return tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        roles: {
          include: {
            role: {
              select: { id: true, name: true }
            }
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
    createdAt: user.createdAt,
    roles: user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }))
  };
};

/**
 * Rejects a pending user
 * @param {string} id - User UUID
 * @returns {Promise<{id: string, email: string, name: string, status: string, createdAt: Date, roles: Array}>} - Rejected user
 * @throws {AppError} 404 - User not found
 * @throws {AppError} 400 - Only pending users can be rejected
 */
const rejectUser = async (id) => {
  const user = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id, status: USER_STATUS.PENDING },
      data: { status: USER_STATUS.REJECTED }
    });

    if (result.count === 0) {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Only pending users can be rejected', 400);
    }

    return tx.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        roles: {
          include: {
            role: {
              select: { id: true, name: true }
            }
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
    createdAt: user.createdAt,
    roles: user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }))
  };
};

module.exports = {
  getStats,
  approveUser,
  rejectUser,
  USER_STATUS
};