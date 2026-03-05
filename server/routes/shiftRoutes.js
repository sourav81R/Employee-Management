import { Router } from "express";
import {
  createShift,
  listShifts,
  updateShift,
  deleteShift,
  assignShiftToEmployee,
  myShift,
} from "../controllers/shiftController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr"), createShift);
router.get("/", verifyToken, listShifts);
router.get("/my", verifyToken, myShift);
router.put("/:id", verifyToken, requireRole("admin", "hr"), updateShift);
router.delete("/:id", verifyToken, requireRole("admin", "hr"), deleteShift);
router.post("/assign", verifyToken, requireRole("admin", "hr"), assignShiftToEmployee);

export default router;
