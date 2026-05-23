// routes/admin-auth.js — POST /api/admin/auth/login
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sql } = require("../db/client");

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Username dan password wajib diisi" });
    }
    const rows =
      await sql`SELECT id, username, password_hash FROM admin_users WHERE username = ${username}`;
    if (rows.length === 0) {
      return res.status(401).json({ message: "Username atau password salah" });
    }
    const admin = rows[0];
    const match = await bcrypt.compare(password, admin.password_hash);
    if (!match) {
      return res.status(401).json({ message: "Username atau password salah" });
    }
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );
    res.json({ token, username: admin.username });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
