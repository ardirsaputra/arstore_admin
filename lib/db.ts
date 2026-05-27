// lib/db.ts — NeonDB serverless client for Next.js App Router
// Lazy initialization so DATABASE_URL is only required at request time, not build time.

import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let _sql: NeonQueryFunction<false, false> | null = null;

function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    _sql = neon(process.env.DATABASE_URL);
  }
  return _sql;
}

// Export as a template-literal callable that delegates to the lazy instance
export const sql: NeonQueryFunction<false, false> = new Proxy(
  ((...args: Parameters<NeonQueryFunction<false, false>>) =>
    getSql()(...args)) as NeonQueryFunction<false, false>,
  {
    get(_target, prop) {
      return (getSql() as any)[prop];
    },
  }
);
