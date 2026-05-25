// lib/db.ts — NeonDB serverless client for Next.js App Router
// Uses @neondatabase/serverless (HTTP mode, no WebSocket needed for Edge/Lambda)

import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

export const sql = neon(process.env.DATABASE_URL);
