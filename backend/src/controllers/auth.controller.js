/**
 * @module authController
 * @description Auth Controller - Handle authentication routes
 */
const authService = require('../services/auth.service');
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const user = await authService.register({ email, password, name });
  ApiResponse.success(res, { user, message: 'Registration successful. Please wait for admin approval to login.' }, 201);
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login({ email, password });
  ApiResponse.success(res, result);
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken({ refreshToken });
  ApiResponse.success(res, result);
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  await authService.logout({ refreshToken, userId: req.user.id });
  ApiResponse.success(res, { message: 'Logged out successfully' });
});

const getProfile = catchAsync(async (req, res) => {
  const user = await authService.getProfile(req.user.id);
  ApiResponse.success(res, { user });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getProfile
};