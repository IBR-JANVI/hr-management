/**
 * @module roleRoutes
 * @description Role Routes - Role management endpoints
 */
const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

const createRoleValidator = validate([
  body('name').notEmpty().withMessage('Role name is required').isString(),
  body('description').optional().isString(),
  body('isDefault').optional().isBoolean(),
  body('permissionIds').optional().isArray()
]);

const updateRoleValidator = validate([
  param('id').isUUID().withMessage('Valid role ID is required'),
  body('name').optional().isString(),
  body('description').optional().isString(),
  body('isDefault').optional().isBoolean(),
  body('permissionIds').optional().isArray()
]);

const assignPermissionsValidator = validate([
  param('id').isUUID().withMessage('Valid role ID is required'),
  body('permissionIds').isArray().withMessage('Permission IDs must be an array')
]);

router.use(authMiddleware);

router.get('/', rbacMiddleware('roles', 'view'), roleController.getAllRoles);

router.get('/:id', rbacMiddleware('roles', 'view'), roleController.getRoleById);

router.post('/', rbacMiddleware('roles', 'create'), createRoleValidator, roleController.createRole);

router.put('/:id', rbacMiddleware('roles', 'edit'), updateRoleValidator, roleController.updateRole);

router.put('/:id/permissions', rbacMiddleware('roles', 'edit'), assignPermissionsValidator, roleController.assignPermissions);

router.delete('/:id', rbacMiddleware('roles', 'delete'), roleController.deleteRole);

module.exports = router;