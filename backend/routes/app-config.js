const express = require("express");
const router = express.Router();
const { sql } = require("../db/client");

// GET /api/app-config
// Returns all configuration keys as a single JSON object.
// Accessible publicly by the UtilitasKu mobile app.
router.get("/", async (req, res) => {
  try {
    const rows = await sql("SELECT key, value FROM app_config");
    
    // Convert array of rows [{key: 'a', value: 'b'}] to object {a: 'b'}
    const config = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }

    res.json(config);
  } catch (error) {
    console.error("Error fetching app config:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Admin-only updates (optional for future, but manual SQL is also fine)
// We only expose GET here since this is public. Admin updates will be done
// via manual DB update or an admin panel route later.

module.exports = router;
