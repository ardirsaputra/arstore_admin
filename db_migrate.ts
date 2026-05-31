import { sql } from "./lib/db";

async function main() {
  try {
    await sql`ALTER TABLE devices ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE, ADD COLUMN IF NOT EXISTS referral_uses INTEGER DEFAULT 0, ADD COLUMN IF NOT EXISTS has_claimed_referral BOOLEAN DEFAULT FALSE;`;
    await sql`ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN DEFAULT FALSE;`;
    console.log("Migration complete!");
  } catch (err) {
    console.error(err);
  }
}

main();
