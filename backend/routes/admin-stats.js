// routes/admin-stats.js — GET /api/admin/stats
const router = require("express").Router();
const { adminAuth } = require("../middleware/auth");
const { sql } = require("../db/client");

router.get("/", adminAuth, async (req, res) => {
  try {
    const [deviceStats] = await sql`
      SELECT
        COUNT(*)                                            AS total_devices,
        COUNT(*) FILTER (WHERE status = 'active')          AS active_devices,
        COUNT(*) FILTER (WHERE status = 'trial')           AS trial_devices,
        COUNT(*) FILTER (WHERE status = 'expired')         AS expired_devices
      FROM devices
    `;
    const [codeStats] = await sql`
      SELECT
        COUNT(*)                                 AS total_codes,
        COUNT(*) FILTER (WHERE used = TRUE)      AS used_codes
      FROM license_codes
    `;
    res.json({
      total_devices: parseInt(deviceStats.total_devices, 10),
      active_devices: parseInt(deviceStats.active_devices, 10),
      trial_devices: parseInt(deviceStats.trial_devices, 10),
      expired_devices: parseInt(deviceStats.expired_devices, 10),
      total_codes: parseInt(codeStats.total_codes, 10),
      used_codes: parseInt(codeStats.used_codes, 10),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
