import Announcement from "../models/Announcement.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createBulkNotifications } from "../services/notificationService.js";
import { createAuditLog } from "../services/auditService.js";

export const createAnnouncement = asyncHandler(async (req, res) => {
  const { title, message, targetRole = "all" } = req.body;
  if (!title || !message) {
    return res.status(400).json({ message: "title and message are required" });
  }

  const announcement = await Announcement.create({
    title,
    message,
    targetRole,
    createdBy: req.user._id,
  });

  const recipients = await User.find(targetRole === "all" ? {} : { role: targetRole }).select("_id");
  await createBulkNotifications({
    userIds: recipients.map((item) => item._id),
    title: `Announcement: ${title}`,
    message,
    type: "announcement",
  });

  await createAuditLog({
    userId: req.user._id,
    action: "announcement created",
    targetType: "Announcement",
    targetId: announcement._id,
  });

  return res.status(201).json(announcement);
});

export const listAnnouncements = asyncHandler(async (req, res) => {
  const role = String(req.user.role || "").toLowerCase();

  const announcements = await Announcement.find({
    $or: [{ targetRole: "all" }, { targetRole: role }],
  })
    .populate("createdBy", "name email role")
    .sort({ createdAt: -1 });

  return res.json(announcements);
});

export const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findByIdAndDelete(req.params.id);
  if (!announcement) return res.status(404).json({ message: "Announcement not found" });

  await createAuditLog({
    userId: req.user._id,
    action: "announcement deleted",
    targetType: "Announcement",
    targetId: req.params.id,
  });

  return res.json({ message: "Announcement deleted" });
});
