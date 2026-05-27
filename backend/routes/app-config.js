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

// PUT /api/app-config/:key
// Admin-only updates
const authMiddleware = require("../middleware/auth");
router.put("/:key", authMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ message: "value is required" });
    }

    // Upsert the config key
    await sql(
      `INSERT INTO app_config (key, value, updated_at) 
       VALUES ($1, $2, NOW()) 
       ON CONFLICT (key) 
       DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, JSON.stringify(value)]
    );

    res.json({ message: "Config updated successfully", key, value });
  } catch (error) {
    console.error("Error updating app config:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
