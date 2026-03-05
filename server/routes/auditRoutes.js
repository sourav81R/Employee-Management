import { Router } from "express";
import { listAuditLogs } from "../controllers/auditController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.get("/", verifyToken, requireRole("admin", "hr"), listAuditLogs);

export default router;
