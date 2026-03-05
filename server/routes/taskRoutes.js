import { Router } from "express";
import {
  createTask,
  listTasks,
  myTasks,
  updateTask,
  addTaskComment,
  taskDashboard,
} from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr", "manager"), createTask);
router.get("/", verifyToken, listTasks);
router.get("/my", verifyToken, myTasks);
router.get("/dashboard", verifyToken, taskDashboard);
router.put("/:id", verifyToken, updateTask);
router.post("/:id/comments", verifyToken, addTaskComment);

export default router;
