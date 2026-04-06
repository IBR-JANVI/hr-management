const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getUserAttendance = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);

  const records = await prisma.attendance.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate
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