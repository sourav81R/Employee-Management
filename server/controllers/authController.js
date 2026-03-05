import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLE_VALUES } from "../utils/constants.js";
import { createAuditLog } from "../services/auditService.js";

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "dev_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

const sanitizeUser = (userDoc) => {
  const user = userDoc?.toObject ? userDoc.toObject() : { ...userDoc };
  delete user.password;
  return user;
};

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role = "employee" } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required" });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const normalizedRole = ROLE_VALUES.includes(String(role).toLowerCase()) ? String(role).toLowerCase() : "employee";

  const exists = await User.findOne({ email: normalizedEmail });
  if (exists) {
    return res.status(409).json({ message: "User already exists with this email" });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email: normalizedEmail, password: hashed, role: normalizedRole });

  await createAuditLog({
    userId: user._id,
    action: "user registered",
    targetType: "User",
    targetId: user._id,
  });

  return res.status(201).json({
    message: "Registration successful",
    user: sanitizeUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email || "").trim().toLowerCase() });
  if (!user) return res.status(401).json({ message: "Invalid email or password" });
  if (user.isActive === false) return res.status(403).json({ message: "Account is deactivated" });

  const isMatch = await bcrypt.compare(String(password || ""), user.password);
  if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

  user.lastLoginAt = new Date();

  // Data healing: if employee has reports, treat as manager.
  if (user.role === "employee") {
    const hasReports = await Promise.all([
      User.exists({ managerId: user._id, isActive: { $ne: false } }),
      Employee.exists({ managerId: user._id }),
    ]);
    if (hasReports[0] || hasReports[1]) {
      user.role = "manager";
    }
  }

  await user.save();
  const token = signToken(user._id);

  await createAuditLog({
    userId: user._id,
    action: "user login",
    targetType: "User",
    targetId: user._id,
  });

  return res.json({ token, user: sanitizeUser(user) });
});

export const getProfile = asyncHandler(async (req, res) => {
  return res.json(sanitizeUser(req.user));
});
