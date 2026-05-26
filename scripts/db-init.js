#!/usr/bin/env node
// scripts/db-init.js — Initialize NeonDB schema and default admin user
// Usage: npm run db:init (Will be run automatically on Vercel build)

require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.warn("WARNING: DATABASE_URL not set. Skipping DB migration.");
    return;
  }

  const sql = neon(process.env.DATABASE_URL);

  // Run schema
  const schemaPath = path.join(__dirname, "../backend/db/schema.sql");
  if (!fs.existsSync(schemaPath)) {
    console.error(`ERROR: Schema file not found at ${schemaPath}`);
    return;
  }

  const schemaRaw = fs.readFileSync(schemaPath, "utf-8");
  
  // Strip single-line SQL comments before splitting
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

  console.log("⏳ Running schema migrations...");
  for (const stmt of statements) {
    try {
      await sql(stmt);
    } catch (e) {
      console.warn("Warning:", e.message);
    }
  }
  console.log("✅ Schema berhasil dijalankan");

  // Create default admin user if provided
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.log("ℹ️ No ADMIN_PASSWORD provided in ENV. Skipping default admin creation.");
    console.log("🎉 Database ready!");
    return;
  }

  try {
    const hash = await bcrypt.hash(password, 12);
    // Neon HTTP requires using the tagged template for parameterized queries
    await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES (${username}, ${hash})
      ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
    `;
    console.log(`✅ Admin user '${username}' berhasil dibuat/diperbarui`);
  } catch (e) {
    console.error("Error creating admin user:", e.message);
  }
  
  console.log("🎉 Database siap digunakan!");
}

main().catch((err) => {
  console.error("Init error:", err);
  process.exit(1);
});
