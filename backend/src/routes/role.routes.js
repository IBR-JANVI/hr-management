/**
 * @module roleRoutes
 * @description Role Routes - Role management endpoints
 */
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware('roles', 'view'), roleController.getAllRoles);

router.get('/:id', rbacMiddleware('roles', 'view'), roleController.getRoleById);

router.post('/', rbacMiddleware('roles', 'create'), roleController.createRole);

router.put('/:id', rbacMiddleware('roles', 'edit'), roleController.updateRole);

router.put('/:id/permissions', rbacMiddleware('roles', 'edit'), roleController.assignPermissions);

router.delete('/:id', rbacMiddleware('roles', 'delete'), roleController.deleteRole);

module.exports = router;