import { Router } from "express";
import {
  processPayroll,
  listPayroll,
  myPayrollHistory,
  getPayrollById,
  downloadPayslip,
} from "../controllers/payrollController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/process", verifyToken, requireRole("admin", "hr", "manager"), processPayroll);
router.get("/", verifyToken, listPayroll);
router.get("/my", verifyToken, myPayrollHistory);
router.get("/:id", verifyToken, getPayrollById);
router.get("/:id/payslip", verifyToken, downloadPayslip);

export default router;
