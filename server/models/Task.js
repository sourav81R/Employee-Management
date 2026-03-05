import mongoose from "mongoose";
import { TASK_PRIORITY, TASK_STATUS } from "../utils/constants.js";

const taskCommentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const taskAttachmentSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    fileUrl: { type: String, required: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    deadline: { type: Date, required: true },
    priority: { type: String, enum: TASK_PRIORITY, default: "Medium" },
    status: { type: String, enum: TASK_STATUS, default: "Pending" },
    attachments: { type: [taskAttachmentSchema], default: [] },
    comments: { type: [taskCommentSchema], default: [] },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1 });

export default mongoose.model("Task", taskSchema);
