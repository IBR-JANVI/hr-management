/**
 * @module permissionRoutes
 * @description Permission Routes - Permission management endpoints
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const permissionController = require('../controllers/permission.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

const createPermissionValidator = validate([
  body('module').trim().notEmpty().withMessage('Module is required').isString(),
  body('action').trim().notEmpty().withMessage('Action is required').isString()
]);

const updatePermissionValidator = validate([
  param('id').isUUID().withMessage('Valid permission ID is required'),
  body('module').optional().trim().notEmpty().isString(),
  body('action').optional().trim().notEmpty().isString()
]);

router.use(authMiddleware);

router.get('/', rbacMiddleware('permissions', 'view'), permissionController.getAllPermissions);

router.get('/modules', rbacMiddleware('permissions', 'view'), permissionController.getAllModules);

router.get('/:id', rbacMiddleware('permissions', 'view'), permissionController.getPermissionById);

router.post('/', rbacMiddleware('permissions', 'create'), createPermissionValidator, permissionController.createPermission);

router.put('/:id', rbacMiddleware('permissions', 'edit'), updatePermissionValidator, permissionController.updatePermission);

router.delete('/:id', rbacMiddleware('permissions', 'delete'), permissionController.deletePermission);

module.exports = router;