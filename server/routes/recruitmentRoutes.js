import { Router } from "express";
import {
  createCandidate,
  listCandidates,
  updateCandidate,
  deleteCandidate,
} from "../controllers/recruitmentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr", "manager"), createCandidate);
router.get("/", verifyToken, requireRole("admin", "hr", "manager"), listCandidates);
router.put("/:id", verifyToken, requireRole("admin", "hr", "manager"), updateCandidate);
router.delete("/:id", verifyToken, requireRole("admin", "hr"), deleteCandidate);

export default router;
