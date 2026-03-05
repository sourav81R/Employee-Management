import { Router } from "express";
import {
  createPerformanceReview,
  myPerformanceReviews,
  employeePerformanceHistory,
  performanceAnalytics,
} from "../controllers/performanceController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr", "manager"), createPerformanceReview);
router.get("/my", verifyToken, myPerformanceReviews);
router.get("/employee/:employeeId", verifyToken, requireRole("admin", "hr", "manager"), employeePerformanceHistory);
router.get("/analytics", verifyToken, requireRole("admin", "hr", "manager"), performanceAnalytics);

export default router;
