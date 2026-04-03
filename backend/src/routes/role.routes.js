/**
 * @module roleRoutes
 * @description Role Routes - Role management endpoints
 */
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');
const { createRoleValidator, updateRoleValidator, assignPermissionsValidator, idParamValidator } = require('../validators/role.validators');

router.use(authMiddleware);

router.get('/', rbacMiddleware('roles', 'view'), roleController.getAllRoles);

router.get('/:id', rbacMiddleware('roles', 'view'), idParamValidator, roleController.getRoleById);

router.post('/', rbacMiddleware('roles', 'create'), createRoleValidator, roleController.createRole);

router.put('/:id', rbacMiddleware('roles', 'edit'), updateRoleValidator, roleController.updateRole);

router.put('/:id/permissions', rbacMiddleware('roles', 'edit'), assignPermissionsValidator, roleController.assignPermissions);

router.delete('/:id', rbacMiddleware('roles', 'delete'), idParamValidator, roleController.deleteRole);

module.exports = router;