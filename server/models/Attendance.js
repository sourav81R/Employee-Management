import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    photoUrl: String,
    latitude: Number,
    longitude: Number,
    locationName: String,
    deviceType: String,
    timestamp: { type: Date, default: Date.now },
    date: { type: String, required: true },
    checkIn: Date,
    checkOut: Date,
    workedMinutes: { type: Number, default: 0 },
    salaryCut: { type: Boolean, default: false },
    shortByMinutes: { type: Number, default: 0 },
    minimumRequiredHours: { type: Number, default: 8 },
    minimumRequiredMinutes: { type: Number, default: 480 },
    shiftId: { type: mongoose.Schema.Types.ObjectId, ref: "Shift", default: null },
  },
  { timestamps: true }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
