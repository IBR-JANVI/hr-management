/**
 * @module attendanceValidators
 * @description Attendance validation middleware
 */
const { check, param } = require('express-validator');

const attendanceValidators = {
  monthChain: check('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Invalid month. Must be between 1 and 12.'),
  
  yearChain: check('year')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid year. Must be a positive integer.'),
  
  userIdChain: param('userId')
    .exists()
    .isString()
    .notEmpty()
    .withMessage('User ID is required')
};

module.exports = { attendanceValidators };
