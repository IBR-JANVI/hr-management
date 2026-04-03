/**
 * @module userController
 * @description User Controller - Handle user management routes
 */
const userService = require('../services/user.service');
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');

const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  const result = await userService.getAllUsers({
    page: pageNum,
    limit: limitNum,
    status,
    search
  });

  ApiResponse.success(res, result);
});

const getPendingUsers = catchAsync(async (req, res) => {
  const users = await userService.getPendingUsers();
  ApiResponse.success(res, { users });
});

const getStats = catchAsync(async (req, res) => {
  const stats = await userService.getStats();
  ApiResponse.success(res, stats);
});

const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.success(res, { user });
});

const createUser = catchAsync(async (req, res) => {
  const { email, password, name, roleIds } = req.body;
  const user = await userService.createUser({ email, password, name, roleIds });
  ApiResponse.success(res, { user }, 201);
});

const updateUser = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const user = await userService.updateUser(req.params.id, { name, email });
  ApiResponse.success(res, { user });
});

const approveUser = catchAsync(async (req, res) => {
  const { roleIds } = req.body;
  const user = await userService.approveUser(req.params.id, { roleIds });
  ApiResponse.success(res, { user, message: 'User approved successfully' });
});

const rejectUser = catchAsync(async (req, res) => {
  const user = await userService.rejectUser(req.params.id);
  ApiResponse.success(res, { user, message: 'User rejected' });
});

const assignRoles = catchAsync(async (req, res) => {
  const { roleIds } = req.body;
  const user = await userService.assignRoles(req.params.id, { roleIds });
  ApiResponse.success(res, { user });
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);
  ApiResponse.success(res, { message: 'User deleted successfully' });
});

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