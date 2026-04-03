/**
 * @module userController
 * @description User Controller - Handle user management routes
 */
const userService = require('./userService');
const catchAsync = require('../../core/middleware/asyncHandler');
const ApiResponse = require('../../core/utils/ApiResponse');

/**
 * GET /api/v1/users
 * Get all users (with pagination)
 */
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

/**
 * GET /api/v1/users/pending
 * Get pending users
 */
const getPendingUsers = catchAsync(async (req, res) => {
  const users = await userService.getPendingUsers();
  ApiResponse.success(res, { users });
});

/**
 * GET /api/v1/users/stats
 * Get user statistics
 */
const getStats = catchAsync(async (req, res) => {
  const stats = await userService.getStats();
  ApiResponse.success(res, stats);
});

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  ApiResponse.success(res, { user });
});

/**
 * POST /api/v1/users
 * Create new user (admin only)
 */
const createUser = catchAsync(async (req, res) => {
  const { email, password, name, roleIds } = req.body;
  const user = await userService.createUser({ email, password, name, roleIds });
  ApiResponse.success(res, { user }, 201);
});

/**
 * PUT /api/v1/users/:id
 * Update user
 */
const updateUser = catchAsync(async (req, res) => {
  const { name, email } = req.body;
  const user = await userService.updateUser(req.params.id, { name, email });
  ApiResponse.success(res, { user });
});

/**
 * PUT /api/v1/users/:id/approve
 * Approve user
 */
const approveUser = catchAsync(async (req, res) => {
  const { roleIds } = req.body;
  const user = await userService.approveUser(req.params.id, { roleIds });
  ApiResponse.success(res, { user, message: 'User approved successfully' });
});

/**
 * PUT /api/v1/users/:id/reject
 * Reject user
 */
const rejectUser = catchAsync(async (req, res) => {
  const user = await userService.rejectUser(req.params.id);
  ApiResponse.success(res, { user, message: 'User rejected' });
});

/**
 * PUT /api/v1/users/:id/roles
 * Assign roles to user
 */
const assignRoles = catchAsync(async (req, res) => {
  const { roleIds } = req.body;
  const user = await userService.assignRoles(req.params.id, { roleIds });
  ApiResponse.success(res, { user });
});

/**
 * DELETE /api/v1/users/:id
 * Delete user
 */
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
