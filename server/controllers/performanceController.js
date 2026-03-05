import PerformanceReview from "../models/PerformanceReview.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

function calculateOverallScore(payload) {
  const values = [
    Number(payload.communication) || 0,
    Number(payload.technicalSkill) || 0,
    Number(payload.teamwork) || 0,
    Number(payload.problemSolving) || 0,
  ];
  const sum = values.reduce((acc, value) => acc + value, 0);
  return Number((sum / values.length).toFixed(2));
}

export const createPerformanceReview = asyncHandler(async (req, res) => {
  const { employeeId, period, communication = 0, technicalSkill = 0, teamwork = 0, problemSolving = 0, feedback = "" } = req.body;

  if (!employeeId || !period) {
    return res.status(400).json({ message: "employeeId and period are required" });
  }

  let targetUser = await User.findById(employeeId).select("_id");
  if (!targetUser) {
    const employeeDoc = await Employee.findById(employeeId).select("userId");
    if (employeeDoc?.userId) {
      targetUser = await User.findById(employeeDoc.userId).select("_id");
    }
  }

  if (!targetUser) return res.status(404).json({ message: "Employee not found" });

  const overallScore = calculateOverallScore({ communication, technicalSkill, teamwork, problemSolving });

  const review = await PerformanceReview.create({
    employeeId: targetUser._id,
    reviewerId: req.user._id,
    period,
    ratings: overallScore,
    communication,
    technicalSkill,
    teamwork,
    problemSolving,
    overallScore,
    feedback,
  });

  await createNotification({
    userId: targetUser._id,
    title: "Performance Review Added",
    message: `A new performance review (${period}) has been added.`,
    type: "performance",
  });

  await createAuditLog({
    userId: req.user._id,
    action: "performance review created",
    targetType: "PerformanceReview",
    targetId: review._id,
  });

  return res.status(201).json(review);
});

export const myPerformanceReviews = asyncHandler(async (req, res) => {
  const reviews = await PerformanceReview.find({ employeeId: req.user._id })
    .populate("reviewerId", "name email role")
    .sort({ createdAt: -1 });

  return res.json(reviews);
});

export const employeePerformanceHistory = asyncHandler(async (req, res) => {
  const reviews = await PerformanceReview.find({ employeeId: req.params.employeeId })
    .populate("reviewerId", "name email role")
    .sort({ createdAt: -1 });

  return res.json(reviews);
});

export const performanceAnalytics = asyncHandler(async (_req, res) => {
  const stats = await PerformanceReview.aggregate([
    {
      $group: {
        _id: "$employeeId",
        avgScore: { $avg: "$overallScore" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "employee",
      },
    },
    { $unwind: "$employee" },
    {
      $project: {
        _id: 0,
        employeeId: "$employee._id",
        name: "$employee.name",
        email: "$employee.email",
        avgScore: { $round: ["$avgScore", 2] },
        reviews: "$count",
      },
    },
    { $sort: { avgScore: -1 } },
  ]);

  return res.json(stats);
});
