/**
 * @module controllers/attendanceController
 * @description Handles attendance-related request handlers
 */
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');
const attendanceService = require('../services/attendance.service');
const { logger } = require('../config/logger');

const getUserAttendance = catchAsync(async (req, res) => {
  logger.info("[Attendance] Request received for user attendance");
  
  const { month, year } = req.query;
  const userId = req.user?.id;
  
  if (!userId) {
    logger.error("[Attendance] Error: User ID not found in request");
    return ApiResponse.error(res, 'User ID is required', 401);
  }
  
  logger.info("[Attendance] User ID:", userId);
  logger.info("[Attendance] Fetching attendance for month:", month, "year:", year);
  
  const records = await attendanceService.getUserAttendance(userId, month, year);

  logger.info("[Attendance] Found records:", records.length);
  ApiResponse.success(res, { records });
});

const getUserAttendanceById = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return ApiResponse.error(res, 'User ID is required', 400);
  }
  
  const { month, year } = req.query;

  const records = await attendanceService.getUserAttendance(userId, month, year);

  ApiResponse.success(res, { records });
});

module.exports = {
  getUserAttendance,
  getUserAttendanceById
};