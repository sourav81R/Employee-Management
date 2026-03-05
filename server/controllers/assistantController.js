import Attendance from "../models/Attendance.js";
import LeaveRequest from "../models/LeaveRequest.js";
import Task from "../models/Task.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDateKey } from "../utils/date.js";

function summarizePrompt(prompt) {
  const trimmed = String(prompt || "").trim();
  if (!trimmed) return "Please ask a specific question.";
  return `You asked: \"${trimmed}\"`;
}

export const assistantChat = asyncHandler(async (req, res) => {
  const prompt = String(req.body?.prompt || "");
  const role = String(req.user?.role || "employee").toLowerCase();

  const [todayAttendance, myLeaves, myTasks] = await Promise.all([
    Attendance.findOne({ $or: [{ userId: req.user._id }, { employeeId: req.user._id }], date: getDateKey() }).lean(),
    LeaveRequest.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(3).lean(),
    Task.find({ assignedTo: req.user._id }).sort({ createdAt: -1 }).limit(3).lean(),
  ]);

  const attendanceLine = todayAttendance?.checkIn
    ? `Today attendance: checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString()}${todayAttendance.checkOut ? ` and checked out at ${new Date(todayAttendance.checkOut).toLocaleTimeString()}.` : "."}`
    : "Today attendance: not checked in yet.";

  const leaveLine = `Recent leave requests: ${myLeaves.length ? myLeaves.map((item) => `${item.status} (${new Date(item.startDate).toLocaleDateString()}-${new Date(item.endDate).toLocaleDateString()})`).join(", ") : "none"}.`;
  const taskLine = `Recent tasks: ${myTasks.length ? myTasks.map((item) => `${item.title} [${item.status}]`).join(", ") : "none"}.`;

  const answer = [
    summarizePrompt(prompt),
    `Role: ${role}.`,
    attendanceLine,
    leaveLine,
    taskLine,
  ].join(" ");

  return res.json({ answer });
});
