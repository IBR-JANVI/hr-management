/**
 * @module controllers/attendanceController
 * @description Handles attendance-related request handlers
 */
const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');
const ApiError = require('../core/errors/AppError');
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
  
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const finalMonth = isNaN(monthNum) ? currentMonth : monthNum;
  const finalYear = isNaN(yearNum) ? currentYear : yearNum;
  
  if (month !== undefined && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
    return ApiResponse.error(res, 'Invalid month. Must be between 1 and 12.', 400);
  }
  
  if (year !== undefined && (isNaN(yearNum) || yearNum <= 0)) {
    return ApiResponse.error(res, 'Invalid year. Must be a positive integer.', 400);
  }

  logger.info("[Attendance] Fetching attendance for month:", finalMonth, "year:", finalYear);
  
  const records = await attendanceService.getUserAttendance(userId, finalMonth, finalYear);

  logger.info("[Attendance] Found records:", records.length);
  ApiResponse.success(res, { records });
});

const getUserAttendanceById = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return ApiResponse.error(res, 'User ID is required', 400);
  }
  
  const { month, year } = req.query;
  
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);
  
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  const finalMonth = isNaN(monthNum) ? currentMonth : monthNum;
  const finalYear = isNaN(yearNum) ? currentYear : yearNum;
  
  if (month !== undefined && (isNaN(monthNum) || monthNum < 1 || monthNum > 12)) {
    return ApiResponse.error(res, 'Invalid month. Must be between 1 and 12.', 400);
  }
  
  if (year !== undefined && (isNaN(yearNum) || yearNum <= 0)) {
    return ApiResponse.error(res, 'Invalid year. Must be a positive integer.', 400);
  }

  const records = await attendanceService.getUserAttendance(userId, finalMonth, finalYear);

  ApiResponse.success(res, { records });
});

module.exports = {
  getUserAttendance,
  getUserAttendanceById
};