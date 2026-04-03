/**
 * @module userService
 * @description User Service - CRUD operations for user management
 */
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const { invalidateUserCache } = require('../config/cache');
const { logger } = require('../config/logger');
const { normalizePagination } = require('../utils/pagination');

const DEFAULT_LIMIT = 20;

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
 * Retrieves all users with pagination and optional filtering
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @param {string} [params.status] - Filter by status (ACTIVE, PENDING, REJECTED)
 * @param {string} [params.search] - Search by email or name
 * @returns {Promise<{users: Array, pagination: Object}>} - List of users with pagination metadata
 */
const getAllUsers = async ({ page = 1, limit = DEFAULT_LIMIT, status, search }) => {
  const { skip, limit: take, page: normalizedPage } = normalizePagination(page, limit);

  const where = {};

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { name: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
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
    }),
    prisma.user.count({ where })
  ]);

  return {
    users: users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      status: user.status,
      createdAt: user.createdAt,
      roles: user.roles.map(ur => ({
        id: ur.role.id,
        name: ur.role.name
      }))
    })),
    pagination: {
      page: normalizedPage,
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

/**
 * Retrieves all pending users with pagination
 * @param {Object} params - Query parameters
 * @param {number} [params.page=1] - Page number
 * @param {number} [params.limit=20] - Items per page
 * @returns {Promise<Array>} - Array of pending users
 */
const getPendingUsers = async ({ page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const { skip, limit: take } = normalizePagination(page, limit);

  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
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

  return users.map(user => ({
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    createdAt: user.createdAt,
    roles: user.roles.map(ur => ({
      id: ur.role.id,
      name: ur.role.name
    }))
  }));
};

/**
 * Retrieves a single user by ID
 * @param {string} id - User UUID
 * @returns {Promise<{id: string, email: string, name: string, status: string, createdAt: Date, roles: Array, permissions: Array}>} - User with roles and permissions
 * @throws {AppError} 404 - User not found
 */
const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
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

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    createdAt: user.createdAt,
    roles,
    permissions
  };
};

/**
 * Creates a new user
 * @param {Object} params - User data
 * @param {string} params.email - User's email
 * @param {string} params.password - User's password
 * @param {string} params.name - User's name
 * @param {Array<string>} [params.roleIds] - Array of role IDs to assign
 * @returns {Promise<{id: string, email: string, name: string, status: string, createdAt: Date, roles: Array}>} - Created user
 * @throws {AppError} 409 - Email already registered
 */
const createUser = async ({ email, password, name, roleIds }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const roleIdsArray = Array.isArray(roleIds) ? Array.from(new Set(roleIds)) : [];

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      status: 'ACTIVE',
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
 * Updates an existing user
 * @param {string} id - User UUID
 * @param {Object} data - Update data
 * @param {string} [data.name] - New name
 * @param {string} [data.email] - New email
 * @returns {Promise<{id: string, email: string, name: string, status: string, createdAt: Date, roles: Array}>} - Updated user
 * @throws {AppError} 404 - User not found
 * @throws {AppError} 409 - Email already in use
 */
const updateUser = async (id, { name, email }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });

    if (emailExists) {
      throw new AppError('Email already in use', 409);
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(email && { email })
    },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
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
 * Deletes a user
 * @param {string} id - User UUID
 * @returns {Promise<{message: string}>} - Success message
 * @throws {AppError} 404 - User not found
 */
const deleteUser = async (id) => {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.delete({
    where: { id }
  });

  safeInvalidateUserCache(id);

  return { message: 'User deleted successfully' };
};

const userWorkflowService = require('./userWorkflow.service');
const userRoleService = require('./userRole.service');

module.exports = {
  getAllUsers,
  getPendingUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  safeInvalidateUserCache,
  getStats: userWorkflowService.getStats,
  approveUser: userWorkflowService.approveUser,
  rejectUser: userWorkflowService.rejectUser,
  assignRoles: userRoleService.assignRoles
};