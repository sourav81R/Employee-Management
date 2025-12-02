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

const app = express();

/* -----------------------
   Basic middleware
   ----------------------- */
app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:3000",
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
console.log("FRONTEND_ORIGIN:", process.env.FRONTEND_ORIGIN || "http://localhost:3000");
console.log("MONGO_URI set?:", !!process.env.MONGO_URI);
console.log("JWT_SECRET set?:", !!process.env.JWT_SECRET);
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
   Models
   ----------------------- */
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
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
  },
  { timestamps: true }
);
const Employee = mongoose.model("Employee", employeeSchema);

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

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashed, role });
    return res.status(201).json({ message: "Registered", user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } });
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

    return res.json({ message: "Logged in", token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
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

app.post("/api/employees/pay/:id", async (req, res) => {
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
