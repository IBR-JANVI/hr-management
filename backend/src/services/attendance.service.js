/**
 * @module attendanceService
 * @description Service layer for attendance management
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @description Get attendance records for a user for a specific month and year
 * @param {string} userId - The user's UUID
 * @param {number} month - Month (1-12)
 * @param {number} year - Year (e.g., 2024)
 * @returns {Promise<Array>} Array of attendance records with formatted date, clockIn, clockOut, totalHours, and status
 * @throws {Error} Prisma client errors
 */
const getUserAttendance = async (userId, month, year) => {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const records = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: start,
        lte: end
      }
    },
    orderBy: {
      date: 'asc'
    }
  });

  return records.map(record => ({
    date: record.date.toISOString().split('T')[0],
    clockIn: record.clockIn ? record.clockIn.toISOString().split('T')[1].slice(0, 5) : null,
    clockOut: record.clockOut ? record.clockOut.toISOString().split('T')[1].slice(0, 5) : null,
    totalHours: record.totalHours,
    status: record.status
  }));
};

module.exports = {
  getUserAttendance
};