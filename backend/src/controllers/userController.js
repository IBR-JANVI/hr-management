import Joi from 'joi';
import userService from '../services/user.service.js';

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  name: Joi.string().optional(),
  password: Joi.string().min(8).required(),
});

export const userController = {
  async getAllUsers(req, res, next) {
    try {
      const users = await userService.findAll();
      res.json({
        success: true,
        data: users,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req, res, next) {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'User not found',
            code: 'NOT_FOUND',
          },
        });
      }

      res.json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async createUser(req, res, next) {
    try {
      const { error, value } = userSchema.validate(req.body);

      if (error) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            message: error.details[0].message,
            code: 'VALIDATION_ERROR',
          },
        });
      }

      const existingUser = await userService.findByEmail(value.email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          data: null,
          error: {
            message: 'Email already exists',
            code: 'CONFLICT',
          },
        });
      }

      const user = await userService.create(value);
      res.status(201).json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const { name } = req.body;

      const existingUser = await userService.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'User not found',
            code: 'NOT_FOUND',
          },
        });
      }

      const user = await userService.update(id, { name });
      res.json({
        success: true,
        data: user,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;

      const existingUser = await userService.findById(id);
      if (!existingUser) {
        return res.status(404).json({
          success: false,
          data: null,
          error: {
            message: 'User not found',
            code: 'NOT_FOUND',
          },
        });
      }

      await userService.delete(id);
      res.json({
        success: true,
        data: null,
        error: null,
      });
    } catch (error) {
      next(error);
    }
  },
};

export default userController;
