// server/server.js (ES modules) — diagnostic/hardened
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";

import Attendance from "./Attendance.js";
import LeaveRequest from "./LeaveRequest.js";

const app = express();

const parseTrustProxy = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  const asNumber = Number(normalized);
  if (Number.isInteger(asNumber) && asNumber >= 0) return asNumber;
  return value;
};

// Proxy-aware IP handling for rate limiting and auth logs.
const trustProxyFromEnv = parseTrustProxy(process.env.TRUST_PROXY);
if (trustProxyFromEnv !== null) {
  app.set("trust proxy", trustProxyFromEnv);
} else {
  // Sensible default for common deployments (Render/Vercel/NGINX) and local reverse-proxy dev.
  app.set("trust proxy", 1);
}

/* -----------------------
   Basic middleware
   ----------------------- */
app.use(helmet());
app.use(express.json({ limit: "50mb" })); // Increased limit for Base64 images
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://employee-management-ivory-mu.vercel.app",
];
const envOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

const isPrivateNetworkOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    if (!/^https?:$/.test(protocol)) return false;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) return true;
    return false;
  } catch (_err) {
    return false;
  }
};

const isVercelPreviewOrigin = (origin) => {
  try {
    const { hostname, protocol } = new URL(origin);
    return protocol === "https:" && hostname.endsWith(".vercel.app");
  } catch (_err) {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin) || isPrivateNetworkOrigin(origin) || isVercelPreviewOrigin(origin)) {
        return callback(null, true);
      }
      console.warn(`CORS blocked for origin: ${origin}`);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    // Prevent startup/runtime validation noise when proxies inject X-Forwarded-For.
    validate: { xForwardedForHeader: false },
  })
);

/* -----------------------
   Quick env diagnostics
   ----------------------- */
console.log("=== ENV DIAGNOSTICS ===");
console.log("NODE_ENV:", process.env.NODE_ENV || "not set");
console.log("PORT:", process.env.PORT || "8000");
console.log("FRONTEND_ORIGIN:", process.env.FRONTEND_ORIGIN || "https://employee-management-ivory-mu.vercel.app");
console.log("MONGO_URI set?:", !!process.env.MONGO_URI);
console.log("JWT_SECRET set?:", !!process.env.JWT_SECRET);
console.log("EMAIL_USER set?:", !!process.env.EMAIL_USER);
console.log("========================");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret";
if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
  console.error("❌ JWT_SECRET is required in production");
  process.exit(1);
}

/* -----------------------
   MongoDB connection
   ----------------------- */
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ MONGO_URI not found in .env — please add it and restart");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:");
    console.error(err && err.message ? err.message : err);
    process.exit(1);
  });

/* -----------------------
   Email Transporter Setup
   ----------------------- */
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* -----------------------
   Models
   ----------------------- */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "hr", "manager", "employee"], default: "employee" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Manager for employees
    department: String,
    phoneNumber: String,
    profilePicture: String,
    isActive: { type: Boolean, default: true },
    employmentStatus: { type: String, enum: ["active", "inactive"], default: "active" },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const employeeSchema = new mongoose.Schema(
  {
    employeeId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    position: String,
    department: String,
    salary: Number,
    lastPaid: Date,
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reportingTo: String,
  },
  { timestamps: true }
);
const Employee = mongoose.model("Employee", employeeSchema);

const VALID_ROLES = new Set(["admin", "hr", "manager", "employee"]);
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeRole = (value, fallback = "") => {
  const normalized = String(value || "").trim().toLowerCase();
  if (VALID_ROLES.has(normalized)) return normalized;
  return fallback;
};

const resolveEffectiveRole = async (userDoc) => {
  const rawRole = String(userDoc?.role || "");
  const normalizedRole = normalizeRole(rawRole, "employee");
  if (!userDoc?._id) return normalizedRole;

  // Normalize persisted role text (case/spacing/invalid values) for consistency.
  if (rawRole.trim().toLowerCase() !== normalizedRole) {
    await User.updateOne({ _id: userDoc._id }, { $set: { role: normalizedRole } });
  }

  if (normalizedRole === "admin" || normalizedRole === "hr" || normalizedRole === "manager") {
    return normalizedRole;
  }

  // Data-healing for production: if user has direct reports, they should act as manager.
  const normalizedName = String(userDoc?.name || "").trim();
  const employeeReportsQuery = normalizedName
    ? {
      $or: [
        { managerId: userDoc._id },
        { reportingTo: { $regex: new RegExp(`^${escapeRegex(normalizedName)}$`, "i") } },
      ],
    }
    : { managerId: userDoc._id };

  const [hasUserReports, hasEmployeeReports] = await Promise.all([
    User.exists({ managerId: userDoc._id, isActive: { $ne: false } }),
    Employee.exists(employeeReportsQuery),
  ]);

  if (hasUserReports || hasEmployeeReports) {
    await User.updateOne({ _id: userDoc._id }, { $set: { role: "manager" } });
    return "manager";
  }

  return normalizedRole;
};

