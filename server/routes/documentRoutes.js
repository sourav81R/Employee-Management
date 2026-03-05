import { Router } from "express";
import {
  uploadEmployeeDocument,
  updateDocument,
  deleteDocument,
  myDocuments,
  listDocuments,
  verifyDocument,
} from "../controllers/documentController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/rbacMiddleware.js";
import { uploadDocument } from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/upload", verifyToken, uploadDocument.single("file"), uploadEmployeeDocument);
router.get("/my", verifyToken, myDocuments);
router.get("/", verifyToken, requireRole("admin", "hr", "manager"), listDocuments);
router.put("/:id", verifyToken, uploadDocument.single("file"), updateDocument);
router.delete("/:id", verifyToken, deleteDocument);
router.patch("/:id/verify", verifyToken, requireRole("admin", "hr"), verifyDocument);

export default router;
