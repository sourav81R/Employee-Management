import LeaveRequest from "../models/LeaveRequest.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { calcDayDiffInclusive } from "../utils/date.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

const YEARLY_PAID_LEAVE_LIMIT = Number(process.env.YEARLY_PAID_LEAVE_LIMIT || 24);

async function calculatePaidUnpaid(userId, startDate, endDate) {
  const totalDays = calcDayDiffInclusive(startDate, endDate);
  if (totalDays <= 0) {
    return { totalDays: 0, paidDays: 0, unpaidDays: 0, salaryCut: false };
  }

  const year = new Date(startDate).getFullYear();
  const used = await LeaveRequest.aggregate([
    {
      $match: {
        userId,
        status: "Approved",
        startDate: {
          $gte: new Date(year, 0, 1),
          $lt: new Date(year + 1, 0, 1),
        },
      },
    },
    {
      $group: {
        _id: null,
        totalPaid: { $sum: "$paidDays" },
      },
    },
  ]);

  const alreadyUsed = Number(used?.[0]?.totalPaid || 0);
  const available = Math.max(0, YEARLY_PAID_LEAVE_LIMIT - alreadyUsed);
  const paidDays = Math.min(available, totalDays);
  const unpaidDays = Math.max(0, totalDays - paidDays);

  return {
    totalDays,
    paidDays,
    unpaidDays,
    salaryCut: unpaidDays > 0,
  };
}

export const createLeaveRequest = asyncHandler(async (req, res) => {
  const { startDate, endDate, reason } = req.body;

  if (!startDate || !endDate || !reason) {
    return res.status(400).json({ message: "startDate, endDate and reason are required" });
  }

  const calculation = await calculatePaidUnpaid(req.user._id, startDate, endDate);
  if (calculation.totalDays <= 0) {
    return res.status(400).json({ message: "Invalid leave dates" });
  }

  const leave = await LeaveRequest.create({
    userId: req.user._id,
    startDate,
    endDate,
    reason,
    ...calculation,
  });

  await createAuditLog({
    userId: req.user._id,
    action: "leave requested",
    targetType: "LeaveRequest",
    targetId: leave._id,
  });

  return res.status(201).json({
    ...leave.toObject(),
    policyMessage: calculation.unpaidDays > 0
      ? `Request submitted. ${calculation.unpaidDays} day(s) exceed yearly paid leave allowance and will be unpaid.`
      : "Request submitted successfully.",
  });
});

export const updateLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  const role = String(req.user.role || "").toLowerCase();
  if (String(leave.userId) !== String(req.user._id) && role !== "admin" && role !== "hr") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (leave.status !== "Pending") {
    return res.status(400).json({ message: "Only pending leave can be updated" });
  }

  const nextStart = req.body.startDate || leave.startDate;
  const nextEnd = req.body.endDate || leave.endDate;
  const calculation = await calculatePaidUnpaid(leave.userId, nextStart, nextEnd);

  leave.startDate = nextStart;
  leave.endDate = nextEnd;
  leave.reason = req.body.reason || leave.reason;
  leave.totalDays = calculation.totalDays;
  leave.paidDays = calculation.paidDays;
  leave.unpaidDays = calculation.unpaidDays;
  leave.salaryCut = calculation.salaryCut;

  await leave.save();

  await createAuditLog({
    userId: req.user._id,
    action: "leave request updated",
    targetType: "LeaveRequest",
    targetId: leave._id,
  });

  return res.json({ leave, policyMessage: "Leave request updated successfully." });
});

export const deleteLeaveRequest = asyncHandler(async (req, res) => {
  const leave = await LeaveRequest.findById(req.params.id);
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  const role = String(req.user.role || "").toLowerCase();
  if (String(leave.userId) !== String(req.user._id) && role !== "admin" && role !== "hr") {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (leave.status === "Approved" && role !== "admin") {
    return res.status(400).json({ message: "Approved leave cannot be deleted" });
  }

  await leave.deleteOne();

  await createAuditLog({
    userId: req.user._id,
    action: "leave request deleted",
    targetType: "LeaveRequest",
    targetId: req.params.id,
  });

  return res.json({ message: "Leave request deleted successfully" });
});

export const myLeaveRequests = asyncHandler(async (req, res) => {
  const requests = await LeaveRequest.find({ userId: req.user._id }).sort({ createdAt: -1 });
  return res.json(requests);
});

export const clearMyLeaveRequests = asyncHandler(async (req, res) => {
  await LeaveRequest.deleteMany({ userId: req.user._id });

  await createAuditLog({
    userId: req.user._id,
    action: "leave history cleared",
    targetType: "LeaveRequest",
    targetId: req.user._id,
  });

  return res.json({ message: "Leave history cleared" });
});

export const pendingLeaveRequests = asyncHandler(async (req, res) => {
  const role = String(req.user.role || "").toLowerCase();

  let query = { status: "Pending" };

  if (role === "manager") {
    const teamUsers = await User.find({ managerId: req.user._id }).select("_id");
    query = { ...query, userId: { $in: teamUsers.map((item) => item._id) } };
  }

  if (role === "hr") {
    const hrUsers = await User.find({ role: "hr" }).select("_id");
    query.userId = { ...(query.userId || {}), $nin: hrUsers.map((item) => item._id) };
  }

  const requests = await LeaveRequest.find(query).populate("userId", "name email role").sort({ createdAt: -1 });
  return res.json(requests);
});

export const approveLeaveRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Approved", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "status must be Approved or Rejected" });
  }

  const leave = await LeaveRequest.findById(req.params.id).populate("userId", "name email");
  if (!leave) return res.status(404).json({ message: "Leave request not found" });

  leave.status = status;
  leave.approvedBy = req.user._id;
  await leave.save();

  await createNotification({
    userId: leave.userId._id,
    title: `Leave ${status}`,
    message: `Your leave request (${new Date(leave.startDate).toLocaleDateString()} - ${new Date(leave.endDate).toLocaleDateString()}) was ${status.toLowerCase()}.`,
    type: "leave",
  });

  await createAuditLog({
    userId: req.user._id,
    action: `leave ${status.toLowerCase()}`,
    targetType: "LeaveRequest",
    targetId: leave._id,
  });

  return res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
});

export const leaveSummaryReport = asyncHandler(async (req, res) => {
  const year = Number(req.query.year) || new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const summary = await LeaveRequest.aggregate([
    {
      $match: {
        startDate: { $gte: start, $lt: end },
      },
    },
    {
      $group: {
        _id: "$userId",
        totalRequests: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "Rejected"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        paidDays: { $sum: "$paidDays" },
        unpaidDays: { $sum: "$unpaidDays" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 0,
        userId: "$user._id",
        name: "$user.name",
        email: "$user.email",
        role: "$user.role",
        totalRequests: 1,
        approved: 1,
        rejected: 1,
        pending: 1,
        paidDays: 1,
        unpaidDays: 1,
      },
    },
    { $sort: { name: 1 } },
  ]);

  return res.json({ year, employees: summary });
});

export const adminLeaves = asyncHandler(async (_req, res) => {
  const leaves = await LeaveRequest.find().populate("userId", "name email role").sort({ createdAt: -1 });
  return res.json(leaves);
});
