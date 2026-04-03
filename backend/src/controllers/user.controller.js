/**
 * @module userController
 * @description Controller module for handling user management routes
 */
const Joi = require('joi');
const userService = require('../services/user.service.js');
const catchAsync = require('../core/middleware/catchAsync');
const ApiResponse = require('../core/utils/ApiResponse');

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().optional(),
  password: Joi.string().min(8).required(),
});

export const userController = {
  getAllUsers: catchAsync(async (req, res) => {
    const users = await userService.findAll();
    ApiResponse.success(res, users);
  }),

  getUserById: catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await userService.findById(id);

    if (!user) {
      return ApiResponse.error(res, { message: 'User not found', code: 'NOT_FOUND' }, 404);
    }

    ApiResponse.success(res, user);
  }),

  createUser: catchAsync(async (req, res) => {
    const { error, value } = userSchema.validate(req.body);

    if (error) {
      return ApiResponse.error(res, { message: error.details[0].message, code: 'VALIDATION_ERROR' }, 400);
    }

    const existingUser = await userService.findByEmail(value.email);
    if (existingUser) {
      return ApiResponse.error(res, { message: 'Email already exists', code: 'CONFLICT' }, 409);
    }

    const user = await userService.create(value);
    ApiResponse.success(res, user, 201);
  }),

  updateUser: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;

    const existingUser = await userService.findById(id);
    if (!existingUser) {
      return ApiResponse.error(res, { message: 'User not found', code: 'NOT_FOUND' }, 404);
    }

    const user = await userService.update(id, { name });
    ApiResponse.success(res, user);
  }),

  deleteUser: catchAsync(async (req, res) => {
    const { id } = req.params;

    const existingUser = await userService.findById(id);
    if (!existingUser) {
      return ApiResponse.error(res, { message: 'User not found', code: 'NOT_FOUND' }, 404);
    }

    await userService.delete(id);
    ApiResponse.success(res, null);
  }),
};

export default userController;
