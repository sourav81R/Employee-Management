import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createBulkNotifications, createNotification } from "../services/notificationService.js";

export const myNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(100);
  return res.json(notifications);
});

export const unreadCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({ userId: req.user._id, read: false });
  return res.json({ unread: count });
});

export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id },
    { $set: { read: true } },
    { new: true }
  );

  if (!notification) return res.status(404).json({ message: "Notification not found" });
  return res.json(notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
  return res.json({ message: "All notifications marked as read" });
});

export const sendNotification = asyncHandler(async (req, res) => {
  const { userId, title, message, type = "info" } = req.body;
  if (!userId || !title || !message) return res.status(400).json({ message: "userId, title and message are required" });

  const notification = await createNotification({ userId, title, message, type });
  return res.status(201).json(notification);
});

export const broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = "announcement", targetRole = "all" } = req.body;
  if (!title || !message) return res.status(400).json({ message: "title and message are required" });

  const userQuery = targetRole === "all" ? {} : { role: targetRole };
  const users = await User.find(userQuery).select("_id");

  const notifications = await createBulkNotifications({
    userIds: users.map((item) => item._id),
    title,
    message,
    type,
  });

  return res.status(201).json({ sent: notifications.length });
});
