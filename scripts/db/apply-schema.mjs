import fs from "node:fs";
import path from "node:path";
import pg from "pg";
import { getDatabaseUrl, getSslConfig } from "./env.mjs";

const { Client } = pg;

async function main() {
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: getSslConfig()
  });

  await client.connect();
  await client.query(schemaSql);
  await client.end();
  console.log("Schema PostgreSQL aplicado correctamente desde database/schema.sql");
}

main().catch((error) => {
  console.error(`Error aplicando schema PostgreSQL: ${error.message}`);
  process.exit(1);
});
