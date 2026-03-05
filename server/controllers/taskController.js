import Task from "../models/Task.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

const OVERDUE_STATUS = ["Pending", "In Progress"];

async function markOverdueTasks() {
  await Task.updateMany(
    {
      deadline: { $lt: new Date() },
      status: { $in: OVERDUE_STATUS },
    },
    { $set: { status: "Overdue" } }
  );
}

export const createTask = asyncHandler(async (req, res) => {
  const { title, description, assignedTo, deadline, priority = "Medium", attachments = [] } = req.body;

  if (!title || !assignedTo || !deadline) {
    return res.status(400).json({ message: "title, assignedTo and deadline are required" });
  }

  const assignee = await User.findById(assignedTo).select("_id");
  if (!assignee) return res.status(404).json({ message: "Assigned user not found" });

  const task = await Task.create({
    title,
    description,
    assignedTo,
    assignedBy: req.user._id,
    deadline,
    priority,
    attachments,
  });

  await createNotification({
    userId: assignedTo,
    title: "New Task Assigned",
    message: `You were assigned a task: ${title}`,
    type: "task",
  });

  await createAuditLog({
    userId: req.user._id,
    action: "task assigned",
    targetType: "Task",
    targetId: task._id,
    metadata: { assignedTo },
  });

  return res.status(201).json(task);
});

export const listTasks = asyncHandler(async (req, res) => {
  await markOverdueTasks();

  const role = String(req.user.role || "").toLowerCase();
  let query = {};

  if (role === "employee") {
    query = { assignedTo: req.user._id };
  } else if (role === "manager") {
    query = { $or: [{ assignedBy: req.user._id }, { assignedTo: req.user._id }] };
  }

  const tasks = await Task.find(query)
    .populate("assignedTo", "name email role")
    .populate("assignedBy", "name email role")
    .populate("comments.userId", "name")
    .sort({ createdAt: -1 });

  return res.json(tasks);
});

export const myTasks = asyncHandler(async (req, res) => {
  await markOverdueTasks();

  const tasks = await Task.find({ assignedTo: req.user._id })
    .populate("assignedTo", "name email")
    .populate("assignedBy", "name email")
    .sort({ createdAt: -1 });

  return res.json(tasks);
});

export const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  const role = String(req.user.role || "").toLowerCase();
  const isAssignee = String(task.assignedTo) === String(req.user._id);
  const isOwner = String(task.assignedBy) === String(req.user._id);

  if (!isAssignee && !isOwner && role !== "admin" && role !== "hr") {
    return res.status(403).json({ message: "Forbidden" });
  }

  const allowedStatus = ["Pending", "In Progress", "Completed", "Overdue"];

  if (req.body.status && !allowedStatus.includes(req.body.status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  Object.assign(task, req.body);
  await task.save();

  if (isAssignee && req.body.status) {
    await createNotification({
      userId: task.assignedBy,
      title: "Task Status Updated",
      message: `${task.title} is now ${req.body.status}`,
      type: "task",
    });
  }

  await createAuditLog({
    userId: req.user._id,
    action: "task updated",
    targetType: "Task",
    targetId: task._id,
  });

  return res.json(task);
});

export const addTaskComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: "Comment text is required" });

  const task = await Task.findById(req.params.id);
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.comments.push({ userId: req.user._id, text });
  await task.save();

  await createNotification({
    userId: String(task.assignedBy) === String(req.user._id) ? task.assignedTo : task.assignedBy,
    title: "Task Comment",
    message: `New comment added to task: ${task.title}`,
    type: "task",
  });

  return res.json(task);
});

export const taskDashboard = asyncHandler(async (req, res) => {
  await markOverdueTasks();

  const role = String(req.user.role || "").toLowerCase();
  let match = {};

  if (role === "employee") {
    match = { assignedTo: req.user._id };
  } else if (role === "manager") {
    match = { $or: [{ assignedBy: req.user._id }, { assignedTo: req.user._id }] };
  }

  const stats = await Task.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const response = {
    total: 0,
    Pending: 0,
    "In Progress": 0,
    Completed: 0,
    Overdue: 0,
  };

  stats.forEach((item) => {
    response[item._id] = item.count;
    response.total += item.count;
  });

  return res.json(response);
});
