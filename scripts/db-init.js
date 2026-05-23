#!/usr/bin/env node
// scripts/db-init.js — Initialize NeonDB schema and default admin user
// Usage: node scripts/db-init.js
// Requires DATABASE_URL, ADMIN_USERNAME, ADMIN_PASSWORD env vars (set in .env.local)

require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "ERROR: DATABASE_URL tidak di-set. Buat file .env.local terlebih dahulu.",
    );
    process.exit(1);
  }

  const sql = neon(process.env.DATABASE_URL);

  // Run schema
  const schema = fs.readFileSync(
    path.join(__dirname, "../backend/db/schema.sql"),
    "utf-8",
  );
  // Split by semicolons and run each statement
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    try {
      await sql.query(stmt);
    } catch (e) {
      console.warn("Warning:", e.message);
    }
  }
  console.log("✅ Schema berhasil dijalankan");

  // Create default admin user
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.error("ERROR: ADMIN_PASSWORD tidak di-set");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${hash})
    ON CONFLICT (username) DO UPDATE SET password_hash = ${hash}
  `;
  console.log(`✅ Admin user '${username}' berhasil dibuat/diperbarui`);
  console.log("🎉 Database siap digunakan!");
}

main().catch((err) => {
  console.error("Init error:", err);
  process.exit(1);
});
