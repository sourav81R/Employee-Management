// server/routes/employeeRoutes.js
import express from "express";
import Employee from "../models/Employee.js";   // make sure you have Employee model created
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== CREATE EMPLOYEE (Admin only) =====
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, email, position, salary } = req.body;
    const employee = new Employee({ name, email, position, salary });
    await employee.save();
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== GET ALL EMPLOYEES (Protected) =====
router.get("/", protect, async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== GET SINGLE EMPLOYEE BY ID =====
router.get("/:id", protect, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== UPDATE EMPLOYEE (Admin only) =====
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json(employee);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ===== DELETE EMPLOYEE (Admin only) =====
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) return res.status(404).json({ message: "Employee not found" });
    res.json({ message: "Employee deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
