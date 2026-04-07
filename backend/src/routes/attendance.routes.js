/**
 * @module attendance.routes
 * @description Routes for attendance endpoints
 */
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');
const ApiResponse = require('../core/utils/ApiResponse');

const validateAttendanceQuery = (req, res, next) => {
  const { month, year } = req.query;
  
  if (month !== undefined) {
    if (!/^\d+$/.test(month)) {
      return ApiResponse.error(res, { message: 'Invalid month. Must be a numeric value.', code: 'INVALID_INPUT' }, 400);
    }
    const monthNum = Number(month);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return ApiResponse.error(res, { message: 'Invalid month. Must be between 1 and 12.', code: 'INVALID_INPUT' }, 400);
    }
  }
  
  if (year !== undefined) {
    if (!/^\d+$/.test(year)) {
      return ApiResponse.error(res, { message: 'Invalid year. Must be a numeric value.', code: 'INVALID_INPUT' }, 400);
    }
    const yearNum = Number(year);
    if (!Number.isInteger(yearNum) || yearNum <= 0) {
      return ApiResponse.error(res, { message: 'Invalid year. Must be a positive integer.', code: 'INVALID_INPUT' }, 400);
    }
  }
  
  next();
};

const validateUserIdParam = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return ApiResponse.error(res, { message: 'User ID is required', code: 'INVALID_INPUT' }, 400);
  }
  
  next();
};

router.use(authMiddleware);

router.get('/my-attendance', validateAttendanceQuery, attendanceController.getUserAttendance);
router.get('/user/:userId', rbacMiddleware('attendance', 'view'), validateUserIdParam, validateAttendanceQuery, attendanceController.getUserAttendanceById);

module.exports = router;