import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Payroll from "../models/Payroll.js";
import Department from "../models/Department.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDateKey } from "../utils/date.js";

export const adminAnalyticsDashboard = asyncHandler(async (_req, res) => {
  const todayKey = getDateKey();

  const [
    totalEmployees,
    todayAttendance,
    leaveStats,
    departmentStats,
    salaryExpenses,
  ] = await Promise.all([
    Employee.countDocuments(),
    Attendance.countDocuments({ date: todayKey, checkIn: { $ne: null } }),
    LeaveRequest.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
    Department.aggregate([
      {
        $project: {
          name: 1,
          employeeCount: { $size: { $ifNull: ["$employees", []] } },
        },
      },
      { $sort: { employeeCount: -1 } },
    ]),
    Payroll.aggregate([
      { $match: { status: "Paid" } },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalExpense: { $sum: "$finalSalary" },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
    ]),
  ]);

  const attendanceRate = totalEmployees ? Number(((todayAttendance / totalEmployees) * 100).toFixed(2)) : 0;

  const leaveMap = { Pending: 0, Approved: 0, Rejected: 0 };
  leaveStats.forEach((item) => {
    leaveMap[item._id] = item.count;
  });

  return res.json({
    totalEmployees,
    todayAttendance,
    attendanceRate,
    leaveStats: leaveMap,
    departmentDistribution: departmentStats,
    salaryExpenses,
  });
});
