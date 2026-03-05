import { Router } from "express";
import {
  markAttendanceLegacy,
  checkIn,
  checkOut,
  todayAttendance,
  myAttendance,
  allAttendance,
  clearMyAttendanceHistory,
  clearAllAttendanceHistory,
  adminAttendance,
} from "../controllers/attendanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr", "manager", "employee"), markAttendanceLegacy);
router.post("/check-in", verifyToken, requireRole("admin", "hr", "manager", "employee"), checkIn);
router.post("/check-out", verifyToken, requireRole("admin", "hr", "manager", "employee"), checkOut);
router.get("/today", verifyToken, requireRole("admin", "hr", "manager", "employee"), todayAttendance);

router.get("/my", verifyToken, myAttendance);
router.delete("/my", verifyToken, clearMyAttendanceHistory);
router.post("/my/clear", verifyToken, clearMyAttendanceHistory);

router.get("/all", verifyToken, requireRole("admin", "hr"), allAttendance);
router.delete("/all", verifyToken, requireRole("admin", "hr"), clearAllAttendanceHistory);
router.post("/all/clear", verifyToken, requireRole("admin", "hr"), clearAllAttendanceHistory);

router.get("/admin/all", verifyToken, requireRole("admin"), adminAttendance);

export default router;
