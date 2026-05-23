// routes/mobile-license.js — Mobile app license endpoints
//   POST /api/license/register     — register / update device
//   GET  /api/license/status/:id   — get license status
//   POST /api/license/activate      — activate with code
//   POST /api/license/register-user — attach user info to device

const router = require("express").Router();
const { sql } = require("../db/client");

const TRIAL_DAYS = parseInt(process.env.TRIAL_DAYS ?? "14", 10);

function toStatusJson(row) {
  if (!row) return null;
  const now = new Date();

  let status = row.status;
  // Auto-expire if past expiry_date
  if (
    status === "active" &&
    row.expiry_date &&
    !row.is_permanent &&
    now > new Date(row.expiry_date)
  ) {
    status = "expired";
  }
  if (status === "trial") {
    const trialEnd = new Date(row.trial_start_date);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    if (now > trialEnd) status = "expired";
  }

  return {
    success: true,
    device_id: row.device_id,
    device_model: row.device_model,
    status,
    activation_type: row.is_permanent
      ? "permanent"
      : status === "trial"
        ? "trial"
        : "timed",
    user_name: row.user_name ?? null,
    user_email: row.user_email ?? null,
    trial_start_date: row.trial_start_date?.toISOString() ?? null,
    expiry_date: row.expiry_date?.toISOString() ?? null,
    is_permanent: row.is_permanent,
    checked_at: now.toISOString(),
  };
}

// POST /api/license/register
router.post("/register", async (req, res) => {
  try {
    const { device_id, device_model = "" } = req.body;
    if (!device_id)
      return res
        .status(400)
        .json({ success: false, message: "device_id wajib diisi" });

    const existing =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (existing.length > 0) {
      // Update last_checked_at + model if changed
      const [updated] = await sql`
        UPDATE devices SET device_model = ${device_model || existing[0].device_model}, last_checked_at = NOW()
        WHERE device_id = ${device_id} RETURNING *
      `;
      return res.json(toStatusJson(updated));
    }

    // New device — start trial
    const [row] = await sql`
      INSERT INTO devices (device_id, device_model, status, trial_start_date)
      VALUES (${device_id}, ${device_model}, 'trial', NOW())
      RETURNING *
    `;
    res.status(201).json(toStatusJson(row));
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/license/status/:deviceId
router.get("/status/:deviceId", async (req, res) => {
  try {
    const rows =
      await sql`SELECT * FROM devices WHERE device_id = ${req.params.deviceId}`;
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Perangkat belum terdaftar" });

    // Auto-sync expired status to DB
    const json = toStatusJson(rows[0]);
    if (json.status !== rows[0].status) {
      await sql`UPDATE devices SET status = ${json.status}, last_checked_at = NOW() WHERE device_id = ${req.params.deviceId}`;
    } else {
      await sql`UPDATE devices SET last_checked_at = NOW() WHERE device_id = ${req.params.deviceId}`;
    }
    res.json(json);
  } catch (err) {
    console.error("Status error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/license/activate  { device_id, code }
router.post("/activate", async (req, res) => {
  try {
    const { device_id, code } = req.body;
    if (!device_id || !code)
      return res
        .status(400)
        .json({ success: false, message: "device_id dan code wajib diisi" });

    const normalizedCode = code.trim().toUpperCase();
    const codeRows =
      await sql`SELECT * FROM license_codes WHERE code = ${normalizedCode}`;
    if (codeRows.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "Kode tidak ditemukan" });

    const licCode = codeRows[0];
    if (licCode.used)
      return res
        .status(400)
        .json({ success: false, message: "Kode sudah pernah digunakan" });

    // Ensure device exists
    const devRows =
      await sql`SELECT * FROM devices WHERE device_id = ${device_id}`;
    if (devRows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Perangkat belum terdaftar" });

    const isLifetime = licCode.type === "lifetime";
    let expiryDate = null;
    if (!isLifetime && licCode.duration_months) {
      expiryDate = new Date();
      expiryDate.setMonth(expiryDate.getMonth() + licCode.duration_months);
    }

    // Mark code as used
    await sql`
      UPDATE license_codes SET used = TRUE, used_by_device_id = ${device_id}, used_at = NOW()
      WHERE code = ${normalizedCode}
    `;

    // Activate device
    const [updated] = await sql`
      UPDATE devices
      SET status = 'active', is_permanent = ${isLifetime}, expiry_date = ${expiryDate}, last_checked_at = NOW()
      WHERE device_id = ${device_id}
      RETURNING *
    `;
    res.json(toStatusJson(updated));
  } catch (err) {
    console.error("Activate error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/license/register-user  { device_id, name, email, password }
router.post("/register-user", async (req, res) => {
  try {
    const { device_id, name, email } = req.body;
    if (!device_id)
      return res
        .status(400)
        .json({ success: false, message: "device_id wajib diisi" });

    const rows =
      await sql`SELECT id FROM devices WHERE device_id = ${device_id}`;
    if (rows.length === 0)
      return res
        .status(404)
        .json({ success: false, message: "Perangkat belum terdaftar" });

    await sql`UPDATE devices SET user_name = ${name ?? null}, user_email = ${email ?? null} WHERE device_id = ${device_id}`;
    res.json({ success: true, message: "Data pengguna berhasil disimpan" });
  } catch (err) {
    console.error("Register user error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
