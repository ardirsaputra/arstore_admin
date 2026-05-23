// db/init.js — Create tables and seed default admin user.
// Usage: node db/init.js  OR  npm run db:init
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { neonConfig, Pool } = require("@neondatabase/serverless");
const ws = require("ws");

// Pool requires a WebSocket constructor in plain Node.js
neonConfig.webSocketConstructor = ws;

async function init() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    console.log("⏳ Running schema migrations...");

    const schemaRaw = fs.readFileSync(
      path.join(__dirname, "schema.sql"),
      "utf8",
    );

    // Strip single-line SQL comments before splitting so that comment lines
    // preceding a statement don't get bundled into the same chunk and cause
    // the whole chunk to be skipped.
    const statements = schemaRaw
      .split("\n")
      .map((line) => {
        const idx = line.indexOf("--");
        return idx === -1 ? line : line.slice(0, idx);
      })
      .join("\n")
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const stmt of statements) {
      await client.query(stmt);
    }

    console.log("✅ Schema created / updated.");

    // Seed default admin user
    const username = process.env.ADMIN_USERNAME || "admin";
    const password = process.env.ADMIN_PASSWORD || "Admin123!";

    const existing = await client.query(
      "SELECT id FROM admin_users WHERE username = $1",
      [username],
    );
    if (existing.rows.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        "INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)",
        [username, hash],
      );
      console.log(`✅ Default admin created: ${username} / ${password}`);
      console.log(
        "⚠️  Change the admin password immediately after first login!",
      );
    } else {
      console.log(`ℹ️  Admin user "${username}" already exists — skipped.`);
    }

    console.log("✅ Database initialization complete.");
  } finally {
    client.release();
    await pool.end();
  }
  process.exit(0);
}

init().catch((err) => {
  console.error("❌ Init failed:", err.message);
  process.exit(1);
});
