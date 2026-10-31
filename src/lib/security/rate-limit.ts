import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Fixed-window rate limiter stored in PostgreSQL so it works across serverless
 * instances. Returns whether the call is allowed and how many remain.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  const res = await db.execute<{ count: number; window_start: Date }>(sql`
    INSERT INTO rate_limits (key, window_start, count) VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN 1 ELSE rate_limits.count + 1 END,
      window_start = CASE WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds}) THEN now() ELSE rate_limits.window_start END
    RETURNING count, window_start`);
  const count = Number(res.rows[0]?.count ?? 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count), count };
}

export class RateLimitError extends Error {
  constructor(message = "Terlalu banyak permintaan. Sila cuba sebentar lagi.") {
    super(message);
  }
}
