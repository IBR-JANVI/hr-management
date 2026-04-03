/**
 * @module userRoutes
 * @description User Routes - User management endpoints
 */
const express = require('express');
const router = express.Router();
const userController = require('./userController');
const authMiddleware = require('../../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../../core/middleware/rbac.middleware');
const { body, param, validationResult } = require('express-validator');

const validate = (validations) => async (req, res, next) => {
  try {
    for (const validation of validations) {
      await validation.run(req);
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const AppError = require('../../core/errors/AppError');
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

// All routes require authentication
router.use(authMiddleware);

// Public for own profile (handled in controller)
// GET /api/v1/users - List users (requires users:view)
router.get('/', rbacMiddleware('users', 'view'), userController.getAllUsers);

// GET /api/v1/users/stats - Get stats (requires users:view)
router.get('/stats', rbacMiddleware('users', 'view'), userController.getStats);

// GET /api/v1/users/pending - Get pending users (requires users:view)
router.get('/pending', rbacMiddleware('users', 'view'), userController.getPendingUsers);

// GET /api/v1/users/:id - Get user by ID (requires users:view)
router.get('/:id', rbacMiddleware('users', 'view'), userIdValidation, userController.getUserById);

// POST /api/v1/users - Create user (requires users:create)
router.post('/', rbacMiddleware('users', 'create'), createUserValidation, userController.createUser);

// PUT /api/v1/users/:id - Update user (requires users:edit)
router.put('/:id', rbacMiddleware('users', 'edit'), userIdValidation, updateUserValidation, userController.updateUser);

// PUT /api/v1/users/:id/approve - Approve user (requires users:edit)
router.put('/:id/approve', rbacMiddleware('users', 'edit'), userIdValidation, userController.approveUser);

// PUT /api/v1/users/:id/reject - Reject user (requires users:edit)
router.put('/:id/reject', rbacMiddleware('users', 'edit'), userIdValidation, userController.rejectUser);

// PUT /api/v1/users/:id/roles - Assign roles (requires users:edit)
router.put('/:id/roles', rbacMiddleware('users', 'edit'), userIdValidation, userController.assignRoles);

// DELETE /api/v1/users/:id - Delete user (requires users:delete)
router.delete('/:id', rbacMiddleware('users', 'delete'), userIdValidation, userController.deleteUser);

module.exports = router;