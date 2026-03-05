import mongoose from "mongoose";
import { CANDIDATE_STATUS } from "../utils/constants.js";

const candidateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    resume: { type: String, default: "" },
    position: { type: String, required: true, trim: true },
    status: { type: String, enum: CANDIDATE_STATUS, default: "Applied" },
    interviewDate: { type: Date, default: null },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

candidateSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Candidate", candidateSchema);
