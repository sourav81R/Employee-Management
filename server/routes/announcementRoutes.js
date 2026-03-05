import { Router } from "express";
import {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} from "../controllers/announcementController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";

const router = Router();

router.post("/", verifyToken, requireRole("admin", "hr"), createAnnouncement);
router.get("/", verifyToken, listAnnouncements);
router.delete("/:id", verifyToken, requireRole("admin", "hr"), deleteAnnouncement);

export default router;
