import Shift from "../models/Shift.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";

export const createShift = asyncHandler(async (req, res) => {
  const { name, startTime, endTime, workHours } = req.body;
  if (!name || !startTime || !endTime || !workHours) {
    return res.status(400).json({ message: "name, startTime, endTime, workHours are required" });
  }

  const shift = await Shift.create({ name, startTime, endTime, workHours });

  await createAuditLog({
    userId: req.user._id,
    action: "shift created",
    targetType: "Shift",
    targetId: shift._id,
  });

  return res.status(201).json(shift);
});

export const listShifts = asyncHandler(async (_req, res) => {
  const shifts = await Shift.find().sort({ createdAt: -1 });
  return res.json(shifts);
});

export const updateShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  return res.json(shift);
});

export const deleteShift = asyncHandler(async (req, res) => {
  const shift = await Shift.findByIdAndDelete(req.params.id);
  if (!shift) return res.status(404).json({ message: "Shift not found" });
  return res.json({ message: "Shift deleted" });
});

export const assignShiftToEmployee = asyncHandler(async (req, res) => {
  const { userId, shiftId } = req.body;
  if (!userId || !shiftId) return res.status(400).json({ message: "userId and shiftId are required" });

  const [user, shift] = await Promise.all([
    User.findById(userId),
    Shift.findById(shiftId),
  ]);

  if (!user || !shift) return res.status(404).json({ message: "User or shift not found" });

  user.shiftId = shiftId;
  await user.save();

  await Employee.updateMany(
    { $or: [{ userId }, { email: String(user.email || "").toLowerCase().trim() }] },
    { $set: { shiftId } }
  );

  await createAuditLog({
    userId: req.user._id,
    action: "shift assigned",
    targetType: "Shift",
    targetId: shift._id,
    metadata: { assignedUserId: userId },
  });

  return res.json({ message: "Shift assigned successfully" });
});

export const myShift = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate("shiftId");
  return res.json(user?.shiftId || null);
});
