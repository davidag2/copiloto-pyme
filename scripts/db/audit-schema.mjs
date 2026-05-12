import pg from "pg";
import { getDatabaseUrl, getSslConfig } from "./env.mjs";

const { Client } = pg;

const expectedTables = [
  "companies",
  "users",
  "password_reset_tokens",
  "team_invitations",
  "imported_data_batches",
  "imported_data_rows",
  "alert_rules",
  "alerts",
  "integrations",
  "decisions",
  "ai_suggestions",
  "reports",
  "activity_events",
  "plans",
  "subscriptions",
  "payment_providers",
  "payment_transactions",
  "billing_profiles",
  "siigo_invoices",
  "sessions",
  "onboarding_progress"
];

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: getSslConfig()
  });

  await client.connect();

  const tables = await client.query(
    `SELECT table_name AS "tableName", COUNT(*)::int AS columns
     FROM information_schema.columns
     WHERE table_schema = 'public'
     GROUP BY table_name
     ORDER BY table_name`
  );

  const existing = new Set(tables.rows.map((table) => table.tableName));
  const coverage = expectedTables.map((table) => ({
    table,
    status: existing.has(table) ? "OK" : "FALTA"
  }));

  console.log("Tablas actuales:");
  console.table(tables.rows);
  console.log("Cobertura esperada para registro, login y suscripciones:");
  console.table(coverage);

  await client.end();
}

main().catch((error) => {
  console.error(`Error auditando schema PostgreSQL: ${error.message}`);
  process.exit(1);
});
