/**
 * @module roleService
 * @description Role Service - Business logic for role management
 */
const prisma = require('../lib/prisma');
const { invalidateUserCache } = require('../config/cache');
const AppError = require('../core/errors/AppError');

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

/**
 * @description Get all roles with pagination
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 20, max 100)
 * @returns {Promise<{roles: Array, pagination: Object}>}
 */
const getAllRoles = async ({ page = 1, limit = DEFAULT_LIMIT } = {}) => {
  const { skip, limit: take, page: normalizedPage } = normalizePagination(page, limit);

  const [roles, total] = await Promise.all([
    prisma.role.findMany({
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      }
    }),
    prisma.role.count()
  ]);

  return {
    roles: roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
      isSuperAdmin: role.isSuperAdmin,
      createdAt: role.createdAt,
      permissions: role.permissions.map(rp => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action
      })),
      userCount: role._count.users
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
 * @description Get a role by ID
 * @param {string} id - Role UUID
 * @returns {Promise<Object>}
 * @throws {AppError} 404 - When role not found
 */
const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      _count: {
        select: { users: true }
      }
    }
  });

  if (!role) {
    throw new AppError('Role not found', 404);
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isDefault: role.isDefault,
    isSuperAdmin: role.isSuperAdmin,
    createdAt: role.createdAt,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action
    })),
    userCount: role._count.users
  };
};

/**
 * @description Create a new role
 * @param {Object} data - Role data
 * @param {string} data.name - Role name (required)
 * @param {string} [data.description] - Role description
 * @param {boolean} [data.isDefault] - Whether this is a default role
 * @param {Array<string>} [data.permissionIds] - Array of permission IDs
 * @returns {Promise<Object>}
 * @throws {AppError} 400 - When permissionIds is invalid
 * @throws {AppError} 409 - When role name already exists
 */
const createRole = async ({ name, description, isDefault, permissionIds }) => {
  if (!Array.isArray(permissionIds) || permissionIds.length === 0) {
    throw new AppError('Invalid permissions format: permissionIds must be a non-empty array', 400);
  }

  const existingRole = await prisma.role.findUnique({
    where: { name }
  });

  if (existingRole) {
    throw new AppError('Role name already exists', 409);
  }

  const role = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.role.updateMany({
        where: { isDefault: true },
        data: { isDefault: false }
      });
    }

    return tx.role.create({
      data: {
        name,
        description,
        isDefault: isDefault || false,
        isSuperAdmin: false,
        permissions: {
          create: permissionIds.map(permissionId => ({ permissionId }))
        }
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isDefault: role.isDefault,
    isSuperAdmin: role.isSuperAdmin,
    createdAt: role.createdAt,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action
    }))
  };
};

/**
 * @description Update an existing role
 * @param {string} id - Role UUID
 * @param {Object} data - Update data
 * @param {string} [data.name] - New role name
 * @param {string} [data.description] - New description
 * @param {boolean} [data.isDefault] - Set as default
 * @param {Array<string>} [data.permissionIds] - Array of permission IDs
 * @returns {Promise<Object>}
 * @throws {AppError} 404 - When role not found
 * @throws {AppError} 403 - Cannot modify super admin role
 * @throws {AppError} 400 - When permissionIds is not an array
 * @throws {AppError} 409 - When role name already exists
 */
const updateRole = async (id, { name, description, isDefault, permissionIds }) => {
  if (permissionIds !== undefined && !Array.isArray(permissionIds)) {
    throw new AppError('permissionIds must be an array', 400);
  }

  const existingRole = await prisma.role.findUnique({
    where: { id }
  });

  if (!existingRole) {
    throw new AppError('Role not found', 404);
  }

  if (existingRole.isSuperAdmin) {
    throw new AppError('Cannot modify super admin role', 403);
  }

  if (name && name !== existingRole.name) {
    const nameExists = await prisma.role.findUnique({
      where: { name }
    });

    if (nameExists) {
      throw new AppError('Role name already exists', 409);
    }
  }

  const role = await prisma.$transaction(async (tx) => {
    if (isDefault && !existingRole.isDefault) {
      await tx.role.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false }
      });
    }

    if (permissionIds) {
      await tx.rolePermission.deleteMany({
        where: { roleId: id }
      });

      await tx.rolePermission.createMany({
        data: permissionIds.map(permissionId => ({
          roleId: id,
          permissionId
        }))
      });
    }

    return tx.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault })
      },
      include: {
        permissions: {
          include: {
            permission: true
          }
        }
      }
    });
  });

  const usersWithRole = await prisma.userRole.findMany({
    where: { roleId: id },
    select: { userId: true }
  });
  for (const { userId } of usersWithRole) {
    invalidateUserCache(userId);
  }

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isDefault: role.isDefault,
    isSuperAdmin: role.isSuperAdmin,
    createdAt: role.createdAt,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action
    }))
  };
};

/**
 * Deletes a role by ID
 * @param {string} id - Role UUID
 * @returns {Promise<{message: string}>} - Success message
 * @throws {AppError} 404 - When role not found
 * @throws {AppError} 403 - Cannot delete super admin role
 * @throws {AppError} 400 - When role has assigned users
 */
const deleteRole = async (id) => {
  const existingRole = await prisma.role.findUnique({
    where: { id }
  });

  if (!existingRole) {
    throw new AppError('Role not found', 404);
  }

  if (existingRole.isSuperAdmin) {
    throw new AppError('Cannot delete super admin role', 403);
  }

  const userCount = await prisma.userRole.count({
    where: { roleId: id }
  });

  if (userCount > 0) {
    throw new AppError('Cannot delete role with assigned users', 400);
  }

  await prisma.role.delete({
    where: { id }
  });

  return { message: 'Role deleted successfully' };
};

/**
 * Assigns permissions to a role
 * @param {string} id - Role UUID
 * @param {Object} params - Parameters
 * @param {Array<string>} params.permissionIds - Array of permission IDs to assign
 * @returns {Promise<{id: string, name: string, permissions: Array}>} - Updated role with permissions
 * @throws {AppError} 404 - When role not found
 * @throws {AppError} 400 - When permissionIds is not an array
 */
const assignPermissions = async (id, { permissionIds }) => {
  if (!Array.isArray(permissionIds)) {
    throw new AppError('permissionIds must be an array', 400);
  }
  const existingRole = await prisma.role.findUnique({
    where: { id }
  });

  if (!existingRole) {
    throw new AppError('Role not found', 404);
  }

  await prisma.rolePermission.deleteMany({
    where: { roleId: id }
  });

  const role = await prisma.role.update({
    where: { id },
    data: {
      permissions: {
        create: permissionIds.map(permissionId => ({ permissionId }))
      }
    },
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  });

  const usersWithRole = await prisma.userRole.findMany({
    where: { roleId: id },
    select: { userId: true }
  });
  for (const { userId } of usersWithRole) {
    invalidateUserCache(userId);
  }

  return {
    id: role.id,
    name: role.name,
    permissions: role.permissions.map(rp => ({
      id: rp.permission.id,
      module: rp.permission.module,
      action: rp.permission.action
    }))
  };
};

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  assignPermissions
};