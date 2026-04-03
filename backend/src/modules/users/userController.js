/**
 * @module userController
 * @description User Controller - Handle user management routes
 */
const userService = require('./userService');
const catchAsync = require('../../core/middleware/catchAsync');

/**
 * GET /api/v1/users
 * Get all users (with pagination)
 */
const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  if (isNaN(pageNum) || pageNum < 1) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Invalid page parameter. Must be a positive integer.', code: 'VALIDATION_ERROR' }
    });
  }

  if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
    return res.status(400).json({
      success: false,
      data: null,
      error: { message: 'Invalid limit parameter. Must be between 1 and 100.', code: 'VALIDATION_ERROR' }
    });
  }

  const result = await userService.getAllUsers({
    page: pageNum,
    limit: limitNum,
    status,
    search
  });

  res.status(200).json({
    success: true,
    data: result,
    error: null
  });
});

/**
 * GET /api/v1/users/pending
 * Get pending users
 */
const getPendingUsers = catchAsync(async (req, res) => {
  const users = await userService.getPendingUsers();

  res.status(200).json({
    success: true,
    data: { users },
    error: null
  });
});

/**
 * GET /api/v1/users/stats
 * Get user statistics
 */
const getStats = catchAsync(async (req, res) => {
  const stats = await userService.getStats();

  res.status(200).json({
    success: true,
    data: stats,
    error: null
  });
});

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
const getUserById = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.id);

  res.status(200).json({
    success: true,
    data: { user },
    error: null
  });
});

/**
 * POST /api/v1/users
 * Create new user (admin only)
 */
const createUser = catchAsync(async (req, res) => {
  const { email, password, name, roleIds } = req.body;

  const user = await userService.createUser({ email, password, name, roleIds });

  res.status(201).json({
    success: true,
    data: { user },
    error: null
  });
});

/**
 * PUT /api/v1/users/:id
 * Update user
 */
const updateUser = catchAsync(async (req, res) => {
  const { name, email } = req.body;

  const user = await userService.updateUser(req.params.id, { name, email });

  res.status(200).json({
    success: true,
    data: { user },
    error: null
  });
});

/**
 * PUT /api/v1/users/:id/approve
 * Approve user
 */
const approveUser = catchAsync(async (req, res) => {
  const { roleIds } = req.body;

  const user = await userService.approveUser(req.params.id, { roleIds });

  res.status(200).json({
    success: true,
    data: { user, message: 'User approved successfully' },
    error: null
  });
});

/**
 * PUT /api/v1/users/:id/reject
 * Reject user
 */
const rejectUser = catchAsync(async (req, res) => {
  const user = await userService.rejectUser(req.params.id);

  res.status(200).json({
    success: true,
    data: { user, message: 'User rejected' },
    error: null
  });
});

/**
 * PUT /api/v1/users/:id/roles
 * Assign roles to user
 */
const assignRoles = catchAsync(async (req, res) => {
  const { roleIds } = req.body;

  const user = await userService.assignRoles(req.params.id, { roleIds });

  res.status(200).json({
    success: true,
    data: { user },
    error: null
  });
});

/**
 * DELETE /api/v1/users/:id
 * Delete user
 */
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(req.params.id);

  res.status(200).json({
    success: true,
    data: { message: 'User deleted successfully' },
    error: null
  });
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
