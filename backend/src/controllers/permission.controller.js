/**
 * @module permissionController
 * @description Permission Controller - Handle permission management routes
 */
const permissionService = require('../services/permission.service');
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');

const getAllPermissions = catchAsync(async (req, res) => {
  const permissions = await permissionService.getAllPermissions();
  ApiResponse.success(res, { permissions });
});

const getAllModules = catchAsync(async (req, res) => {
  const modules = await permissionService.getAllModules();
  ApiResponse.success(res, { modules });
});

const getPermissionById = catchAsync(async (req, res) => {
  const permission = await permissionService.getPermissionById(req.params.id);
  ApiResponse.success(res, { permission });
});

const createPermission = catchAsync(async (req, res) => {
  const { module, action } = req.body;
  const permission = await permissionService.createPermission({ module, action });
  ApiResponse.success(res, { permission }, 201);
});

const updatePermission = catchAsync(async (req, res) => {
  const { module, action } = req.body;
  const permission = await permissionService.updatePermission(req.params.id, { module, action });
  ApiResponse.success(res, { permission });
});

const deletePermission = catchAsync(async (req, res) => {
  await permissionService.deletePermission(req.params.id);
  ApiResponse.success(res, { message: 'Permission deleted successfully' });
});

module.exports = {
  getAllPermissions,
  getAllModules,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission
};