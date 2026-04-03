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

router.post('/users', registerValidator, authController.register);
router.post('/sessions', loginValidator, authController.login);
router.post('/tokens', refreshValidator, authController.refreshToken);

router.delete('/sessions', authMiddleware, logoutValidator, authController.logout);
router.get('/profiles/me', authMiddleware, authController.getProfile);

module.exports = router;