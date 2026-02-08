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

/* -----------------------
   Basic middleware
   ----------------------- */
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "https://employee-management-ivory-mu.vercel.app"],
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
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
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["admin", "hr", "manager", "employee"], default: "employee" },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // Manager for employees
    department: String,
    phoneNumber: String,
    profilePicture: String,
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

/* -----------------------
   Middleware - Verify Token & Role
   ----------------------- */
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token || token === "undefined" || token === "null") {
    return res.status(401).json({ message: "No valid token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied - insufficient permissions" });
    }
    next();
  };
};

/* -----------------------
   Routes (basic)
   ----------------------- */
app.get("/", (req, res) => res.send("🚀 Employee Management API is running"));

app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "User already exists" });

    const validRoles = ["admin", "hr", "manager", "employee"];
    const userRole = validRoles.includes(role) ? role : "employee";

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed, role: userRole });
    return res.status(201).json({ message: "Registered", user: { _id: newUser._id, id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
  } catch (err) {
    console.error("register err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Server error", error: err.message || err });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email & password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET || "dev_secret", { expiresIn: process.env.JWT_EXPIRE || "7d" });

    return res.json({ message: "Logged in", token, user: { _id: user._id, id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error("login err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Login error", error: err.message || err });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const list = await Employee.find().sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    console.error("get employees err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch employees" });
  }
});

app.post("/api/employees", async (req, res) => {
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

    emp.lastPaid = new Date();
    await emp.save();
    return res.json({ message: `Salary paid to ${emp.name}`, employee: emp });
  } catch (err) {
    console.error("pay err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Payment failed" });
  }
});

app.put("/api/employees/:id", async (req, res) => {
  try {
    const emp = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!emp) return res.status(404).json({ message: "Employee not found" });

    return res.json({ message: "Employee updated", employee: emp });
  } catch (err) {
    console.error("update emp err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to update employee" });
  }
});

app.delete("/api/employees/:id", async (req, res) => {
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
    const managers = await User.find({ role: "manager" }).select("-password").populate("managerId", "name email");
    return res.json(managers);
  } catch (err) {
    console.error("get managers err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to fetch managers" });
  }
});

// Get employees under a manager
app.get("/api/manager-employees/:managerId", verifyToken, requireRole("manager", "admin", "hr"), async (req, res) => {
  try {
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

    const user = await User.findByIdAndUpdate(userId, { managerId }, { new: true }).populate("managerId", "name email");
    return res.json({ message: "Manager assigned", user });
  } catch (err) {
    console.error("assign manager err:", err && err.message ? err.message : err);
    return res.status(500).json({ message: "Failed to assign manager" });
  }
});

// Get user profile
app.get("/api/auth/profile", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").populate("managerId", "name email");
    if (!user) return res.status(404).json({ message: "User not found" });
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
    const managers = await User.countDocuments({ role: "manager" });
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

// Get manager's team info
app.get("/api/manager/team", verifyToken, requireRole("manager", "admin"), async (req, res) => {
  try {
    const manager = await User.findById(req.user.id);
    const team = await Employee.find({ managerId: manager._id });
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

// Mark daily attendance
app.post("/api/attendance/check-in", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    console.log(`[API] Attendance check-in request for user: ${req.user.id}`);
    // Use the date provided by the frontend, or fallback to server local date
    const today = req.body.date || new Date().toLocaleDateString('en-CA'); 
    const existing = await Attendance.findOne({ userId: req.user.id, date: today });
    if (existing) return res.status(400).json({ message: "Already checked in today" });

    const record = await Attendance.create({ userId: req.user.id, date: today });
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
    const today = req.body.date || new Date().toLocaleDateString('en-CA'); 
    const record = await Attendance.findOne({ userId: req.user.id, date: today });

    if (!record) {
      return res.status(404).json({ message: "No check-in record found for today" });
    }

    if (record.checkOut) {
      return res.status(400).json({ message: "Already checked out today" });
    }

    record.checkOut = new Date();
    await record.save();
    return res.json(record);
  } catch (err) {
    console.error("Check-out error:", err);
    return res.status(500).json({ message: "Failed to mark check-out" });
  }
});

// Get today's attendance status
app.get("/api/attendance/today", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    // Use the date provided in query params
    const today = req.query.date || new Date().toLocaleDateString('en-CA');
    const record = await Attendance.findOne({ userId: req.user.id, date: today });
    return res.json(record);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch attendance" });
  }
});

// Submit leave request
app.post("/api/leave/request", verifyToken, requireRole("admin", "hr", "manager", "employee"), async (req, res) => {
  try {
    console.log(`[API] Leave request received for user: ${req.user.id}`);
    const { startDate, endDate, reason } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);

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
      return res.status(400).json({ message: "You already have a pending or approved leave request overlapping with these dates." });
    }

    const request = await LeaveRequest.create({ userId: req.user.id, startDate, endDate, reason });

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

    return res.status(201).json(request);
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

    const start = new Date(startDate);
    const end = new Date(endDate);
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
      return res.status(400).json({ message: "You already have a pending or approved leave request overlapping with these dates." });
    }

    const updated = await LeaveRequest.findByIdAndUpdate(req.params.id, { startDate, endDate, reason }, { new: true });
    return res.json({ message: "Leave request updated", request: updated });
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
    if (leaveReq.status !== "Pending") {
      return res.status(400).json({ message: "Only pending requests can be deleted." });
    }

    await LeaveRequest.findByIdAndDelete(req.params.id);
    return res.json({ message: "Leave request deleted successfully" });
  } catch (err) {
    console.error("Delete leave request error:", err);
    return res.status(500).json({ message: "Failed to delete leave request" });
  }
});

// Get pending leave requests (HR/Admin)
app.get("/api/leave/pending", verifyToken, requireRole("hr", "admin"), async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: "Pending" }).populate("userId", "name email role");
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch leave requests" });
  }
});

// Get current user's leave requests
app.get("/api/leave/my-requests", verifyToken, async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch your leave requests" });
  }
});

// Get all attendance records (Admin only)
app.get("/api/admin/attendance", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const records = await Attendance.find()
      .populate("userId", "name email role department")
      .sort({ createdAt: -1 });
    return res.json(records);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch all attendance" });
  }
});

// Get all leave requests (Admin only)
app.get("/api/admin/leaves", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const requests = await LeaveRequest.find().populate("userId", "name email role");
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Failed to fetch all leave requests" });
  }
});

// Approve/Reject leave request (HR/Admin)
app.put("/api/leave/approve/:id", verifyToken, requireRole("hr", "admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const leaveReq = await LeaveRequest.findById(req.params.id).populate("userId");
    if (!leaveReq) return res.status(404).json({ message: "Leave request not found" });

    // Enforce: HR leave requests can only be approved by Admin
    if (leaveReq.userId.role === "hr" && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only Admin can approve HR leave requests" });
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
