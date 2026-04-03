/**
 * @module permissionRoutes
 * @description Permission Routes - Permission management endpoints
 */
const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permission.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

router.use(authMiddleware);

router.get('/', rbacMiddleware('permissions', 'view'), permissionController.getAllPermissions);

router.get('/modules', rbacMiddleware('permissions', 'view'), permissionController.getAllModules);

router.get('/:id', rbacMiddleware('permissions', 'view'), permissionController.getPermissionById);

router.post('/', rbacMiddleware('permissions', 'create'), permissionController.createPermission);

router.put('/:id', rbacMiddleware('permissions', 'edit'), permissionController.updatePermission);

router.delete('/:id', rbacMiddleware('permissions', 'delete'), permissionController.deletePermission);

module.exports = router;