import Candidate from "../models/Candidate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createAuditLog } from "../services/auditService.js";

export const createCandidate = asyncHandler(async (req, res) => {
  const { name, email, resume = "", position, status = "Applied", interviewDate = null, notes = "" } = req.body;

  if (!name || !email || !position) {
    return res.status(400).json({ message: "name, email and position are required" });
  }

  const candidate = await Candidate.create({
    name,
    email: String(email).toLowerCase().trim(),
    resume,
    position,
    status,
    interviewDate,
    notes,
  });

  await createAuditLog({
    userId: req.user._id,
    action: "candidate created",
    targetType: "Candidate",
    targetId: candidate._id,
  });

  return res.status(201).json(candidate);
});

export const listCandidates = asyncHandler(async (_req, res) => {
  const candidates = await Candidate.find().sort({ createdAt: -1 });
  return res.json(candidates);
});

export const updateCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!candidate) return res.status(404).json({ message: "Candidate not found" });

  await createAuditLog({
    userId: req.user._id,
    action: "candidate updated",
    targetType: "Candidate",
    targetId: candidate._id,
  });

  return res.json(candidate);
});

export const deleteCandidate = asyncHandler(async (req, res) => {
  const candidate = await Candidate.findByIdAndDelete(req.params.id);
  if (!candidate) return res.status(404).json({ message: "Candidate not found" });
  return res.json({ message: "Candidate deleted" });
});
