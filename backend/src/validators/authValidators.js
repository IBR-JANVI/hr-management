/**
 * @module authValidators
 * @description Shared validation middleware for authentication routes
 */
const { body, validationResult } = require('express-validator');

const AppError = require('../core/errors/AppError');

const BAD_REQUEST_STATUS = 400;
const PASSWORD_MIN_LENGTH = 8;

const MSG_VALID_EMAIL = 'Valid email is required';
const MSG_PASSWORD_MIN_LENGTH = 'Password must be at least 8 characters';
const MSG_PASSWORD_REQUIRED = 'Password is required';
const MSG_NAME_REQUIRED = 'Name is required';
const MSG_REFRESH_TOKEN_REQUIRED = 'Refresh token is required';
const MSG_REFRESH_TOKEN_STRING = 'Refresh token must be a string';

const validate = (validations) => async (req, res, next) => {
  try {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = new AppError(errors.array()[0].msg, BAD_REQUEST_STATUS);
      return next(error);
    }
    next();
  } catch (err) {
    next(err);
  }
};

const registerValidator = validate([
  body('email').isEmail().withMessage(MSG_VALID_EMAIL),
  body('password').isLength({ min: PASSWORD_MIN_LENGTH }).withMessage(MSG_PASSWORD_MIN_LENGTH).isString(),
  body('name').notEmpty().withMessage(MSG_NAME_REQUIRED).isString()
]);

const loginValidator = validate([
  body('email').isEmail().withMessage(MSG_VALID_EMAIL),
  body('password').notEmpty().withMessage(MSG_PASSWORD_REQUIRED).isString()
]);

const refreshValidator = validate([
  body('refreshToken').notEmpty().withMessage(MSG_REFRESH_TOKEN_REQUIRED).isString().withMessage(MSG_REFRESH_TOKEN_STRING)
]);

const logoutValidator = validate([
  body('refreshToken').optional().isString().withMessage(MSG_REFRESH_TOKEN_STRING)
]);

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator
};