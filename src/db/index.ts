import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

declare global {
  var __hmPool: Pool | undefined;
}

function makePool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return new Pool({
    connectionString: url,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  });
}

const pool = globalThis.__hmPool ?? makePool();
if (process.env.NODE_ENV !== "production") globalThis.__hmPool = pool;

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export type DB = typeof db;
export { schema };
