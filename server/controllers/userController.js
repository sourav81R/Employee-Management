import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import LeaveRequest from "../models/LeaveRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLE_VALUES } from "../utils/constants.js";
import { createAuditLog } from "../services/auditService.js";

const sanitize = (doc) => {
  const user = doc.toObject ? doc.toObject() : { ...doc };
  delete user.password;
  return user;
};

export const listUsers = asyncHandler(async (_req, res) => {
  const users = await User.find().populate("managerId", "name email role").sort({ createdAt: -1 });
  return res.json(users.map(sanitize));
});

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password = "Password@123", role = "employee", department = "" } = req.body;

  if (!name || !email) {
    return res.status(400).json({ message: "name and email are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) return res.status(409).json({ message: "User already exists" });

  const hashed = await bcrypt.hash(String(password), 10);
  const normalizedRole = ROLE_VALUES.includes(String(role).toLowerCase()) ? String(role).toLowerCase() : "employee";

  const user = await User.create({ name, email: normalizedEmail, password: hashed, role: normalizedRole, department });

  await createAuditLog({
    userId: req.user._id,
    action: "user created",
    targetType: "User",
    targetId: user._id,
  });

  return res.status(201).json({ message: "User created", user: sanitize(user) });
});

export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const target = await User.findById(req.params.id);
  if (!target) return res.status(404).json({ message: "User not found" });

  target.isActive = Boolean(isActive);
  target.employmentStatus = target.isActive ? "active" : "inactive";
  await target.save();

  await createAuditLog({
    userId: req.user._id,
    action: target.isActive ? "user activated" : "user deactivated",
    targetType: "User",
    targetId: target._id,
  });

  return res.json({ message: "User status updated", user: sanitize(target) });
});

export const listManagers = asyncHandler(async (_req, res) => {
  const managers = await User.find({ role: "manager", isActive: { $ne: false } }).select("name email role department");
  return res.json(managers);
});

export const assignManager = asyncHandler(async (req, res) => {
  const { userId, managerId } = req.body;
  if (!userId || !managerId) return res.status(400).json({ message: "userId and managerId are required" });

  const [user, manager] = await Promise.all([
    User.findById(userId),
    User.findById(managerId),
  ]);

  if (!user || !manager) return res.status(404).json({ message: "User or manager not found" });

  user.managerId = manager._id;
  await user.save();

  await Employee.updateMany(
    {
      $or: [
        { userId: user._id },
        { email: String(user.email || "").toLowerCase().trim() },
      ],
    },
    { $set: { managerId: manager._id, reportingTo: manager.name } }
  );

  await createAuditLog({
    userId: req.user._id,
    action: "manager assigned",
    targetType: "User",
    targetId: user._id,
    metadata: { managerId: manager._id },
  });

  return res.json({ message: "Manager assigned successfully" });
});

export const hrStats = asyncHandler(async (_req, res) => {
  const [totalUsers, managers, employees, departmentAgg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: "manager" }),
    User.countDocuments({ role: "employee" }),
    User.aggregate([
      { $match: { department: { $nin: ["", null] } } },
      { $group: { _id: "$department" } },
      { $count: "count" },
    ]),
  ]);

  return res.json({
    totalUsers,
    managers,
    employees,
    departments: departmentAgg?.[0]?.count || 0,
  });
});

export const pendingLeavesForRole = asyncHandler(async (req, res) => {
  const role = String(req.user.role || "").toLowerCase();

  let query = { status: "Pending" };

  if (role === "manager") {
    const teamUsers = await User.find({ managerId: req.user._id }).select("_id");
    query.userId = { $in: teamUsers.map((item) => item._id) };
  }

  if (role === "hr") {
    const hrUsers = await User.find({ role: "hr" }).select("_id");
    query.userId = { ...(query.userId || {}), $nin: hrUsers.map((item) => item._id) };
  }

  const requests = await LeaveRequest.find(query).populate("userId", "name email role").sort({ createdAt: -1 });
  return res.json(requests);
});
