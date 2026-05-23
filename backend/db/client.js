// db/client.js — NeonDB connection using @neondatabase/serverless
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL environment variable is not set.\nCopy .env.example to .env and fill in your NeonDB connection string.",
  );
}

// Create a SQL query function — works in both serverless & long-running Node
const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
