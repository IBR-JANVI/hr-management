/**
 * @module authRoutes
 * @description Auth Routes - Authentication endpoints
 */
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../core/middleware/auth.middleware');

const validate = (validations) => async (req, res, next) => {
  try {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const AppError = require('../core/errors/AppError');
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
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
]);

const logoutValidator = validate([
  body('refreshToken').optional()
]);

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshValidator, authController.refreshToken);

router.post('/logout', authMiddleware, logoutValidator, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;