/**
 * @module permissionService
 * @description Permission Service - Business logic for permission management
 */
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');

const getAllPermissions = async () => {
  const permissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { action: 'asc' }],
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  return permissions.map(permission => ({
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt,
    roleCount: permission.roles.length
  }));
};

const getPermissionById = async (id) => {
  const permission = await prisma.permission.findUnique({
    where: { id },
    include: {
      roles: {
        include: {
          role: true
        }
      }
    }
  });

  if (!permission) {
    throw new AppError('Permission not found', 404);
  }

  return {
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt,
    roles: permission.roles.map(r => ({
      id: r.role.id,
      name: r.role.name
    }))
  };
};

const createPermission = async ({ module, action }) => {
  const existingPermission = await prisma.permission.findUnique({
    where: {
      module_action: {
        module: module.toLowerCase(),
        action: action.toLowerCase()
      }
    }
  });

  if (existingPermission) {
    throw new AppError('Permission already exists', 409);
  }

  const permission = await prisma.permission.create({
    data: {
      module: module.toLowerCase(),
      action: action.toLowerCase()
    }
  });

  return {
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt
  };
};

const updatePermission = async (id, { module, action }) => {
  const existingPermission = await prisma.permission.findUnique({
    where: { id }
  });

  if (!existingPermission) {
    throw new AppError('Permission not found', 404);
  }

  if (module || action) {
    const newModule = (module || existingPermission.module).toLowerCase();
    const newAction = (action || existingPermission.action).toLowerCase();

    const conflict = await prisma.permission.findFirst({
      where: {
        module: newModule,
        action: newAction,
        id: { not: id }
      }
    });

    if (conflict) {
      throw new AppError('Permission already exists', 409);
    }
  }

  const permission = await prisma.permission.update({
    where: { id },
    data: {
      ...(module && { module: module.toLowerCase() }),
      ...(action && { action: action.toLowerCase() })
    }
  });

  return {
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt
  };
};

const deletePermission = async (id) => {
  const existingPermission = await prisma.permission.findUnique({
    where: { id }
  });

  if (!existingPermission) {
    throw new AppError('Permission not found', 404);
  }

  const roleCount = await prisma.rolePermission.count({
    where: { permissionId: id }
  });

  if (roleCount > 0) {
    throw new AppError('Cannot delete permission assigned to roles', 400);
  }

  await prisma.permission.delete({
    where: { id }
  });

  return { message: 'Permission deleted successfully' };
};

const getPermissionsByModule = async (module) => {
  const permissions = await prisma.permission.findMany({
    where: { module: module.toLowerCase() },
    orderBy: { action: 'asc' }
  });

  return permissions.map(p => ({
    id: p.id,
    module: p.module,
    action: p.action
  }));
};

const getAllModules = async () => {
  const permissions = await prisma.permission.findMany({
    select: { module: true },
    distinct: ['module'],
    orderBy: { module: 'asc' }
  });

  return permissions.map(p => p.module);
};

module.exports = {
  getAllPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByModule,
  getAllModules
};