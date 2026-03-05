import { Router } from "express";
import {
  listUsers,
  createUser,
  toggleUserStatus,
  listManagers,
  assignManager,
  hrStats,
} from "../controllers/userController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.get("/", verifyToken, requireRole("admin", "hr"), listUsers);
router.post("/", verifyToken, requireRole("admin", "hr"), createUser);
router.patch("/:id/status", verifyToken, requireRole("admin", "hr"), toggleUserStatus);

router.get("/managers/list", verifyToken, requireRole("admin", "hr", "manager"), listManagers);
router.post("/assign-manager", verifyToken, requireRole("admin", "hr"), assignManager);
router.get("/hr/stats/summary", verifyToken, requireRole("admin", "hr"), hrStats);

export default router;
