/**
 * @module userService
 * @description User Service - All user business logic
 */
const bcrypt = require('bcrypt');
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const { invalidateUserCache } = require('../config/cache');
const { logger } = require('../config/logger');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const normalizePagination = (page = 1, limit = DEFAULT_LIMIT) => {
  const normalizedPage = Math.max(1, parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(MAX_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_LIMIT));
  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit
  };
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

const getAllUsers = async ({ page = 1, limit = DEFAULT_LIMIT, status, search }) => {
  const { skip, limit: take } = normalizePagination(page, limit);

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
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

const getPendingUsers = async ({ page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const { skip, limit: take } = normalizePagination(page, limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.user.count({ where: { status: 'PENDING' } })
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
      page,
      limit: take,
      total,
      totalPages: Math.ceil(total / take)
    }
  };
};

const getStats = async () => {
  const [totalUsers, activeUsers, pendingUsers, rejectedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.user.count({ where: { status: 'REJECTED' } })
  ]);

  return {
    totalUsers,
    activeUsers,
    pendingUsers,
    rejectedUsers
  };
};

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

const createUser = async ({ email, password, name, roleIds }) => {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError('Email already registered', 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const roleIdsArray = Array.isArray(roleIds) ? roleIds : [];

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

const approveUser = async (id, { roleIds }) => {
  const roleIdsArray = Array.isArray(roleIds) ? Array.from(new Set(roleIds)) : [];

  const user = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'ACTIVE' }
    });

    if (result.count === 0) {
      const existing = await tx.user.findUnique({ where: { id } });
      if (!existing) {
        throw new AppError('User not found', 404);
      }
      throw new AppError('Only pending users can be approved', 400);
    }

    if (roleIdsArray.length > 0) {
      await tx.userRole.deleteMany({ where: { userId: id } });
      await tx.userRole.createMany({
        data: roleIdsArray.map(roleId => ({ userId: id, roleId }))
      });
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

const rejectUser = async (id) => {
  const user = await prisma.$transaction(async (tx) => {
    const result = await tx.user.updateMany({
      where: { id, status: 'PENDING' },
      data: { status: 'REJECTED' }
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

  const assignRoles = async (id, { roleIds }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const roleIdsArray = Array.isArray(roleIds) ? roleIds : [];

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

module.exports = {
  getAllUsers,
  getPendingUsers,
  getStats,
  getUserById,
  createUser,
  updateUser,
  approveUser,
  rejectUser,
  assignRoles,
  deleteUser
};