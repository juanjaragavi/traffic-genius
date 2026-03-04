/**
 * TrafficGenius — Run database migrations and seed sites.
 *
 * Usage: node scripts/run-migrations.cjs
 */

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Read DATABASE_URL from .env.local
const envPath = path.join(__dirname, "..", ".env.local");
const envContent = fs.readFileSync(envPath, "utf8");
const match = envContent.match(/^DATABASE_URL=(.+)$/m);
if (!match) {
  console.error("No DATABASE_URL found in .env.local");
  process.exit(1);
}

const pool = new Pool({
  connectionString: match[1],
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    // Run migration 003
    const migrationSql = fs.readFileSync(
      path.join(__dirname, "003-create-sites-table.sql"),
      "utf8",
    );
    await client.query(migrationSql);
    console.log("Migration 003 (sites table) applied successfully");

    // Run seed 004
    const seedSql = fs.readFileSync(
      path.join(__dirname, "004-seed-sites.sql"),
      "utf8",
    );
    await client.query(seedSql);
    console.log("Seed 004 (TopNetworks sites) applied successfully");

    // Verify
    const result = await client.query(
      "SELECT id, domain, label, cloud_armor_policy, backend_service, status FROM sites ORDER BY id",
    );
    console.log("\nSites in database:", result.rows.length);
    result.rows.forEach((r) => {
      console.log(
        " ",
        r.id,
        r.label,
        "(" + r.domain + ")",
        "| policy:",
        r.cloud_armor_policy || "(none)",
        "| backend:",
        r.backend_service || "(none)",
        "| status:",
        r.status,
      );
    });
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
