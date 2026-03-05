import Department from "../models/Department.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, managerId = null, employees = [], description = "" } = req.body;
  if (!name) return res.status(400).json({ message: "Department name is required" });

  const exists = await Department.findOne({ name: String(name).trim() });
  if (exists) return res.status(409).json({ message: "Department already exists" });

  const department = await Department.create({ name: String(name).trim(), managerId, employees, description });

  if (employees.length) {
    await User.updateMany({ _id: { $in: employees } }, { $set: { department: department.name } });
  }

  await createAuditLog({
    userId: req.user._id,
    action: "department created",
    targetType: "Department",
    targetId: department._id,
  });

  return res.status(201).json(department);
});

export const listDepartments = asyncHandler(async (_req, res) => {
  const departments = await Department.find()
    .populate("managerId", "name email")
    .populate("employees", "name email role")
    .sort({ createdAt: -1 });
  return res.json(departments);
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate("managerId", "name email")
    .populate("employees", "name email role");

  if (!department) return res.status(404).json({ message: "Department not found" });

  if (department.employees?.length) {
    await User.updateMany({ _id: { $in: department.employees.map((item) => item._id || item) } }, { $set: { department: department.name } });
  }

  await createAuditLog({
    userId: req.user._id,
    action: "department updated",
    targetType: "Department",
    targetId: department._id,
  });

  return res.json(department);
});

export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) return res.status(404).json({ message: "Department not found" });

  await User.updateMany({ department: department.name }, { $set: { department: "" } });

  await createAuditLog({
    userId: req.user._id,
    action: "department deleted",
    targetType: "Department",
    targetId: req.params.id,
  });

  return res.json({ message: "Department deleted" });
});

export const assignEmployeesToDepartment = asyncHandler(async (req, res) => {
  const { employeeIds = [] } = req.body;
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ message: "Department not found" });

  department.employees = Array.from(new Set(employeeIds.map((id) => String(id))));
  await department.save();

  await User.updateMany({ _id: { $in: employeeIds } }, { $set: { department: department.name } });

  return res.json({ message: "Employees assigned successfully", department });
});

export const departmentAnalytics = asyncHandler(async (_req, res) => {
  const departments = await Department.find().lean();

  const data = departments.map((item) => ({
    name: item.name,
    employeeCount: Array.isArray(item.employees) ? item.employees.length : 0,
  }));

  const totalDepartments = data.length;
  const totalEmployees = data.reduce((sum, item) => sum + item.employeeCount, 0);

  return res.json({ totalDepartments, totalEmployees, distribution: data });
});
