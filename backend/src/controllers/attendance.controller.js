const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');
const ApiError = require('../core/errors/AppError');
const attendanceService = require('../services/attendance.service');
const { logger } = require('../config/logger');

const getUserAttendance = catchAsync(async (req, res) => {
  logger.info("[Attendance] Request received for user attendance");
  logger.info("[Attendance] req.user:", req.user);
  
  const { month, year } = req.query;
  const userId = req.user?.id;
  
  if (!userId) {
    logger.error("[Attendance] Error: User ID not found in request");
    return ApiResponse.error(res, 'User ID is required', 401);
  }
  
  logger.info("[Attendance] User ID:", userId);
  
  const monthNum = parseInt(month, 10) || new Date().getMonth() + 1;
  const yearNum = parseInt(year, 10) || new Date().getFullYear();

  logger.info("[Attendance] Fetching attendance for month:", monthNum, "year:", yearNum);
  
  const records = await attendanceService.getUserAttendance(userId, monthNum, yearNum);

  logger.info("[Attendance] Found records:", records.length);
  ApiResponse.success(res, { records });
});

const getUserAttendanceById = catchAsync(async (req, res) => {
  const { userId } = req.params;
  
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return ApiResponse.error(res, 'User ID is required', 400);
  }
  
  const { month, year } = req.query;
  
  const monthNum = parseInt(month, 10) || new Date().getMonth() + 1;
  const yearNum = parseInt(year, 10) || new Date().getFullYear();

  const records = await attendanceService.getUserAttendance(userId, monthNum, yearNum);

  ApiResponse.success(res, { records });
});

module.exports = {
  getUserAttendance,
  getUserAttendanceById
};