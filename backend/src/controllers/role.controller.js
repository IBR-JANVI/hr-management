/**
 * @module roleController
 * @description Role Controller - Handle role management routes
 */
const roleService = require('../services/role.service');
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');

const getAllRoles = catchAsync(async (req, res) => {
  const roles = await roleService.getAllRoles();
  ApiResponse.success(res, { roles });
});

const getRoleById = catchAsync(async (req, res) => {
  const role = await roleService.getRoleById(req.params.id);
  ApiResponse.success(res, { role });
});

const createRole = catchAsync(async (req, res) => {
  const { name, description, isDefault, permissionIds } = req.body;
  const role = await roleService.createRole({ name, description, isDefault, permissionIds });
  ApiResponse.success(res, { role }, 201);
});

const updateRole = catchAsync(async (req, res) => {
  const { name, description, isDefault, permissionIds } = req.body;
  const role = await roleService.updateRole(req.params.id, { name, description, isDefault, permissionIds });
  ApiResponse.success(res, { role });
});

const assignPermissions = catchAsync(async (req, res) => {
  const { permissionIds } = req.body;
  const role = await roleService.assignPermissions(req.params.id, { permissionIds });
  ApiResponse.success(res, { role });
});

const deleteRole = catchAsync(async (req, res) => {
  await roleService.deleteRole(req.params.id);
  ApiResponse.success(res, { message: 'Role deleted successfully' });
});

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  assignPermissions,
  deleteRole
};