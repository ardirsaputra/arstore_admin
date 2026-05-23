// routes/admin-devices.js — device management for admin panel
const router = require("express").Router();
const { adminAuth } = require("../middleware/auth");
const { sql } = require("../db/client");

function toDeviceJson(row) {
  return {
    device_id: row.device_id,
    device_model: row.device_model,
    status: row.status,
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date?.toISOString() ?? null,
    expiry_date: row.expiry_date?.toISOString() ?? null,
    is_permanent: row.is_permanent,
    checked_at: row.last_checked_at?.toISOString() ?? null,
  };
}

// GET /api/admin/devices?status=active&q=search
router.get("/", adminAuth, async (req, res) => {
  try {
    const { status, q } = req.query;
    let rows;
    if (status && q) {
      rows = await sql`
        SELECT * FROM devices
        WHERE status = ${status}
          AND (device_id ILIKE ${"%" + q + "%"} OR user_name ILIKE ${"%" + q + "%"} OR user_email ILIKE ${"%" + q + "%"})
        ORDER BY last_checked_at DESC LIMIT 200
      `;
    } else if (status) {
      rows =
        await sql`SELECT * FROM devices WHERE status = ${status} ORDER BY last_checked_at DESC LIMIT 200`;
    } else if (q) {
      rows = await sql`
        SELECT * FROM devices
        WHERE device_id ILIKE ${"%" + q + "%"} OR user_name ILIKE ${"%" + q + "%"} OR user_email ILIKE ${"%" + q + "%"}
        ORDER BY last_checked_at DESC LIMIT 200
      `;
    } else {
      rows =
        await sql`SELECT * FROM devices ORDER BY last_checked_at DESC LIMIT 200`;
    }
    res.json(rows.map(toDeviceJson));
  } catch (err) {
    console.error("Get devices error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/devices/:id
router.get("/:id", adminAuth, async (req, res) => {
  try {
    const rows =
      await sql`SELECT * FROM devices WHERE device_id = ${req.params.id}`;
    if (rows.length === 0)
      return res.status(404).json({ message: "Perangkat tidak ditemukan" });
    res.json(toDeviceJson(rows[0]));
  } catch (err) {
    console.error("Get device error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/devices/:id/activate
// Body: { expiry_date?: ISO string, permanent?: boolean }
router.post("/:id/activate", adminAuth, async (req, res) => {
  try {
    const { expiry_date, permanent = false } = req.body;
    const rows =
      await sql`SELECT id FROM devices WHERE device_id = ${req.params.id}`;
    if (rows.length === 0)
      return res.status(404).json({ message: "Perangkat tidak ditemukan" });

    let updated;
    if (permanent) {
      [updated] = await sql`
        UPDATE devices
        SET status = 'active', is_permanent = TRUE, expiry_date = NULL, last_checked_at = NOW()
        WHERE device_id = ${req.params.id}
        RETURNING *
      `;
    } else if (expiry_date) {
      [updated] = await sql`
        UPDATE devices
        SET status = 'active', is_permanent = FALSE, expiry_date = ${new Date(expiry_date)}, last_checked_at = NOW()
        WHERE device_id = ${req.params.id}
        RETURNING *
      `;
    } else {
      // Default: 30 days
      [updated] = await sql`
        UPDATE devices
        SET status = 'active', is_permanent = FALSE, expiry_date = NOW() + INTERVAL '30 days', last_checked_at = NOW()
        WHERE device_id = ${req.params.id}
        RETURNING *
      `;
    }
    res.json(toDeviceJson(updated));
  } catch (err) {
    console.error("Activate device error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/admin/devices/:id/revoke
router.post("/:id/revoke", adminAuth, async (req, res) => {
  try {
    const rows =
      await sql`SELECT id FROM devices WHERE device_id = ${req.params.id}`;
    if (rows.length === 0)
      return res.status(404).json({ message: "Perangkat tidak ditemukan" });

    const [updated] = await sql`
      UPDATE devices
      SET status = 'expired', is_permanent = FALSE, expiry_date = NOW(), last_checked_at = NOW()
      WHERE device_id = ${req.params.id}
      RETURNING *
    `;
    res.json(toDeviceJson(updated));
  } catch (err) {
    console.error("Revoke device error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
