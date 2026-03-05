import { Router } from "express";
import {
  createLeaveRequest,
  updateLeaveRequest,
  deleteLeaveRequest,
  myLeaveRequests,
  clearMyLeaveRequests,
  pendingLeaveRequests,
  approveLeaveRequest,
  leaveSummaryReport,
  adminLeaves,
} from "../controllers/leaveController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/request", verifyToken, requireRole("admin", "hr", "manager", "employee"), createLeaveRequest);
router.put("/request/:id", verifyToken, updateLeaveRequest);
router.delete("/request/:id", verifyToken, deleteLeaveRequest);

router.get("/my-requests", verifyToken, myLeaveRequests);
router.delete("/my-requests", verifyToken, clearMyLeaveRequests);
router.post("/my-requests/clear", verifyToken, clearMyLeaveRequests);

router.get("/pending", verifyToken, requireRole("admin", "hr", "manager"), pendingLeaveRequests);
router.put("/approve/:id", verifyToken, requireRole("admin", "hr", "manager"), approveLeaveRequest);

router.get("/reports/summary", verifyToken, requireRole("admin", "hr"), leaveSummaryReport);
router.get("/admin/all", verifyToken, requireRole("admin"), adminLeaves);

export default router;
