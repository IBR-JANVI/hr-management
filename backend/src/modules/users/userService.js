/**
 * @module userService
 * @description User Service - Business logic for user management
 */
const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { invalidateUserCache } = require('../../config/cache');
const AppError = require('../../core/errors/AppError');

/**
 * Get all users (with pagination and filters)
 */
const getAllUsers = async ({ page = 1, limit = 10, status, search }) => {
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (!Number.isFinite(pageNum) || pageNum < 1) {
    throw new AppError('Invalid page parameter. Must be a positive integer.', 400);
  }

  if (!Number.isFinite(limitNum) || limitNum < 1 || limitNum > 100) {
    throw new AppError('Invalid limit parameter. Must be between 1 and 100.', 400);
  }

  const skip = (pageNum - 1) * limitNum;

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
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        roles: {
          include: {
            role: true
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
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  };
};

/**
 * Get pending users
 */
const getPendingUsers = async () => {
  const users = await prisma.user.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: {
      roles: {
        include: {
          role: true
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
 * Get user by ID
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
 * Create user (admin only)
 */
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

/**
 * Update user
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

  invalidateUserCache(id);

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
 * Approve user (set status to ACTIVE and assign role)
 */
const approveUser = async (id, { roleIds }) => {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (existingUser.status === 'ACTIVE') {
    throw new AppError('User is already active', 400);
  }

  const roleIdsArray = Array.isArray(roleIds) ? roleIds : [];

  const user = await prisma.user.update({
    where: { id },
    data: {
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

  invalidateUserCache(id);

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
 * Reject user
 */
const rejectUser = async (id) => {
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: 'REJECTED' },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  invalidateUserCache(id);

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

/**
 * Assign roles to user
 */
const assignRoles = async (id, { roleIds }) => {
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

  invalidateUserCache(id);

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

/**
 * Delete user
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

  invalidateUserCache(id);

  return { message: 'User deleted successfully' };
};

/**
 * Get user statistics
 */
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

module.exports = {
  getAllUsers,
  getPendingUsers,
  getUserById,
  createUser,
  updateUser,
  approveUser,
  rejectUser,
  assignRoles,
  deleteUser,
  getStats
};