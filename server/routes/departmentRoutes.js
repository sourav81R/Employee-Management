import { Router } from "express";
import {
  createDepartment,
  listDepartments,
  updateDepartment,
  deleteDepartment,
  assignEmployeesToDepartment,
  departmentAnalytics,
} from "../controllers/departmentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr"), createDepartment);
router.get("/", verifyToken, listDepartments);
router.get("/analytics", verifyToken, requireRole("admin", "hr", "manager"), departmentAnalytics);
router.put("/:id", verifyToken, requireRole("admin", "hr"), updateDepartment);
router.delete("/:id", verifyToken, requireRole("admin"), deleteDepartment);
router.post("/:id/assign", verifyToken, requireRole("admin", "hr"), assignEmployeesToDepartment);

export default router;
