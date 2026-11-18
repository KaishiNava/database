import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL belum diatur.");
}

declare global {
  // eslint-disable-next-line no-var
  var nexadbPool: Pool | undefined;
}

export const pool =
  global.nexadbPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
  });

if (process.env.NODE_ENV !== "production") global.nexadbPool = pool;
