// routes/admin-codes.js — license code generation & listing
const router = require("express").Router();
const { adminAuth } = require("../middleware/auth");
const { sql } = require("../db/client");

// Duration in months by type
const DURATION_MAP = {
  monthly: 1,
  "6months": 6,
  yearly: 12,
  "2years": 24,
  lifetime: null,
};

// Generate codes in format ARST-XXXX-XXXX-XXXX
function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // remove ambiguous chars
  function seg(n) {
    return Array.from(
      { length: n },
      () => chars[Math.floor(Math.random() * chars.length)],
    ).join("");
  }
  return `ARST-${seg(4)}-${seg(4)}-${seg(4)}`;
}

// POST /api/admin/codes/generate
// Body: { type: string, quantity: number }
router.post("/generate", adminAuth, async (req, res) => {
  try {
    const { type, quantity = 1 } = req.body;
    if (!DURATION_MAP.hasOwnProperty(type)) {
      return res
        .status(400)
        .json({
          message: `Tipe tidak valid. Gunakan: ${Object.keys(DURATION_MAP).join(", ")}`,
        });
    }
    const qty = Math.min(Math.max(parseInt(quantity, 10), 1), 100);
    const durationMonths = DURATION_MAP[type];

    const codes = [];
    for (let i = 0; i < qty; i++) {
      // Retry on collision (very unlikely)
      let code;
      let attempts = 0;
      while (attempts < 5) {
        code = generateCode();
        const existing =
          await sql`SELECT id FROM license_codes WHERE code = ${code}`;
        if (existing.length === 0) break;
        attempts++;
      }
      await sql`
        INSERT INTO license_codes (code, type, duration_months)
        VALUES (${code}, ${type}, ${durationMonths})
      `;
      codes.push(code);
    }
    res.json({ codes, type, quantity: codes.length });
  } catch (err) {
    console.error("Generate codes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/admin/codes?unused=true
router.get("/", adminAuth, async (req, res) => {
  try {
    const { unused } = req.query;
    let rows;
    if (unused === "true") {
      rows =
        await sql`SELECT * FROM license_codes WHERE used = FALSE ORDER BY created_at DESC LIMIT 500`;
    } else {
      rows =
        await sql`SELECT * FROM license_codes ORDER BY created_at DESC LIMIT 500`;
    }
    res.json(
      rows.map((r) => ({
        code: r.code,
        type: r.type,
        duration_months: r.duration_months,
        used: r.used,
        used_by_device_id: r.used_by_device_id,
        created_at: r.created_at.toISOString(),
        used_at: r.used_at?.toISOString() ?? null,
      })),
    );
  } catch (err) {
    console.error("Get codes error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
