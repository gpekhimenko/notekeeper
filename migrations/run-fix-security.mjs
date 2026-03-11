import { readFileSync } from "fs";
import pg from "pg";

// Read DATABASE_URL from .env.local
const envFile = readFileSync(".env.local", "utf8");
const match = envFile.match(/DATABASE_URL="([^"]+)"/);
if (!match) {
  console.error("DATABASE_URL not found in .env.local");
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

const sql = readFileSync("migrations/fix-security.sql", "utf8");
const statements = sql
  .split(";")
  .map((s) => s.trim())
  .filter((s) => s && !s.startsWith("--"));

for (const stmt of statements) {
  try {
    await pool.query(stmt);
    console.log("OK:", stmt.slice(0, 60));
  } catch (err) {
    console.error("FAIL:", stmt.slice(0, 60));
    console.error("  ", err.message);
  }
}

await pool.end();
console.log("\nDone. Re-check Supabase Security Advisor.");
