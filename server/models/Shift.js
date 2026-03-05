import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    workHours: { type: Number, required: true, min: 1, max: 24 },
  },
  { timestamps: true }
);

export default mongoose.model("Shift", shiftSchema);
