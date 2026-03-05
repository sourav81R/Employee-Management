import AuditLog from "../models/AuditLog.js";

export async function createAuditLog({ userId, action, targetType, targetId, metadata = {} }) {
  if (!userId || !action || !targetType) return null;
  return AuditLog.create({
    userId,
    action,
    targetType,
    targetId: targetId ? String(targetId) : "",
    metadata,
  });
}
