import { Router } from "express";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  payEmployeeSalary,
  managerEmployees,
  managerTeamStats,
} from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.get("/", verifyToken, listEmployees);
router.post("/", verifyToken, requireRole("admin", "hr"), createEmployee);
router.put("/:id", verifyToken, requireRole("admin", "hr"), updateEmployee);
router.delete("/:id", verifyToken, requireRole("admin", "hr"), deleteEmployee);
router.post("/pay/:id", verifyToken, requireRole("manager", "admin"), payEmployeeSalary);

router.get("/manager-employees/:managerId", verifyToken, requireRole("manager", "admin", "hr"), managerEmployees);
router.get("/manager/team", verifyToken, requireRole("manager", "admin", "hr"), managerTeamStats);

export default router;
