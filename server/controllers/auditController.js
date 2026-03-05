import AuditLog from "../models/AuditLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const listAuditLogs = asyncHandler(async (req, res) => {
  const { userId, action, targetType, limit = 200 } = req.query;

  const query = {};
  if (userId) query.userId = userId;
  if (action) query.action = { $regex: String(action), $options: "i" };
  if (targetType) query.targetType = { $regex: String(targetType), $options: "i" };

  const logs = await AuditLog.find(query)
    .populate("userId", "name email role")
    .sort({ timestamp: -1 })
    .limit(Math.min(Number(limit) || 200, 1000));

  return res.json(logs);
});
