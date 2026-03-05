import { Router } from "express";
import {
  createOnboarding,
  listOnboarding,
  updateOnboarding,
  myOnboarding,
} from "../controllers/onboardingController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr"), createOnboarding);
router.get("/", verifyToken, requireRole("admin", "hr", "manager"), listOnboarding);
router.put("/:id", verifyToken, requireRole("admin", "hr"), updateOnboarding);
router.get("/my", verifyToken, myOnboarding);

export default router;
