// ===== Imports =====
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();

// ===== Middleware =====
app.use(cors());
app.use(express.json());

// ===== MongoDB Connection =====
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ===== User Schema =====
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["user", "admin"], default: "user" },
});
const User = mongoose.model("User", userSchema);

// ===== Employee Schema =====
const employeeSchema = new mongoose.Schema({
  employeeId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  position: { type: String },
  department: { type: String },
  salary: { type: Number },
  lastPaid: { type: Date }, // ✅ Track salary payment date
});
const Employee = mongoose.model("Employee", employeeSchema);

// ===== Root Route =====
app.get("/", (req, res) => {
  res.send("🚀 Auth & Employee Management API is running...");
});

// ====================== AUTH ROUTES ======================

// ➤ Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    res.status(201).json({
      message: "✅ Registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("❌ Registration error:", error.message);
    res.status(500).json({ message: "❌ Server error during registration" });
  }
});

// ➤ Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "✅ Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ message: "❌ Server error during login" });
  }
});

// ====================== EMPLOYEE ROUTES ======================

// ➤ Get all employees
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error("❌ Failed to fetch employees:", error.message);
    res.status(500).json({
      message: "❌ Failed to fetch employees",
      error: error.message,
    });
  }
});

// ➤ Create employee
app.post("/api/employees", async (req, res) => {
  try {
    const { employeeId, name, email, position, department, salary } = req.body;

    if (!employeeId || !name || !email) {
      return res
        .status(400)
        .json({ message: "Employee ID, name, and email are required" });
    }

    const existingEmployee = await Employee.findOne({ employeeId });
    if (existingEmployee)
      return res.status(400).json({ message: "Employee ID already exists" });

    const newEmployee = await Employee.create({
      employeeId,
      name,
      email,
      position,
      department,
      salary,
    });

    res.status(201).json({
      message: "✅ Employee added successfully",
      employee: newEmployee,
    });
  } catch (error) {
    console.error("❌ Employee creation error:", error.message);
    res.status(500).json({
      message: "❌ Failed to add employee",
      error: error.message,
    });
  }
});

// ➤ Update employee
app.put("/api/employees/:id", async (req, res) => {
  try {
    const updated = await Employee.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updated)
      return res.status(404).json({ message: "Employee not found" });
    res.json({
      message: "✅ Employee updated successfully",
      employee: updated,
    });
  } catch (error) {
    console.error("❌ Update employee error:", error.message);
    res.status(500).json({
      message: "❌ Failed to update employee",
      error: error.message,
    });
  }
});

// ➤ Delete employee
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const deleted = await Employee.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "✅ Employee deleted successfully" });
  } catch (error) {
    console.error("❌ Delete employee error:", error.message);
    res.status(500).json({
      message: "❌ Failed to delete employee",
      error: error.message,
    });
  }
});

// ➤ Pay salary
app.post("/api/employees/pay/:id", async (req, res) => {
  try {
    const emp = await Employee.findById(req.params.id);
    if (!emp)
      return res.status(404).json({ message: "❌ Employee not found" });

    // Simulate payment (update lastPaid)
    emp.lastPaid = new Date();
    await emp.save();

    const formattedDate = emp.lastPaid.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    console.log(`💰 Salary of ₹${emp.salary} paid to ${emp.name} (${formattedDate})`);

    res.json({
      message: `💰 Salary of ₹${emp.salary || "N/A"} paid to ${emp.name} on ${formattedDate}`,
      employee: emp,
    });
  } catch (error) {
    console.error("💥 Salary payment error:", error.message);
    res.status(500).json({
      message: "❌ Failed to pay salary",
      error: error.message,
    });
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
