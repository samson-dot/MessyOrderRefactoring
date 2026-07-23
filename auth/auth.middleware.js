import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export const authenticate = (req, res, next) => {
  // 1. pull the token out of the "Authorization: Bearer <token>" header
  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "missing or invalid token" });
  }

  // 2. verify it's genuine (our signature) and not expired
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    req.user = payload;   // { id, role } — the app now knows WHO is calling
    next();               // let the request continue
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }
};

// Admin shittt
// Authorization
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "forbidden" });
    }
    next();
  };
};