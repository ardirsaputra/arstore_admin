// db/init.js — Create tables and seed default admin user.
// Usage: node db/init.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { sql } = require("./client");

async function init() {
  console.log("⏳ Running schema migrations...");

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  // Split on statement boundaries and run each non-empty statement
  const statements = schema
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (const stmt of statements) {
    try {
      await sql.call(null, [stmt + ";"]);
    } catch (err) {
      // neon tagged template requires template literals; fallback via raw query
      // Use a workaround: wrap in an IIFE executed via neon
      await sql`${sql.unsafe(stmt)}`;
    }
  }

  console.log("✅ Schema created / updated.");

  // Seed default admin user
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "Admin123!";

  const existing =
    await sql`SELECT id FROM admin_users WHERE username = ${username}`;
  if (existing.length === 0) {
    const hash = await bcrypt.hash(password, 12);
    await sql`INSERT INTO admin_users (username, password_hash) VALUES (${username}, ${hash})`;
    console.log(`✅ Default admin created: ${username} / ${password}`);
    console.log("⚠️  Change the admin password immediately after first login!");
  } else {
    console.log(`ℹ️  Admin user "${username}" already exists — skipped.`);
  }

  console.log("✅ Database initialization complete.");
  process.exit(0);
}

init().catch((err) => {
  console.error("❌ Init failed:", err.message);
  process.exit(1);
});
