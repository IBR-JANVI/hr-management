/**
 * @module userController
 * @description Controller module for handling user management routes
 */
const userService = require('../services/user.service.js');
const catchAsync = require('../core/middleware/catchAsync');
const ApiResponse = require('../core/utils/ApiResponse');

export const userController = {
  getAllUsers: catchAsync(async (req, res) => {
    const users = await userService.findAll({});
    ApiResponse.success(res, users);
  }),

  getUserById: catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await userService.findById(id);
    ApiResponse.success(res, user);
  }),

  createUser: catchAsync(async (req, res) => {
    const { email, name, password } = req.body;
    const user = await userService.create({ email, name, password });
    ApiResponse.success(res, user, 201);
  }),

  updateUser: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const user = await userService.update(id, { name });
    ApiResponse.success(res, user);
  }),

  deleteUser: catchAsync(async (req, res) => {
    const { id } = req.params;
    await userService.delete(id);
    ApiResponse.success(res, null);
  }),
};

export default userController;
