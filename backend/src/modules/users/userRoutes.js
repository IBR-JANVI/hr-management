/**
 * User Routes - User management endpoints
 */
const express = require('express');
const router = express.Router();
const userController = require('./userController');
const authMiddleware = require('../../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../../core/middleware/rbac.middleware');

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
router.get('/:id', rbacMiddleware('users', 'view'), userController.getUserById);

// POST /api/v1/users - Create user (requires users:create)
router.post('/', rbacMiddleware('users', 'create'), userController.createUser);

// PUT /api/v1/users/:id - Update user (requires users:edit)
router.put('/:id', rbacMiddleware('users', 'edit'), userController.updateUser);

// PUT /api/v1/users/:id/approve - Approve user (requires users:edit)
router.put('/:id/approve', rbacMiddleware('users', 'edit'), userController.approveUser);

// PUT /api/v1/users/:id/reject - Reject user (requires users:edit)
router.put('/:id/reject', rbacMiddleware('users', 'edit'), userController.rejectUser);

// PUT /api/v1/users/:id/roles - Assign roles (requires users:edit)
router.put('/:id/roles', rbacMiddleware('users', 'edit'), userController.assignRoles);

// DELETE /api/v1/users/:id - Delete user (requires users:delete)
router.delete('/:id', rbacMiddleware('users', 'delete'), userController.deleteUser);

module.exports = router;
