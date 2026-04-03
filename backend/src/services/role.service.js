/**
 * @module roleService
 * @description Role Service - Business logic for role management
 */
const prisma = require('../lib/prisma');
const { invalidateUserCache } = require('../config/cache');
const AppError = require('../core/errors/AppError');

const getAllRoles = async () => {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: true
    }
  });

  return roles.map(role => ({
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
    userCount: role.users.length
  }));
};

const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: true
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
    userCount: role.users.length
  };
};

const createRole = async ({ name, description, isDefault, permissionIds }) => {
  const existingRole = await prisma.role.findUnique({
    where: { name }
  });

  if (existingRole) {
    throw new AppError('Role name already exists', 409);
  }

  if (isDefault) {
    await prisma.role.updateMany({
      where: { isDefault: true },
      data: { isDefault: false }
    });
  }

  const role = await prisma.role.create({
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

const updateRole = async (id, { name, description, isDefault, permissionIds }) => {
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

  if (isDefault && !existingRole.isDefault) {
    await prisma.role.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }

  if (permissionIds) {
    await prisma.rolePermission.deleteMany({
      where: { roleId: id }
    });

    await prisma.rolePermission.createMany({
      data: permissionIds.map(permissionId => ({
        roleId: id,
        permissionId
      }))
    });
  }

  const role = await prisma.role.update({
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

const assignPermissions = async (id, { permissionIds }) => {
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