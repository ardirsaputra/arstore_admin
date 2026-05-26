const { neon } = require("@neondatabase/serverless");
require("dotenv").config({ path: "../.env.local" });

async function run() {
  if (!process.env.DATABASE_URL) return console.log("NO DB URL");
  const sql = neon(process.env.DATABASE_URL);
  const rows = await sql`SELECT id, features FROM app_releases ORDER BY id DESC LIMIT 1`;
  console.log("Features type:", typeof rows[0]?.features);
  console.log("Features value:", rows[0]?.features);
  console.log("IsArray:", Array.isArray(rows[0]?.features));
}
run();
