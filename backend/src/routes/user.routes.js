/**
 * @module userRoutes
 * @description User Routes - User management endpoints
 */
const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');
const { body, param, validationResult } = require('express-validator');

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

const createUserValidation = validate([
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').optional().isString()
]);

const userIdValidation = validate([
  param('id').isUUID().withMessage('Valid user ID is required')
]);

const updateUserValidation = validate([
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('name').optional().isString()
]);

router.use(authMiddleware);

router.get('/', rbacMiddleware('users', 'view'), userController.getAllUsers);

router.get('/stats', rbacMiddleware('users', 'view'), userController.getStats);

router.get('/pending', rbacMiddleware('users', 'view'), userController.getPendingUsers);

router.get('/:id', rbacMiddleware('users', 'view'), userIdValidation, userController.getUserById);

router.post('/', rbacMiddleware('users', 'create'), createUserValidation, userController.createUser);

router.put('/:id', rbacMiddleware('users', 'edit'), userIdValidation, updateUserValidation, userController.updateUser);

router.put('/:id/approve', rbacMiddleware('users', 'edit'), userIdValidation, userController.approveUser);

router.put('/:id/reject', rbacMiddleware('users', 'edit'), userIdValidation, userController.rejectUser);

router.put('/:id/roles', rbacMiddleware('users', 'edit'), userIdValidation, userController.assignRoles);

router.delete('/:id', rbacMiddleware('users', 'delete'), userIdValidation, userController.deleteUser);

module.exports = router;