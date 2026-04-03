/**
 * @module authRoutes
 * @description Auth Routes - Authentication endpoints
 */
const express = require('express');
const router = express.Router();
const {
  registerValidator,
  loginValidator,
  refreshValidator,
  logoutValidator
} = require('../validators/authValidators');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../core/middleware/auth.middleware');

router.post('/register', registerValidator, authController.register);
router.post('/login', loginValidator, authController.login);
router.post('/refresh', refreshValidator, authController.refreshToken);

router.post('/logout', authMiddleware, logoutValidator, authController.logout);
router.get('/profile', authMiddleware, authController.getProfile);

module.exports = router;