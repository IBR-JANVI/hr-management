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
    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json(ApiResponse.error({ message: 'Invalid month. Must be between 1 and 12.', code: 'INVALID_INPUT' }));
    }
  }
  
  if (year !== undefined) {
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum <= 0) {
      return res.status(400).json(ApiResponse.error({ message: 'Invalid year. Must be a positive integer.', code: 'INVALID_INPUT' }));
    }
  }
  
  next();
};

const validateUserIdParam = (req, res, next) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return res.status(400).json(ApiResponse.error({ message: 'User ID is required', code: 'INVALID_INPUT' }));
  }
  
  next();
};

router.use(authMiddleware);

router.get('/my-attendance', validateAttendanceQuery, attendanceController.getUserAttendance);
router.get('/user/:userId', rbacMiddleware('attendance', 'view'), validateUserIdParam, validateAttendanceQuery, attendanceController.getUserAttendanceById);

module.exports = router;