/* -----------------------
   Middleware - Verify Token & Role
   ----------------------- */
const verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "No valid token provided" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const dbUser = await User.findById(decoded.id).select("_id name email role isActive employmentStatus");
    if (!dbUser) {
      return res.status(401).json({ message: "User no longer exists" });
    }
    if (dbUser.isActive === false || dbUser.employmentStatus === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact HR/Admin." });
    }

    const effectiveRole = await resolveEffectiveRole(dbUser);

    req.user = {
      id: String(dbUser._id),
      email: dbUser.email,
      role: effectiveRole,
    };
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (...allowedRoles) => {
  const normalizedAllowedRoles = allowedRoles
    .map((role) => normalizeRole(role))
    .filter(Boolean);

  return (req, res, next) => {
    const requestRole = normalizeRole(req.user?.role);
    if (!requestRole || !normalizedAllowedRoles.includes(requestRole)) {
      return res.status(403).json({ message: "Access denied - insufficient permissions" });
    }
    next();
  };
};

const APPROVAL_STATUSES = new Set(["Approved", "Rejected"]);

/* -----------------------
   Routes (basic)
   ----------------------- */
app.get("/", (req, res) => res.send("🚀 Employee Management API is running"));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedName = String(name || "").trim();
    const requestedRole = normalizeRole(role, "employee");

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "Name, email & password required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      role: requestedRole,
      isActive: true,
      employmentStatus: "active",
    });

    return res.status(201).json({
      message: "Registered",
      user: {
        _id: newUser._id,
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    });
  } catch (err) {
    console.error("register err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Server error", error: err.message || err });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.isActive === false || user.employmentStatus === "inactive") {
      return res.status(403).json({ message: "Account is inactive. Contact HR/Admin." });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    user.lastLoginAt = new Date();
    await user.save();

    const effectiveRole = await resolveEffectiveRole(user);
    const token = jwt.sign({ id: user._id, email: user.email, role: effectiveRole }, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || "7d" });

    return res.json({
      message: "Logged in",
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: effectiveRole,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("login err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Login error", error: err.message || err });
  }
});

app.get("/api/employees", verifyToken, async (req, res) => {
  try {
    const list = await Employee.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error("get employees err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
});

app.post("/api/employees", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const { employeeId, name, email } = req.body;
    if (!employeeId || !name || !email) return res.status(400).json({ message: "employeeId, name and email required" });

    const exists = await Employee.findOne({ employeeId });
    if (exists) return res.status(400).json({ message: "Employee ID already exists" });

    const emp = await Employee.create(req.body);
    return res.status(201).json({ message: "Employee created", employee: emp });
  } catch (err) {
    console.error("create emp err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to create employee" });
  }
});

app.post("/api/employees/pay/:id", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    if (req.user.role === "manager" && String(emp.managerId || "") !== String(req.user.id)) {
      return res.status(403).json({ message: "Managers can only pay salary for their own team members" });
    }

    emp.lastPaid = new Date();
    await emp.save();
    return res.json({ message: `Salary paid to ${emp.name}`, employee: emp });
  } catch (err) {
    console.error("pay err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Payment failed" });
  }
});

app.put("/api/employees/:id", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    return res.json({ message: "Employee updated", employee: emp });
  } catch (err) {
    console.error("update emp err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to update employee" });
  }
});

app.delete("/api/employees/:id", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    return res.json({ message: "Employee deleted", employee: emp });
  } catch (err) {
    console.error("delete emp err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to delete employee" });
  }
});

/* -----------------------
   Role-Based APIs
   ----------------------- */

