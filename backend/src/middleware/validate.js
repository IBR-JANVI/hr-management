/**
 * @module validate
 * @description Shared validation middleware factory
 */
const { validationResult } = require('express-validator');
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

module.exports = { validate };