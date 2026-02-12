import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  // Reference to the User model
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Legacy field support (if your system used userId before)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  photoUrl: String, // Base64 string of the captured image
  latitude: Number,
  longitude: Number,
  locationName: String,
  deviceType: String,
  timestamp: {
    type: Date,
    default: Date.now,
  },
  date: String, // For daily check-in uniqueness
  checkIn: Date,
  checkOut: Date,
  workedMinutes: { type: Number, default: 0 },
  salaryCut: { type: Boolean, default: false },
  shortByMinutes: { type: Number, default: 0 },
});

export default mongoose.model("Attendance", attendanceSchema);
