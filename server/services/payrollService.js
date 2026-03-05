import Attendance from "../models/Attendance.js";
import { getMonthRange } from "../utils/date.js";

export async function calculateAttendanceDeduction({ userId, monthlySalary, month, year, minimumMinutes = 480 }) {
  if (!userId || !monthlySalary || !month || !year) return 0;

  const { start, end } = getMonthRange(month, year);
  const records = await Attendance.find({
    $or: [{ userId }, { employeeId: userId }],
    checkOut: { $ne: null },
    timestamp: { $gte: start, $lt: end },
  }).lean();

  const totalShortMinutes = records.reduce((acc, item) => acc + Math.max(0, Number(item.shortByMinutes) || 0), 0);
  if (totalShortMinutes <= 0) return 0;

  const dailySalary = Number(monthlySalary) / 30;
  const perMinute = dailySalary / Math.max(1, minimumMinutes);
  return Number((perMinute * totalShortMinutes).toFixed(2));
}

export function calculateFinalSalary({ basicSalary = 0, hra = 0, bonus = 0, overtime = 0, deductions = 0, tax = 0, attendanceDeduction = 0 }) {
  const total = Number(basicSalary) + Number(hra) + Number(bonus) + Number(overtime)
    - Number(deductions) - Number(tax) - Number(attendanceDeduction);
  return Math.max(0, Number(total.toFixed(2)));
}
