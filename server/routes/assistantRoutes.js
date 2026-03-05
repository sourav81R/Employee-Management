import { Router } from "express";
import { assistantChat } from "../controllers/assistantController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/chat", verifyToken, requireRole("admin", "hr", "manager", "employee"), assistantChat);

export default router;
