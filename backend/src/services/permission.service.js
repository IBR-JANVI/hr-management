/**
 * @module permissionService
 * @description Permission Service - Business logic for permission management
 */
const prisma = require('../lib/prisma');
const AppError = require('../core/errors/AppError');
const { normalizePagination } = require('../utils/pagination');

/**
 * @description Get all permissions with pagination
 * @param {number} page - Page number (default 1)
 * @param {number} limit - Items per page (default 20, max 100)
 * @returns {Promise<{permissions: Array, pagination: Object}>}
 * @throws {AppError} 404 - Never thrown for getAllPermissions
 */
const getAllPermissions = async ({ page = 1, limit = 20 } = {}) => {
  const { skip, limit: take, page: normalizedPage } = normalizePagination(page, limit);

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      skip,
      take,
      orderBy: [{ module: 'asc' }, { action: 'asc' }],
      include: {
        _count: {
          select: { roles: true }
        }
      }
    }),
    prisma.permission.count()
  ]);

  return {
    permissions: permissions.map(permission => ({
      id: permission.id,
      module: permission.module,
      action: permission.action,
      createdAt: permission.createdAt,
      roleCount: permission._count.roles
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
 * @description Get a permission by ID
 * @param {string} id - Permission UUID
 * @returns {Promise<Object>}
 * @throws {AppError} 404 - When permission not found
 */
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

/**
 * @description Create a new permission (module/action normalized to lowercase)
 * @param {string} module - Module name
 * @param {string} action - Action name
 * @returns {Promise<Object>}
 * @throws {AppError} 400 - When module or action is missing/invalid
 * @throws {AppError} 409 - When permission already exists
 */
const createPermission = async ({ module, action }) => {
  if (typeof module !== 'string' || !module.trim()) {
    throw new AppError('Module is required and must be a non-empty string', 400);
  }
  if (typeof action !== 'string' || !action.trim()) {
    throw new AppError('Action is required and must be a non-empty string', 400);
  }

  const normalizedModule = module.toLowerCase().trim();
  const normalizedAction = action.toLowerCase().trim();

  const existingPermission = await prisma.permission.findUnique({
    where: {
      module_action: {
        module: normalizedModule,
        action: normalizedAction
      }
    }
  });

  if (existingPermission) {
    throw new AppError('Permission already exists', 409);
  }

  const permission = await prisma.permission.create({
    data: {
      module: normalizedModule,
      action: normalizedAction
    }
  });

  return {
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt
  };
};

/**
 * @description Update an existing permission (module/action normalized to lowercase)
 * @param {string} id - Permission UUID
 * @param {Object} data - Update data
 * @param {string} [data.module] - New module name
 * @param {string} [data.action] - New action name
 * @returns {Promise<Object>}
 * @throws {AppError} 400 - When module or action is empty after trimming
 * @throws {AppError} 404 - When permission not found
 * @throws {AppError} 409 - When updated permission already exists
 */
const updatePermission = async (id, { module, action }) => {
  const existingPermission = await prisma.permission.findUnique({
    where: { id }
  });

  if (!existingPermission) {
    throw new AppError('Permission not found', 404);
  }

  if (module !== undefined) {
    if (typeof module !== 'string') {
      throw new AppError('Module must be a string', 400);
    }
    const trimmedModule = module.trim();
    if (!trimmedModule) {
      throw new AppError('Module cannot be empty', 400);
    }
    module = trimmedModule.toLowerCase();
  }

  if (action !== undefined) {
    if (typeof action !== 'string') {
      throw new AppError('Action must be a string', 400);
    }
    const trimmedAction = action.trim();
    if (!trimmedAction) {
      throw new AppError('Action cannot be empty', 400);
    }
    action = trimmedAction.toLowerCase();
  }

  if (module || action) {
    const newModule = module || existingPermission.module;
    const newAction = action || existingPermission.action;

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
      ...(module && { module }),
      ...(action && { action })
    }
  });

  return {
    id: permission.id,
    module: permission.module,
    action: permission.action,
    createdAt: permission.createdAt
  };
};

/**
 * @description Delete a permission
 * @param {string} id - Permission UUID
 * @returns {Promise<Object>}
 * @throws {AppError} 404 - When permission not found
 * @throws {AppError} 400 - When permission is assigned to roles
 */
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

/**
 * @description Get permissions by module with pagination
 * @param {string} module - Module name
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Promise<{permissions: Array, pagination: Object}>}
 * @throws {AppError} 400 - When module is missing or invalid
 */
const getPermissionsByModule = async (module, { page = 1, limit = 20 } = {}) => {
  if (typeof module !== 'string' || !module.trim()) {
    throw new AppError('Module is required and must be a non-empty string', 400);
  }

  const { skip, limit: take, page: normalizedPage } = normalizePagination(page, limit);
  const normalizedModule = module.toLowerCase().trim();

  const [permissions, total] = await Promise.all([
    prisma.permission.findMany({
      where: { module: normalizedModule },
      skip,
      take,
      orderBy: { action: 'asc' }
    }),
    prisma.permission.count({ where: { module: normalizedModule } })
  ]);

  return {
    permissions: permissions.map(p => ({
      id: p.id,
      module: p.module,
      action: p.action
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
 * @description Get all distinct modules
 * @returns {Promise<Array<string>>}
 */
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