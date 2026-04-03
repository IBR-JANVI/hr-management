/**
 * @module authValidators
 * @description Shared validation middleware for authentication routes
 */
const { body, validationResult } = require('express-validator');
const AppError = require('../core/errors/AppError');

const validate = (validations) => async (req, res, next) => {
  try {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new AppError(errors.array()[0].msg, 400);
      return next(error);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const registerValidator = validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').notEmpty().withMessage('Name is required')
]);

const loginValidator = validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
]);

const refreshValidator = validate([
  body('refreshToken').notEmpty().withMessage('Refresh token is required').isString().withMessage('Refresh token must be a string')
]);

const logoutValidator = validate([
  body('refreshToken').optional().isString().withMessage('Refresh token must be a string')
]);

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator
};