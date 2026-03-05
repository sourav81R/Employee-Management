import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { DOCUMENT_TYPES } from "../utils/constants.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverRoot = path.resolve(__dirname, "..");

function resolveStoredFilePath(fileUrl) {
  const normalized = String(fileUrl || "").replace(/^\/+/, "");
  return path.join(serverRoot, normalized);
}

function canManageDocument(currentUser, doc) {
  const role = String(currentUser?.role || "").toLowerCase();
  const isOwner = String(doc.employeeId) === String(currentUser?._id);
  const isPrivileged = role === "admin" || role === "hr";
  return { isOwner, isPrivileged, role };
}

export const uploadEmployeeDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "File is required" });
  }

  const targetEmployeeId = req.body.employeeId || req.user._id;
  const relativeFilePath = `/uploads/documents/${path.basename(req.file.path)}`;

  const document = await Document.create({
    employeeId: targetEmployeeId,
    documentType: req.body.documentType || "Other",
    fileUrl: relativeFilePath,
    fileName: req.file.originalname,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
    status: "Pending",
  });

  await createAuditLog({
    userId: req.user._id,
    action: "document uploaded",
    targetType: "Document",
    targetId: document._id,
  });

  return res.status(201).json(document);
});

export const updateDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const { isOwner, isPrivileged } = canManageDocument(req.user, doc);
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: "Forbidden: You can update only your own document" });
  }

  const nextType = req.body?.documentType;
  if (nextType && !DOCUMENT_TYPES.includes(nextType)) {
    return res.status(400).json({ message: `Invalid documentType. Allowed: ${DOCUMENT_TYPES.join(", ")}` });
  }

  const previousFile = doc.fileUrl;
  if (nextType) {
    doc.documentType = nextType;
  }

  if (req.file) {
    doc.fileUrl = `/uploads/documents/${path.basename(req.file.path)}`;
    doc.fileName = req.file.originalname;
    doc.mimeType = req.file.mimetype;
    doc.uploadedAt = new Date();
  }

  // Any owner edit sends document back for verification.
  if (isOwner) {
    doc.status = "Pending";
    doc.verifiedBy = null;
  }

  await doc.save();

  if (req.file && previousFile && previousFile !== doc.fileUrl) {
    const absoluteOldPath = resolveStoredFilePath(previousFile);
    if (fs.existsSync(absoluteOldPath)) {
      fs.unlink(absoluteOldPath, () => {});
    }
  }

  await createAuditLog({
    userId: req.user._id,
    action: "document updated",
    targetType: "Document",
    targetId: doc._id,
  });

  return res.json(doc);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  const { isOwner, isPrivileged } = canManageDocument(req.user, doc);
  if (!isOwner && !isPrivileged) {
    return res.status(403).json({ message: "Forbidden: You can delete only your own document" });
  }

  const absolutePath = resolveStoredFilePath(doc.fileUrl);
  await doc.deleteOne();

  if (fs.existsSync(absolutePath)) {
    fs.unlink(absolutePath, () => {});
  }

  await createAuditLog({
    userId: req.user._id,
    action: "document deleted",
    targetType: "Document",
    targetId: req.params.id,
  });

  return res.json({ message: "Document deleted successfully" });
});

export const myDocuments = asyncHandler(async (req, res) => {
  const docs = await Document.find({ employeeId: req.user._id })
    .populate("verifiedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(docs);
});

export const listDocuments = asyncHandler(async (_req, res) => {
  const docs = await Document.find()
    .populate("employeeId", "name email role")
    .populate("verifiedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(docs);
});

export const verifyDocument = asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!["Verified", "Rejected"].includes(status)) {
    return res.status(400).json({ message: "status must be Verified or Rejected" });
  }

  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: "Document not found" });

  doc.status = status;
  doc.verifiedBy = req.user._id;
  await doc.save();

  await createNotification({
    userId: doc.employeeId,
    title: "Document Verification Update",
    message: `Your ${doc.documentType} document was ${status.toLowerCase()}.`,
    type: "document",
  });

  await createAuditLog({
    userId: req.user._id,
    action: `document ${status.toLowerCase()}`,
    targetType: "Document",
    targetId: doc._id,
  });

  return res.json(doc);
});
