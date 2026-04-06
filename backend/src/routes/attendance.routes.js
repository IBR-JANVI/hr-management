const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authMiddleware = require('../core/middleware/auth.middleware');
const { rbacMiddleware } = require('../core/middleware/rbac.middleware');

router.use(authMiddleware);

router.get('/my-attendance', attendanceController.getUserAttendance);
router.get('/user/:userId', rbacMiddleware('attendance', 'view'), attendanceController.getUserAttendanceById);

module.exports = router;