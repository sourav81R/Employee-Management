export function requireRole(...roles) {
  const normalized = roles.map((role) => String(role || "").toLowerCase());

  return (req, res, next) => {
    const currentRole = String(req.user?.role || "").toLowerCase();
    if (!currentRole || !normalized.includes(currentRole)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }
    return next();
  };
}
