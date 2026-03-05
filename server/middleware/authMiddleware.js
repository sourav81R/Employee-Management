import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: missing token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    const user = await User.findById(payload.id).select("-password");
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: "Unauthorized: account inactive or missing" });
    }
    req.user = user;
    return next();
  } catch (_err) {
    return res.status(401).json({ message: "Unauthorized: invalid token" });
  }
}
