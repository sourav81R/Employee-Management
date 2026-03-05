import Notification from "../models/Notification.js";
import { emitToUser } from "./socketService.js";

export async function createNotification({ userId, title, message, type = "info" }) {
  if (!userId) return null;
  const notification = await Notification.create({ userId, title, message, type });
  emitToUser(userId, "notification:new", notification);
  return notification;
}

export async function createBulkNotifications({ userIds = [], title, message, type = "info" }) {
  const uniqueIds = Array.from(new Set(userIds.map((id) => String(id))));
  if (!uniqueIds.length) return [];
  const payload = uniqueIds.map((userId) => ({ userId, title, message, type }));
  const notifications = await Notification.insertMany(payload);
  notifications.forEach((item) => emitToUser(item.userId, "notification:new", item));
  return notifications;
}
