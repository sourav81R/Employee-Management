import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    targetRole: {
      type: String,
      enum: ["all", "admin", "hr", "manager", "employee"],
      default: "all",
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

announcementSchema.index({ targetRole: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
