// routes/payment-info.js — shared by both admin (auth required) and mobile (public GET)
const router = require("express").Router();
const { adminAuth } = require("../middleware/auth");
const { sql } = require("../db/client");

function toJson(row) {
  if (!row) return null;
  return {
    whatsapp: row.whatsapp ?? null,
    email: row.email ?? null,
    bank_name: row.bank_name ?? null,
    bank_account: row.bank_account ?? null,
    bank_holder: row.bank_holder ?? null,
    qris_url: row.qris_url ?? null,
    note: row.note ?? null,
  };
}

// GET /api/payment-info — public (used by mobile app)
// GET /api/admin/payment-info — admin (same data, requires auth — handled in server.js routing)
router.get("/", async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM payment_info WHERE id = 1`;
    res.json(toJson(rows[0] ?? null) ?? {});
  } catch (err) {
    console.error("Get payment info error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/admin/payment-info — admin only
router.put("/", adminAuth, async (req, res) => {
  try {
    const {
      whatsapp,
      email,
      bank_name,
      bank_account,
      bank_holder,
      qris_url,
      note,
    } = req.body;
    const [updated] = await sql`
      UPDATE payment_info SET
        whatsapp     = ${whatsapp ?? null},
        email        = ${email ?? null},
        bank_name    = ${bank_name ?? null},
        bank_account = ${bank_account ?? null},
        bank_holder  = ${bank_holder ?? null},
        qris_url     = ${qris_url ?? null},
        note         = ${note ?? null},
        updated_at   = NOW()
      WHERE id = 1
      RETURNING *
    `;
    res.json(toJson(updated));
  } catch (err) {
    console.error("Update payment info error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
