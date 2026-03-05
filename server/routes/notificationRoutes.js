import { Router } from "express";
import {
  myNotifications,
  unreadCount,
  markNotificationAsRead,
  markAllAsRead,
  sendNotification,
  broadcastNotification,
} from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.get("/", verifyToken, myNotifications);
router.get("/unread-count", verifyToken, unreadCount);
router.patch("/read-all", verifyToken, markAllAsRead);
router.patch("/:id/read", verifyToken, markNotificationAsRead);
router.post("/send", verifyToken, requireRole("admin", "hr", "manager"), sendNotification);
router.post("/broadcast", verifyToken, requireRole("admin", "hr"), broadcastNotification);

export default router;
