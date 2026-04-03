/**
 * @module roleValidators
 * @description Role validation middleware
 */
const { body, param } = require('express-validator');
const { validate } = require('../middleware/validate');

const createRoleValidator = validate([
  body('name').notEmpty().withMessage('Role name is required').isString(),
  body('description').optional().isString(),
  body('isDefault').optional().isBoolean(),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be a valid UUID')
]);

const updateRoleValidator = validate([
  param('id').isUUID().withMessage('Valid role ID is required'),
  body('name').optional().notEmpty().isString(),
  body('description').optional().isString(),
  body('isDefault').optional().isBoolean(),
  body('permissionIds').optional().isArray(),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be a valid UUID')
]);

const assignPermissionsValidator = validate([
  param('id').isUUID().withMessage('Valid role ID is required'),
  body('permissionIds').isArray().withMessage('Permission IDs must be an array'),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be a valid UUID')
]);

const idParamValidator = validate([
  param('id').isUUID().withMessage('Valid role ID is required')
]);

module.exports = {
  createRoleValidator,
  updateRoleValidator,
  assignPermissionsValidator,
  idParamValidator
};