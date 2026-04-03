/**
 * @module permissionRoutes
 * @description Permission Routes - Permission management endpoints
 */
const express = require('express');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');
const permissionController = require('../controllers/permission.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

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

const createPermissionValidator = validate([
  body('module').notEmpty().withMessage('Module is required').isString(),
  body('action').notEmpty().withMessage('Action is required').isString()
]);

const updatePermissionValidator = validate([
  param('id').isUUID().withMessage('Valid permission ID is required'),
  body('module').optional().isString(),
  body('action').optional().isString()
]);

router.use(authMiddleware);

router.get('/', rbacMiddleware('permissions', 'view'), permissionController.getAllPermissions);

router.get('/modules', rbacMiddleware('permissions', 'view'), permissionController.getAllModules);

router.get('/:id', rbacMiddleware('permissions', 'view'), permissionController.getPermissionById);

router.post('/', rbacMiddleware('permissions', 'create'), createPermissionValidator, permissionController.createPermission);

router.put('/:id', rbacMiddleware('permissions', 'edit'), updatePermissionValidator, permissionController.updatePermission);

router.delete('/:id', rbacMiddleware('permissions', 'delete'), permissionController.deletePermission);

module.exports = router;