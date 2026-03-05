import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import performanceRoutes from "./routes/performanceRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import documentRoutes from "./routes/documentRoutes.js";
import recruitmentRoutes from "./routes/recruitmentRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import shiftRoutes from "./routes/shiftRoutes.js";
import onboardingRoutes from "./routes/onboardingRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import assistantRoutes from "./routes/assistantRoutes.js";

import { verifyToken } from "./middleware/authMiddleware.js";
import { requireRole } from "./middleware/rbacMiddleware.js";
import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware.js";

import { listManagers, assignManager, hrStats } from "./controllers/userController.js";
import { managerEmployees, managerTeamStats } from "./controllers/employeeController.js";
import { leaveSummaryReport, adminLeaves } from "./controllers/leaveController.js";
import { adminAttendance } from "./controllers/attendanceController.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const normalizeOrigin = (value) => String(value || "").trim().replace(/\/+$/, "");

const defaultOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:8000",
  "https://employee-management-ivory-mu.vercel.app",
];

const envOrigins = String(process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

const allowedOrigins = new Set([...defaultOrigins.map(normalizeOrigin), ...envOrigins]);

const isLocalOrPrivateOrigin = (origin) => {
  try {
    const parsed = new URL(origin);
    const hostname = parsed.hostname;
    const protocol = parsed.protocol;
    if (!/^https?:$/.test(protocol)) return false;
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") return true;
    if (/^10\.\d+\.\d+\.\d+$/.test(hostname)) return true;
    if (/^192\.168\.\d+\.\d+$/.test(hostname)) return true;
    if (/^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/.test(hostname)) return true;
    return false;
  } catch (_error) {
    return false;
  }
};

app.set("trust proxy", 1);

app.use(helmet());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isVercelPreview = normalizedOrigin.endsWith(".vercel.app");

      if (allowedOrigins.has(normalizedOrigin) || isLocalOrPrivateOrigin(normalizedOrigin) || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${normalizedOrigin}`));
    },
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
  })
);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (_req, res) => res.send("Employee Management API is running"));

// Primary module routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/users", userRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leave", leaveRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/performance", performanceRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/recruitment", recruitmentRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/shifts", shiftRoutes);
app.use("/api/onboarding", onboardingRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/assistant", assistantRoutes);

// Legacy compatibility routes consumed by existing frontend
app.get("/api/managers", verifyToken, requireRole("admin", "hr", "manager"), listManagers);
app.get("/api/manager-employees/:managerId", verifyToken, requireRole("manager", "admin", "hr"), managerEmployees);
app.post("/api/assign-manager", verifyToken, requireRole("admin", "hr"), assignManager);
app.get("/api/hr/stats", verifyToken, requireRole("admin", "hr"), hrStats);
app.get("/api/manager/team", verifyToken, requireRole("manager", "admin", "hr"), managerTeamStats);
app.get("/api/reports/leave-summary", verifyToken, requireRole("admin", "hr"), leaveSummaryReport);
app.get("/api/admin/attendance", verifyToken, requireRole("admin"), adminAttendance);
app.get("/api/admin/leaves", verifyToken, requireRole("admin"), adminLeaves);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
