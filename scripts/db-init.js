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

  // Create admin_users table if it doesn't exist
  console.log("⏳ Checking/creating admin_users table...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("✅ admin_users table ready");
  } catch (e) {
    console.warn("Warning creating admin_users table:", e.message);
  }

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
