import mongoose from "mongoose";
import { DOCUMENT_TYPES } from "../utils/constants.js";

const documentSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    documentType: { type: String, enum: DOCUMENT_TYPES, default: "Other" },
    fileUrl: { type: String, required: true },
    fileName: { type: String, default: "" },
    mimeType: { type: String, default: "" },
    uploadedAt: { type: Date, default: Date.now },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["Pending", "Verified", "Rejected"], default: "Pending" },
  },
  { timestamps: true }
);

documentSchema.index({ employeeId: 1, documentType: 1 });

export default mongoose.model("Document", documentSchema);
