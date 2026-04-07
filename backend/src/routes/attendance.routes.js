/**
 * @module attendance.routes
 * @description Routes for attendance endpoints
 */
const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');
const { validate } = require('../middleware/validate');
const { attendanceValidators } = require('../validators/attendance.validators');

router.use(authMiddleware);

router.get('/my-attendance', validate([attendanceValidators.monthChain, attendanceValidators.yearChain]), attendanceController.getUserAttendance);
router.get('/user/:userId', rbacMiddleware('attendance', 'view'), validate([attendanceValidators.userIdChain, attendanceValidators.monthChain, attendanceValidators.yearChain]), attendanceController.getUserAttendanceById);

module.exports = router;
