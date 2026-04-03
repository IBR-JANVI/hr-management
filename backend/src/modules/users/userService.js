/**
 * User Service - Business logic for user management
 */
const bcrypt = require('bcrypt');
const prisma = require('../../lib/prisma');
const { invalidateUserCache } = require('../../config/cache');

/**
 * Get all users (with pagination and filters)
 */
const getAllUsers = async ({ page = 1, limit = 10, status, search }) => {
  const skip = (page - 1) * limit;

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
      take: limit,
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
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
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
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
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
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    throw error;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user with roles
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      status: 'ACTIVE',
      roles: {
        create: roleIds.map(roleId => ({ roleId }))
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
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // Check if email is taken by another user
  if (email && email !== existingUser.email) {
    const emailExists = await prisma.user.findUnique({
      where: { email }
    });

    if (emailExists) {
      const error = new Error('Email already in use');
      error.statusCode = 409;
      throw error;
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
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  if (existingUser.status === 'ACTIVE') {
    const error = new Error('User is already active');
    error.statusCode = 400;
    throw error;
  }

  // Update user status and assign roles
  const user = await prisma.user.update({
    where: { id },
    data: {
      status: 'ACTIVE',
      roles: {
        create: roleIds.map(roleId => ({ roleId }))
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
  // Delete existing roles
  await prisma.userRole.deleteMany({
    where: { userId: id }
  });

  // Assign new roles
  const user = await prisma.user.update({
    where: { id },
    data: {
      roles: {
        create: roleIds.map(roleId => ({ roleId }))
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

  // Invalidate cache for this user
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
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
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
