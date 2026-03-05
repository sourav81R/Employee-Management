import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    employees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