// Get all users (Admin and HR)
app.get("/api/users", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const users = await User.find().select("-password").populate("managerId", "name email");
    return res.json(users);
  } catch (err) {
    console.error("get users err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Get managers (HR can see all, Admin can see all, Manager sees self)
app.get("/api/managers", verifyToken, requireRole("admin", "hr", "manager"), async (req, res) => {
  try {
    const query = req.user.role === "manager"
      ? { _id: req.user.id, role: { $regex: /^manager$/i } }
      : { role: { $regex: /^manager$/i } };
    const managers = await User.find(query).select("-password").populate("managerId", "name email");
    return res.json(managers);
  } catch (err) {
    console.error("get managers err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch managers" });
  }
});

// Get employees under a manager
app.get("/api/manager-employees/:managerId", verifyToken, requireRole("manager", "admin", "hr"), async (req, res) => {
  try {
    if (req.user.role === "manager" && String(req.user.id) !== String(req.params.managerId)) {
      return res.status(403).json({ message: "Managers can only access their own team" });
    }

    const employees = await Employee.find({ managerId: req.params.managerId }).sort({ createdAt: -1 });
    return res.json(employees);
  } catch (err) {
    console.error("get manager employees err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
});

// Assign manager to users (HR & Admin only)
app.post("/api/assign-manager", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const { userId, managerId } = req.body;
    if (!userId || !managerId) return res.status(400).json({ message: "userId and managerId required" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (normalizeRole(user.role) === "admin") return res.status(400).json({ message: "Manager cannot be assigned to admin users" });

    const manager = await User.findById(managerId);
    if (!manager) return res.status(404).json({ message: "Manager user not found" });
    if (normalizeRole(manager.role) !== "manager") return res.status(400).json({ message: "Selected assignee is not a manager" });
    if (String(user._id) === String(manager._id)) return res.status(400).json({ message: "A user cannot report to themselves" });

    user.managerId = manager._id;
    await user.save();

    await Employee.updateMany(
      { email: { $regex: new RegExp(`^${String(user.email).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
      { managerId: manager._id, reportingTo: manager.name }
    );

    const updatedUser = await User.findById(user._id).select("-password").populate("managerId", "name email");
    return res.json({ message: "Manager assigned", user: updatedUser });
  } catch (err) {
    console.error("assign manager err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to assign manager" });
  }
});

// Create user account (Admin/HR)
app.post("/api/users", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role = "employee",
      department = "",
      phoneNumber = "",
    } = req.body || {};

    const normalizedName = String(name || "").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const normalizedRole = String(role || "employee").trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters" });
    }

    const allowedRolesForAdmin = new Set(["admin", "hr", "manager", "employee"]);
    const allowedRolesForHr = new Set(["manager", "employee"]);
    const allowedRoles = req.user.role === "admin" ? allowedRolesForAdmin : allowedRolesForHr;
    if (!allowedRoles.has(normalizedRole)) {
      return res.status(403).json({ message: "You are not allowed to create this role" });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) return res.status(400).json({ message: "User with this email already exists" });

    const hashed = await bcrypt.hash(String(password), 10);
    const created = await User.create({
      name: normalizedName,
      email: normalizedEmail,
      password: hashed,
      role: normalizedRole,
      department: String(department || "").trim(),
      phoneNumber: String(phoneNumber || "").trim(),
      isActive: true,
      employmentStatus: "active",
    });

    const safeUser = await User.findById(created._id).select("-password");
    return res.status(201).json({ message: "User created successfully", user: safeUser });
  } catch (err) {
    console.error("create user err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to create user" });
  }
});

// Activate/deactivate user account (Admin/HR)
app.patch("/api/users/:id/status", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const { isActive } = req.body || {};
    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive boolean is required" });
    }

    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    if (req.user.role === "hr" && target.role === "admin") {
      return res.status(403).json({ message: "HR cannot change admin account status" });
    }

    if (!isActive && String(target._id) === String(req.user.id)) {
      return res.status(400).json({ message: "You cannot deactivate your own account" });
    }

    target.isActive = isActive;
    target.employmentStatus = isActive ? "active" : "inactive";
    await target.save();

    const updated = await User.findById(target._id).select("-password").populate("managerId", "name email");
    return res.json({ message: `User marked as ${isActive ? "active" : "inactive"}`, user: updated });
  } catch (err) {
    console.error("user status update err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to update user status" });
  }
});

// Get user profile
app.get("/api/auth/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("managerId", "name email");
    if (!user) return res.status(404).json({ message: "User not found" });
    user.role = await resolveEffectiveRole(user);
    return res.json(user);
  } catch (err) {
    console.error("profile err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
});

// Get HR dashboard stats (HR & Admin only)
app.get("/api/hr/stats", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const managers = await User.countDocuments({ role: { $regex: /^manager$/i } });
    const employees = await Employee.countDocuments();
    const departments = await Employee.distinct("department");

    return res.json({
      totalUsers,
      managers,
      employees,
      departments: departments.length,
    });
  } catch (err) {
    console.error("hr stats err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch stats" });
  }
});

// Get manager/team info
app.get("/api/manager/team", verifyToken, requireRole("manager", "admin", "hr"), async (req, res) => {
  try {
    let team = [];
    if (req.user.role === "manager") {
      team = await Employee.find({ managerId: req.user.id });
    } else {
      // HR/Admin view org-wide team summary from this dashboard endpoint.
      team = await Employee.find();
    }
    const paidCount = team.filter((e) => e.lastPaid).length;
    const unpaidCount = team.length - paidCount;

    return res.json({
      teamSize: team.length,
      paid: paidCount,
      unpaid: unpaidCount,
      totalSalary: team.reduce((sum, e) => sum + (e.salary || 0), 0),
    });
  } catch (err) {
    console.error("manager team err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch team info" });
  }
});

/* -----------------------
   Attendance & Leave APIs
   ----------------------- */
const MIN_DAILY_WORK_HOURS = Math.max(
  1,
  Math.min(24, Number(process.env.MIN_DAILY_WORK_HOURS) || 8)
);
const MIN_DAILY_WORK_MINUTES = MIN_DAILY_WORK_HOURS * 60;

// ✅ NEW: Mark Attendance with Photo & Location
app.post("/api/attendance", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    const { photo, latitude, longitude, locationName, deviceType } = req.body;
    const numericLat = Number(latitude);
    const numericLng = Number(longitude);

    if (!photo || !Number.isFinite(numericLat) || !Number.isFinite(numericLng)) {
      return res.status(400).json({ message: "Missing photo or location data" });
    }

    const newRecord = await Attendance.create({
      employeeId: req.user.id, // Link to logged-in user
      photoUrl: photo,
      latitude: numericLat,
      longitude: numericLng,
      locationName: typeof locationName === "string" ? locationName.trim() : "",
      deviceType: typeof deviceType === "string" ? deviceType : "unknown",
      timestamp: new Date(),
    });

    return res.status(201).json({ message: "Attendance captured successfully", data: newRecord });
  } catch (err) {
    console.error("Capture attendance error:", err);
    return res.status(500).json({ message: "Failed to capture attendance" });
  }
});

// ✅ NEW: Get My Attendance History
app.get("/api/attendance/my", verifyToken, async (req, res) => {
  try {
    console.log(`[API] Fetching attendance history for user: ${req.user.id}`);
    // Fetch records for the logged-in user
    const records = await Attendance.find({ 
      $or: [{ employeeId: req.user.id }, { userId: req.user.id }] 
    })
      .sort({ timestamp: -1, createdAt: -1 })
      .populate("employeeId", "name email")
      .populate("userId", "name email");
    return res.json(records);
  } catch (err) {
    console.error("Get my attendance error:", err);
    return res.status(500).json({ message: "Failed to fetch history" });
  }
});

// ✅ NEW: Get All Attendance (Admin/HR)
// Clear my attendance records
const clearMyAttendanceHistory = async (req, res) => {
  try {
    console.log(`[API] Clearing attendance history for user: ${req.user.id}`);
    const result = await Attendance.deleteMany({
      $or: [{ employeeId: req.user.id }, { userId: req.user.id }],
    });
    return res.json({
      message: "Your attendance history was cleared successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    console.error("Clear my attendance error:", err);
    return res.status(500).json({ message: "Failed to clear your attendance history" });
  }
};
app.delete("/api/attendance/my", verifyToken, clearMyAttendanceHistory);
app.post("/api/attendance/my/clear", verifyToken, clearMyAttendanceHistory);

// Get all attendance records (Admin/HR)
app.get("/api/attendance/all", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    console.log(`[API] Fetching ALL attendance records for admin/hr: ${req.user.id}`);
    const records = await Attendance.find()
      .sort({ timestamp: -1, createdAt: -1 })
      .populate("employeeId", "name email")
      .populate("userId", "name email");
    return res.json(records);
  } catch (err) {
    console.error("Get all attendance error:", err);
    return res.status(500).json({ message: "Failed to fetch all records" });
  }
});

// Clear all attendance records (Admin/HR)
const clearAllAttendanceHistory = async (req, res) => {
  try {
    console.log(`[API] Clearing ALL attendance records by user: ${req.user.id}`);
    const result = await Attendance.deleteMany({});
    return res.json({
      message: "Attendance history cleared successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    console.error("Clear all attendance error:", err);
    return res.status(500).json({ message: "Failed to clear attendance history" });
  }
};
app.delete("/api/attendance/all", verifyToken, requireRole("admin", "hr"), clearAllAttendanceHistory);
app.post("/api/attendance/all/clear", verifyToken, requireRole("admin", "hr"), clearAllAttendanceHistory);

// Mark daily attendance
app.post("/api/attendance/check-in", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    console.log(`[API] Attendance check-in request for user: ${req.user.id}`);
    // Use the date provided by the frontend, or fallback to server local date
    const today = req.body?.date || new Date().toISOString().split('T')[0];
    const { photo, latitude, longitude, locationName, deviceType } = req.body || {};
    const existing = await Attendance.findOne({ userId: req.user.id, date: today });
    if (existing) return res.status(400).json({ message: "Already checked in today" });

    const now = new Date();
    const numericLat = Number(latitude);
    const numericLng = Number(longitude);
    const hasCoordinates = Number.isFinite(numericLat) && Number.isFinite(numericLng);

    const record = await Attendance.create({
      employeeId: req.user.id,
      userId: req.user.id,
      date: today,
      checkIn: now,
      timestamp: now,
      photoUrl: typeof photo === "string" && photo ? photo : undefined,
      latitude: hasCoordinates ? numericLat : undefined,
      longitude: hasCoordinates ? numericLng : undefined,
      locationName: typeof locationName === "string" ? locationName.trim() : "",
      deviceType: typeof deviceType === "string" && deviceType.trim() ? deviceType : "unknown",
      workedMinutes: 0,
      salaryCut: false,
      shortByMinutes: 0,
    });
    return res.status(201).json(record);
  } catch (err) {
    console.error("Check-in error:", err);
    return res.status(500).json({ message: "Failed to mark attendance" });
  }
});

// Mark check-out
app.post("/api/attendance/check-out", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    console.log(`[API] Attendance check-out request for user: ${req.user.id}`);
    // Use the date provided by the frontend, or fallback to server local date
    const today = req.body?.date || new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record) {
      return res.status(404).json({ message: "No check-in record found for today" });
    }

    if (record.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    const now = new Date();
    const checkInTime = record.checkIn || record.timestamp;
    if (!checkInTime) {
      return res.status(400).json({ message: "Check-in time missing. Please contact admin." });
    }

    const workedMinutes = Math.max(0, Math.floor((now.getTime() - new Date(checkInTime).getTime()) / (1000 * 60)));
    const minimumMinutes = MIN_DAILY_WORK_MINUTES;
    const shortByMinutes = Math.max(0, minimumMinutes - workedMinutes);
    const applySalaryCut = shortByMinutes > 0;

    record.checkOut = now;
    record.workedMinutes = workedMinutes;
    record.shortByMinutes = shortByMinutes;
    record.salaryCut = applySalaryCut;
    await record.save();
    return res.json({
      ...record.toObject(),
      minimumRequiredHours: MIN_DAILY_WORK_HOURS,
      minimumRequiredMinutes: MIN_DAILY_WORK_MINUTES,
      workHoursMessage: applySalaryCut
        ? `Worked ${workedMinutes} minute(s). Less than ${MIN_DAILY_WORK_HOURS} hour(s), salary cut applies for this day.`
        : `Worked ${workedMinutes} minute(s). Minimum daily hours completed.`,
    });
  } catch (err) {
    console.error("Check-out error:", err);
    return res.status(500).json({ message: "Failed to mark check-out" });
  }
});

// Get today's attendance status
app.get("/api/attendance/today", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    // Use the date provided in query params
    const today = req.query.date || new Date().toISOString().split('T')[0];
    const record = await Attendance.findOne({ userId: req.user.id, date: today });
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

const YEARLY_PAID_LEAVE_LIMIT = 18;
const CAPPED_LEAVE_ROLES = new Set(["employee", "manager", "hr"]);
const DAY_IN_MS = 24 * 60 * 60 * 1000;

const normalizeToUtcDateOnly = (value) => {
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return null;
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

const toDateKey = (utcDate) => utcDate.toISOString().split("T")[0];

const getDateKeysByYear = (startUtc, endUtc) => {
  const byYear = new Map();
  for (let t = startUtc.getTime(); t <= endUtc.getTime(); t += DAY_IN_MS) {
    const current = new Date(t);
    const year = String(current.getUTCFullYear());
    if (!byYear.has(year)) byYear.set(year, new Set());
    byYear.get(year).add(toDateKey(current));
  }
  return byYear;
};

const getUsedLeaveDaysByYear = async ({ userId, excludeRequestId }) => {
  const query = {
    userId,
    status: { $ne: "Rejected" },
  };

  if (excludeRequestId) {
    query._id = { $ne: excludeRequestId };
  }

  const existingLeaves = await LeaveRequest.find(query).select("startDate endDate");
  const usedByYear = new Map();

  for (const leave of existingLeaves) {
    const s = normalizeToUtcDateOnly(leave.startDate);
    const e = normalizeToUtcDateOnly(leave.endDate);
    if (!s || !e || s > e) continue;

    for (let t = s.getTime(); t <= e.getTime(); t += DAY_IN_MS) {
      const current = new Date(t);
      const year = String(current.getUTCFullYear());
      if (!usedByYear.has(year)) usedByYear.set(year, new Set());
      usedByYear.get(year).add(toDateKey(current));
    }
  }

  return usedByYear;
};

const computeLeaveBreakdown = async ({ userId, role, startUtc, endUtc, excludeRequestId }) => {
  const requestedByYear = getDateKeysByYear(startUtc, endUtc);
  let totalDays = 0;
  let paidDays = 0;
  let unpaidDays = 0;

  for (const [, dateSet] of requestedByYear.entries()) {
    totalDays += dateSet.size;
  }

  // Admin is not capped under this policy.
  if (!CAPPED_LEAVE_ROLES.has((role || "").toLowerCase())) {
    return { totalDays, paidDays: totalDays, unpaidDays: 0, salaryCut: false };
  }

  const usedByYear = await getUsedLeaveDaysByYear({ userId, excludeRequestId });

  for (const [year, requestedDates] of requestedByYear.entries()) {
    const alreadyUsed = usedByYear.get(year)?.size || 0;
    const remainingPaid = Math.max(0, YEARLY_PAID_LEAVE_LIMIT - alreadyUsed);
    const paidForYear = Math.min(remainingPaid, requestedDates.size);
    paidDays += paidForYear;
    unpaidDays += requestedDates.size - paidForYear;
  }

  return {
    totalDays,
    paidDays,
    unpaidDays,
    salaryCut: unpaidDays > 0,
  };
};

const getInclusiveLeaveDays = (startDateValue, endDateValue) => {
  const start = normalizeToUtcDateOnly(startDateValue);
  const end = normalizeToUtcDateOnly(endDateValue);
  if (!start || !end || end < start) return 0;
  return Math.floor((end.getTime() - start.getTime()) / DAY_IN_MS) + 1;
};

const withComputedLeaveFields = (leaveRecord) => {
  const obj = typeof leaveRecord?.toObject === "function" ? leaveRecord.toObject() : { ...leaveRecord };
  const existingTotal = Number(obj.totalDays) || 0;
  const existingPaid = Number(obj.paidDays) || 0;
  const existingUnpaid = Number(obj.unpaidDays) || 0;

  // For legacy records created before day fields existed.
  if (existingTotal <= 0 && existingPaid <= 0 && existingUnpaid <= 0) {
    const computedTotal = getInclusiveLeaveDays(obj.startDate, obj.endDate);
    return {
      ...obj,
      totalDays: computedTotal,
      paidDays: computedTotal,
      unpaidDays: 0,
      salaryCut: false,
    };
  }

  return obj;
};

// Submit leave request
app.post("/api/leave/request", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    console.log(`[API] Leave request received for user: ${req.user.id}`);
    const { startDate, endDate, reason } = req.body;

    const start = normalizeToUtcDateOnly(startDate);
    const end = normalizeToUtcDateOnly(endDate);

    if (!start || !end) {
      return res.status(400).json({ message: "Invalid start or end date." });
    }

    if (start > end) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // Check for overlapping leave requests (excluding rejected ones)
    const overlappingRequest = await LeaveRequest.findOne({
      userId: req.user.id,
      status: { $ne: 'Rejected' },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlappingRequest) {
      return res.status(400).json({ message: "Duplicate leave is not allowed. You already requested leave for one or more of these dates." });
    }

    const breakdown = await computeLeaveBreakdown({
      userId: req.user.id,
      role: req.user.role,
      startUtc: start,
      endUtc: end,
    });

    const request = await LeaveRequest.create({
      userId: req.user.id,
      startDate: start,
      endDate: end,
      reason,
      totalDays: breakdown.totalDays,
      paidDays: breakdown.paidDays,
      unpaidDays: breakdown.unpaidDays,
      salaryCut: breakdown.salaryCut,
    });

    // --- Send Email Notification to HR ---
    try {
      const hrUsers = await User.find({ role: "hr" }).select("email");
      const hrEmails = hrUsers.map((u) => u.email);
      const requester = await User.findById(req.user.id);

      if (hrEmails.length > 0) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: hrEmails.join(","),
          subject: `New Leave Request: ${requester.name}`,
          text: `Hello HR Team,\n\nA new leave request has been submitted.\n\nEmployee: ${requester.name}\nDates: ${startDate} to ${endDate}\nReason: ${reason}\n\nPlease review this request in the HR Dashboard.\n\nRegards,\nEmployee Management System`,
        };

        await transporter.sendMail(mailOptions);
        console.log("✅ HR notified via email");
      }
    } catch (mailErr) {
      console.error("❌ Email notification failed:", mailErr.message);
      // We don't return an error to the user here because the leave request 
      // was successfully saved in the database.
    }

    return res.status(201).json({
      ...request.toObject(),
      policyMessage: breakdown.salaryCut
        ? `Yearly paid leave limit is ${YEARLY_PAID_LEAVE_LIMIT} days. ${breakdown.unpaidDays} day(s) will be unpaid (salary cut).`
        : `Leave request submitted. ${breakdown.paidDays}/${breakdown.totalDays} day(s) are within yearly paid leave policy.`,
    });
  } catch (err) {
    console.error("Leave request error:", err);
    return res.status(500).json({ message: "Failed to submit leave request" });
  }
});

// Update a pending leave request
app.put("/api/leave/request/:id", verifyToken, async (req, res) => {
  try {
    const { startDate, endDate, reason } = req.body;
    const leaveReq = await LeaveRequest.findOne({ _id: req.params.id, userId: req.user.id });

    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });
    if (leaveReq.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be edited." });
    }

    const start = normalizeToUtcDateOnly(startDate);
    const end = normalizeToUtcDateOnly(endDate);
    if (!start || !end) {
      return res.status(400).json({ message: "Invalid start or end date." });
    }

    if (start > end) {
      return res.status(400).json({ message: "Start date cannot be after end date." });
    }

    // Check for overlapping leave requests (excluding this one and rejected ones)
    const overlappingRequest = await LeaveRequest.findOne({
      _id: { $ne: req.params.id },
      userId: req.user.id,
      status: { $ne: 'Rejected' },
      startDate: { $lte: end },
      endDate: { $gte: start }
    });

    if (overlappingRequest) {
      return res.status(400).json({ message: "Duplicate leave is not allowed. You already requested leave for one or more of these dates." });
    }

    const breakdown = await computeLeaveBreakdown({
      userId: req.user.id,
      role: req.user.role,
      startUtc: start,
      endUtc: end,
      excludeRequestId: req.params.id,
    });

    const updated = await LeaveRequest.findByIdAndUpdate(
      req.params.id,
      {
        startDate: start,
        endDate: end,
        reason,
        totalDays: breakdown.totalDays,
        paidDays: breakdown.paidDays,
        unpaidDays: breakdown.unpaidDays,
        salaryCut: breakdown.salaryCut,
      },
      { new: true }
    );

    return res.json({
      message: "Leave request updated",
      request: updated,
      policyMessage: breakdown.salaryCut
        ? `Yearly paid leave limit is ${YEARLY_PAID_LEAVE_LIMIT} days. ${breakdown.unpaidDays} day(s) will be unpaid (salary cut).`
        : `Leave request updated. ${breakdown.paidDays}/${breakdown.totalDays} day(s) are within yearly paid leave policy.`,
    });
  } catch (err) {
    console.error("Update leave request error:", err);
    return res.status(500).json({ message: "Failed to update leave request" });
  }
});

// Delete a pending leave request
app.delete("/api/leave/request/:id", verifyToken, async (req, res) => {
  try {
    const leaveReq = await LeaveRequest.findOne({ _id: req.params.id, userId: req.user.id });

    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });
    if (leaveReq.status === "Approved") {
      return res.status(400).json({ message: "Approved leave request cannot be deleted." });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Leave request deleted successfully" });
  } catch (err) {
    console.error("Delete leave request error:", err);
    return res.status(500).json({ message: "Failed to delete leave request" });
  }
});

// Clear all leave requests for current user
const clearMyLeaveRequests = async (req, res) => {
  try {
    const result = await LeaveRequest.deleteMany({ userId: req.user.id });
    return res.json({
      message: "All leave requests cleared successfully",
      deletedCount: result.deletedCount || 0,
    });
  } catch (err) {
    console.error("Clear leave requests error:", err);
    return res.status(500).json({ message: "Failed to clear leave requests" });
  }
};
app.delete("/api/leave/my-requests", verifyToken, clearMyLeaveRequests);
app.post("/api/leave/my-requests/clear", verifyToken, clearMyLeaveRequests);

// Get pending leave requests (HR/Admin/Manager)
app.get("/api/leave/pending", verifyToken, requireRole("hr", "admin", "manager"), async (req, res) => {
  try {
    let requests = [];
    if (req.user.role === "manager") {
      const teamMemberIds = await User.find({ managerId: req.user.id, role: "employee" }).select("_id");
      const teamIds = teamMemberIds.map((member) => member._id);
      requests = await LeaveRequest.find({ status: "Pending", userId: { $in: teamIds } })
        .populate("userId", "name email role managerId");
    } else {
      requests = await LeaveRequest.find({ status: "Pending" }).populate("userId", "name email role managerId");
    }

    return res.json(requests.map(withComputedLeaveFields));
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// Get current user's leave requests
app.get("/api/leave/my-requests", verifyToken, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(requests.map(withComputedLeaveFields));
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch your leave requests" });
  }
});

// Yearly leave summary report (Admin/HR)
app.get("/api/reports/leave-summary", verifyToken, requireRole("admin", "hr"), async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < 2000 || year > 3000) {
      return res.status(400).json({ message: "Invalid year" });
    }

    const yearStart = new Date(Date.UTC(year, 0, 1));
    const yearEnd = new Date(Date.UTC(year, 11, 31));
    const dayMs = 24 * 60 * 60 * 1000;

    const overlapDays = (s1, e1, s2, e2) => {
      const start = Math.max(s1.getTime(), s2.getTime());
      const end = Math.min(e1.getTime(), e2.getTime());
      if (end < start) return 0;
      return Math.floor((end - start) / dayMs) + 1;
    };

    const addDays = (date, days) => new Date(date.getTime() + (days * dayMs));
    const toUtcDateOnly = (value) => {
      const d = new Date(value);
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    };

    const leaves = await LeaveRequest.find({
      status: { $in: ["Pending", "Approved"] },
      startDate: { $lte: yearEnd },
      endDate: { $gte: yearStart },
    }).populate("userId", "name email role");

    const summaryMap = new Map();
    const getBucket = (user) => {
      const id = String(user?._id || "unknown");
      if (!summaryMap.has(id)) {
        summaryMap.set(id, {
          userId: id,
          name: user?.name || "Unknown",
          email: user?.email || "N/A",
          role: user?.role || "N/A",
          approvedPaidDays: 0,
          approvedUnpaidDays: 0,
          approvedTotalDays: 0,
          pendingPaidDays: 0,
          pendingUnpaidDays: 0,
          pendingTotalDays: 0,
        });
      }
      return summaryMap.get(id);
    };

    for (const reqLeave of leaves) {
      if (!reqLeave.userId) continue;
      const bucket = getBucket(reqLeave.userId);

      const leaveStart = toUtcDateOnly(reqLeave.startDate);
      const leaveEnd = toUtcDateOnly(reqLeave.endDate);
      const overlapTotal = overlapDays(leaveStart, leaveEnd, yearStart, yearEnd);
      if (overlapTotal <= 0) continue;

      const totalDays = Math.max(1, Number(reqLeave.totalDays) || 1);
      const paidDays = Math.max(0, Number(reqLeave.paidDays) || 0);
      const unpaidDays = Math.max(0, Number(reqLeave.unpaidDays) || 0);

      const paidEnd = paidDays > 0 ? addDays(leaveStart, paidDays - 1) : null;
      const unpaidStart = unpaidDays > 0 ? addDays(leaveStart, paidDays) : null;

      const overlapPaid = paidEnd ? overlapDays(leaveStart, paidEnd, yearStart, yearEnd) : 0;
      const overlapUnpaid = unpaidStart ? overlapDays(unpaidStart, leaveEnd, yearStart, yearEnd) : 0;

      // Fallback for legacy rows without paid/unpaid fields
      const normalizedPaid = (paidDays === 0 && unpaidDays === 0)
        ? Math.min(overlapTotal, Math.round((overlapTotal / totalDays) * totalDays))
        : overlapPaid;
      const normalizedUnpaid = (paidDays === 0 && unpaidDays === 0)
        ? 0
        : overlapUnpaid;

      if (reqLeave.status === "Approved") {
        bucket.approvedTotalDays += overlapTotal;
        bucket.approvedPaidDays += normalizedPaid;
        bucket.approvedUnpaidDays += normalizedUnpaid;
      } else {
        bucket.pendingTotalDays += overlapTotal;
        bucket.pendingPaidDays += normalizedPaid;
        bucket.pendingUnpaidDays += normalizedUnpaid;
      }
    }

    return res.json({
      year,
      paidLeaveLimit: YEARLY_PAID_LEAVE_LIMIT,
      generatedAt: new Date().toISOString(),
      employees: Array.from(summaryMap.values()).sort((a, b) => a.name.localeCompare(b.name)),
    });
  } catch (err) {
    console.error("Leave summary report error:", err);
    return res.status(500).json({ message: "Failed to generate leave summary report" });
  }
});

// Get all attendance records (Admin only)
app.get("/api/admin/attendance", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("employeeId", "name email role department")
      .populate("userId", "name email role department")
      .sort({ checkIn: -1, timestamp: -1, createdAt: -1 });

    const normalized = records.map((entry) => {
      const log = typeof entry.toObject === "function" ? entry.toObject() : { ...entry };
      const user = log.userId || log.employeeId || null;
      const checkIn = log.checkIn || log.timestamp || null;
      const checkOut = log.checkOut || null;
      const parsedWorkedMinutes = Number(log.workedMinutes);
      const hasWorkedMinutes = Number.isFinite(parsedWorkedMinutes) && parsedWorkedMinutes >= 0;
      const workedMinutes = hasWorkedMinutes
        ? parsedWorkedMinutes
        : (checkIn && checkOut)
          ? Math.max(0, Math.floor((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60)))
          : 0;
      const shortByMinutes = checkOut ? Math.max(0, MIN_DAILY_WORK_MINUTES - workedMinutes) : 0;

      return {
        ...log,
        user,
        checkIn,
        checkOut,
        workedMinutes,
        shortByMinutes,
        salaryCut: checkOut ? shortByMinutes > 0 : false,
        minimumRequiredHours: MIN_DAILY_WORK_HOURS,
        minimumRequiredMinutes: MIN_DAILY_WORK_MINUTES,
      };
    });

    return res.json(normalized);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch all attendance" });
  }
});

// Get all leave requests (Admin only)
app.get("/api/admin/leaves", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const requests = await LeaveRequest.find().populate("userId", "name email role");
    return res.json(requests.map(withComputedLeaveFields));
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch all leave requests" });
  }
});

// Approve/Reject leave request (HR/Admin/Manager with scoped access)
app.put("/api/leave/approve/:id", verifyToken, requireRole("hr", "admin", "manager"), async (req, res) => {
  try {
    const status = String(req.body?.status || "");
    if (!APPROVAL_STATUSES.has(status)) {
      return res.status(400).json({ message: "Invalid status. Use Approved or Rejected." });
    }

    const leaveReq = await LeaveRequest.findById(req.params.id).populate("userId", "name email role managerId");
    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });
    if (leaveReq.status !== "Pending") {
      return res.status(400).json({ message: "Only pending leave requests can be updated" });
    }
    if (String(leaveReq.userId?._id || "") === String(req.user.id)) {
      return res.status(403).json({ message: "You cannot approve or reject your own leave request" });
    }

    // Enforce: HR leave requests can only be approved by Admin
    if (leaveReq.userId.role === "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Admin can approve HR leave requests" });
    }

    if (req.user.role === "manager") {
      if (leaveReq.userId.role !== "employee") {
        return res.status(403).json({ message: "Managers can only act on employee leave requests" });
      }
      if (String(leaveReq.userId.managerId || "") !== String(req.user.id)) {
        return res.status(403).json({ message: "Managers can only act on their direct reports" });
      }
    }

    leaveReq.status = status;
    leaveReq.approvedBy = req.user.id;
    await leaveReq.save();
    return res.json(leaveReq);
  } catch (err) {
    return res.status(500).json({ message: "Failed to update leave request" });
  }
});

/* -----------------------
   Unhandled error handlers
   ----------------------- */
process.on("unhandledRejection", (reason) => {
  console.error("UNHANDLED REJECTION:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err);
});

/* -----------------------
   Start server
   ----------------------- */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
