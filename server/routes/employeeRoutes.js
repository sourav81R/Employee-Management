// server/routes/employeeRoutes.js

import express from "express";
const router = express.Router();

// In-memory "database" for demo
let employees = [];

// ===== Get all employees =====
router.get("/", (req, res) => {
  res.json(employees);
});

// ===== Add new employee =====
router.post("/", (req, res) => {
  const { name, position, salary } = req.body;
  const newEmployee = { id: Date.now(), name, position, salary };
  employees.push(newEmployee);
  res.status(201).json({ message: "Employee added", employee: newEmployee });
});

// ===== Update employee =====
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { name, position, salary } = req.body;

  const employee = employees.find(emp => emp.id == id);
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  employee.name = name || employee.name;
  employee.position = position || employee.position;
  employee.salary = salary || employee.salary;

  res.json({ message: "Employee updated", employee });
});

// ===== Delete employee =====
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  employees = employees.filter(emp => emp.id != id);
  res.json({ message: "Employee deleted" });
});

export default router;
