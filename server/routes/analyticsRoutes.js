import { Router } from "express";
import { adminAnalyticsDashboard } from "../controllers/analyticsController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.get("/dashboard", verifyToken, requireRole("admin", "hr", "manager"), adminAnalyticsDashboard);

export default router;
