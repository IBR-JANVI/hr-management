const catchAsync = require('../core/middleware/asyncHandler');
const ApiResponse = require('../core/utils/ApiResponse');
const attendanceService = require('../services/attendance.service');

const getUserAttendance = catchAsync(async (req, res) => {
  console.log("[Attendance] Request received for user attendance");
  console.log("[Attendance] req.user:", req.user);
  
  const { month, year } = req.query;
  const userId = req.user?.id;
  
  if (!userId) {
    console.log("[Attendance] Error: User ID not found in request");
    return ApiResponse.error(res, 'User ID is required', 401);
  }
  
  console.log("[Attendance] User ID:", userId);
  
  const monthNum = parseInt(month, 10) || new Date().getMonth() + 1;
  const yearNum = parseInt(year, 10) || new Date().getFullYear();

  console.log("[Attendance] Fetching attendance for month:", monthNum, "year:", yearNum);
  
  const records = await attendanceService.getUserAttendance(userId, monthNum, yearNum);

  console.log("[Attendance] Found records:", records.length);
  ApiResponse.success(res, { records });
});

const getUserAttendanceById = catchAsync(async (req, res) => {
  const { userId } = req.params;
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