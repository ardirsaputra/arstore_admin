// middleware/auth.js — JWT verification for admin routes
const jwt = require("jsonwebtoken");

function adminAuth(req, res, next) {
  const header = req.headers["authorization"];
  if (!header || !header.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid Authorization header" });
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Token expired or invalid" });
  }
}

module.exports = { adminAuth };
