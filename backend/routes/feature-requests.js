// routes/feature-requests.js — mobile POST + admin GET/PATCH
const router = require("express").Router();
const { adminAuth } = require("../middleware/auth");
const { sql } = require("../db/client");

function toJson(r) {
  return {
    id: r.id,
    device_id: r.device_id,
    message: r.message,
    read: r.read,
    created_at: r.created_at.toISOString(),
  };
}

// POST /api/feature-requests — mobile app (no auth)
router.post("/", async (req, res) => {
  try {
    const { device_id, message } = req.body;
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: "Pesan tidak boleh kosong" });
    }
    const [row] = await sql`
      INSERT INTO feature_requests (device_id, message)
      VALUES (${device_id ?? null}, ${message.trim()})
      RETURNING *
    `;
    res.status(201).json(toJson(row));
  } catch (err) {
    console.error("Feature request submit error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/feature-requests?unread=true — admin only
router.get("/", adminAuth, async (req, res) => {
  try {
    const { unread } = req.query;
    const rows =
      unread === "true"
        ? await sql`SELECT * FROM feature_requests WHERE read = FALSE ORDER BY created_at DESC LIMIT 200`
        : await sql`SELECT * FROM feature_requests ORDER BY created_at DESC LIMIT 200`;
    res.json(rows.map(toJson));
  } catch (err) {
    console.error("Get feature requests error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PATCH /api/admin/feature-requests/:id/read — admin only
router.patch("/:id/read", adminAuth, async (req, res) => {
  try {
    const rows =
      await sql`UPDATE feature_requests SET read = TRUE WHERE id = ${req.params.id} RETURNING *`;
    if (rows.length === 0)
      return res.status(404).json({ message: "Tidak ditemukan" });
    res.json(toJson(rows[0]));
  } catch (err) {
    console.error("Mark read error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
