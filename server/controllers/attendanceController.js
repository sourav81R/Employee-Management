import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Shift from "../models/Shift.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { getDateKey } from "../utils/date.js";
import { createAuditLog } from "../services/auditService.js";

async function resolveMinimumHours(userId) {
  const [user, employee] = await Promise.all([
    User.findById(userId).select("shiftId"),
    Employee.findOne({ $or: [{ userId }, { managerId: userId }] }).select("shiftId"),
  ]);

  const shiftId = user?.shiftId || employee?.shiftId;
  if (!shiftId) return { minimumRequiredHours: 8, minimumRequiredMinutes: 480, shiftId: null };

  const shift = await Shift.findById(shiftId).select("workHours");
  if (!shift) return { minimumRequiredHours: 8, minimumRequiredMinutes: 480, shiftId: null };

  const hours = Number(shift.workHours) || 8;
  return { minimumRequiredHours: hours, minimumRequiredMinutes: Math.round(hours * 60), shiftId };
}

function withUserRef(userId) {
  return {
    $or: [{ userId }, { employeeId: userId }],
  };
}

export const markAttendanceLegacy = asyncHandler(async (req, res) => {
  const { photo, latitude, longitude, locationName = "", deviceType = "", date } = req.body;
  const dateKey = date || getDateKey();

  const minReq = await resolveMinimumHours(req.user._id);

  const attendance = await Attendance.create({
    userId: req.user._id,
    employeeId: req.user._id,
    photoUrl: photo,
    latitude,
    longitude,
    locationName,
    deviceType,
    date: dateKey,
    timestamp: new Date(),
    checkIn: new Date(),
    ...minReq,
  });

  await createAuditLog({
    userId: req.user._id,
    action: "attendance marked",
    targetType: "Attendance",
    targetId: attendance._id,
  });

  return res.status(201).json(attendance);
});

export const checkIn = asyncHandler(async (req, res) => {
  const { photo, latitude, longitude, locationName = "", deviceType = "", date } = req.body;
  const dateKey = date || getDateKey();

  const existing = await Attendance.findOne({ ...withUserRef(req.user._id), date: dateKey });
  if (existing?.checkIn) {
    return res.status(400).json({ message: "Already checked in for this date", attendance: existing });
  }

  const minReq = await resolveMinimumHours(req.user._id);

  const attendance = await Attendance.findOneAndUpdate(
    { ...withUserRef(req.user._id), date: dateKey },
    {
      $set: {
        userId: req.user._id,
        employeeId: req.user._id,
        photoUrl: photo,
        latitude,
        longitude,
        locationName,
        deviceType,
        date: dateKey,
        timestamp: new Date(),
        checkIn: new Date(),
        ...minReq,
      },
    },
    { upsert: true, new: true }
  );

  await createAuditLog({
    userId: req.user._id,
    action: "attendance check-in",
    targetType: "Attendance",
    targetId: attendance._id,
  });

  return res.status(201).json(attendance);
});

export const checkOut = asyncHandler(async (req, res) => {
  const dateKey = req.body?.date || getDateKey();
  const attendance = await Attendance.findOne({ ...withUserRef(req.user._id), date: dateKey });

  if (!attendance || !attendance.checkIn) {
    return res.status(404).json({ message: "No check-in found for today" });
  }

  if (attendance.checkOut) {
    return res.status(400).json({ message: "Already checked out", attendance });
  }

  const checkIn = new Date(attendance.checkIn || attendance.timestamp);
  const checkOutAt = new Date();
  const workedMinutes = Math.max(0, Math.floor((checkOutAt - checkIn) / (1000 * 60)));
  const minimumMinutes = Number(attendance.minimumRequiredMinutes) || 480;
  const shortByMinutes = Math.max(0, minimumMinutes - workedMinutes);

  attendance.checkOut = checkOutAt;
  attendance.workedMinutes = workedMinutes;
  attendance.shortByMinutes = shortByMinutes;
  attendance.salaryCut = shortByMinutes > 0;
  await attendance.save();

  await createAuditLog({
    userId: req.user._id,
    action: "attendance check-out",
    targetType: "Attendance",
    targetId: attendance._id,
    metadata: { workedMinutes, shortByMinutes },
  });

  return res.json(attendance);
});

export const todayAttendance = asyncHandler(async (req, res) => {
  const dateKey = req.query?.date || getDateKey();
  const attendance = await Attendance.findOne({ ...withUserRef(req.user._id), date: dateKey });
  if (!attendance) return res.json({});
  return res.json(attendance);
});

export const myAttendance = asyncHandler(async (req, res) => {
  const records = await Attendance.find(withUserRef(req.user._id))
    .populate("userId", "name email")
    .populate("employeeId", "name email")
    .sort({ timestamp: -1 });
  return res.json(records);
});

export const allAttendance = asyncHandler(async (_req, res) => {
  const records = await Attendance.find()
    .populate("userId", "name email")
    .populate("employeeId", "name email")
    .sort({ timestamp: -1 });
  return res.json(records);
});

export const clearMyAttendanceHistory = asyncHandler(async (req, res) => {
  await Attendance.deleteMany(withUserRef(req.user._id));

  await createAuditLog({
    userId: req.user._id,
    action: "attendance history cleared",
    targetType: "Attendance",
    targetId: req.user._id,
  });

  return res.json({ message: "Attendance history cleared" });
});

export const clearAllAttendanceHistory = asyncHandler(async (req, res) => {
  await Attendance.deleteMany({});

  await createAuditLog({
    userId: req.user._id,
    action: "all attendance history cleared",
    targetType: "Attendance",
    targetId: "all",
  });

  return res.json({ message: "All attendance history cleared" });
});

export const adminAttendance = asyncHandler(async (_req, res) => {
  const records = await Attendance.find()
    .populate("userId", "name email")
    .populate("employeeId", "name email")
    .sort({ createdAt: -1 });
  return res.json(records);
});
