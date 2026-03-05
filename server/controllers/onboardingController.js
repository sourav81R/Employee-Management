import Onboarding from "../models/Onboarding.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";
import { createNotification } from "../services/notificationService.js";

export const createOnboarding = asyncHandler(async (req, res) => {
  const { employeeId, steps, documentsSubmitted = false, managerAssigned = false, status = "Pending" } = req.body;

  if (!employeeId) return res.status(400).json({ message: "employeeId is required" });

  const employee = await User.findById(employeeId).select("_id");
  if (!employee) return res.status(404).json({ message: "Employee not found" });

  const onboarding = await Onboarding.findOneAndUpdate(
    { employeeId },
    {
      $set: {
        employeeId,
        ...(steps ? { steps } : {}),
        documentsSubmitted,
        managerAssigned,
        status,
      },
    },
    { new: true, upsert: true }
  );

  await createAuditLog({
    userId: req.user._id,
    action: "onboarding created",
    targetType: "Onboarding",
    targetId: onboarding._id,
  });

  return res.status(201).json(onboarding);
});

export const listOnboarding = asyncHandler(async (_req, res) => {
  const items = await Onboarding.find().populate("employeeId", "name email role").sort({ createdAt: -1 });
  return res.json(items);
});

export const updateOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findById(req.params.id);
  if (!onboarding) return res.status(404).json({ message: "Onboarding record not found" });

  Object.assign(onboarding, req.body);
  await onboarding.save();

  await createNotification({
    userId: onboarding.employeeId,
    title: "Onboarding Updated",
    message: `Your onboarding status is now ${onboarding.status}.`,
    type: "onboarding",
  });

  return res.json(onboarding);
});

export const myOnboarding = asyncHandler(async (req, res) => {
  const onboarding = await Onboarding.findOne({ employeeId: req.user._id });
  return res.json(onboarding || null);
});
