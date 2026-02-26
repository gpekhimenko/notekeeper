import { Pool } from "pg";

declare global {
  // Prevent multiple pools during dev hot-reload
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

function getPool(): Pool {
  if (!globalThis._pgPool) {
    globalThis._pgPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  }
  return globalThis._pgPool;
}

export const pool = getPool();
