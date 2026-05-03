import pg from "pg";
import { getDatabaseUrl, getSslConfig } from "./env.mjs";

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: getSslConfig()
  });

  await client.connect();
  const result = await client.query("SELECT current_database() AS database, current_user AS user, NOW() AS checked_at");
  console.log("Conexion PostgreSQL OK:");
  console.table(result.rows);
  await client.end();
}

main().catch((error) => {
  console.error(`Error verificando PostgreSQL: ${error.message}`);
  process.exit(1);
});
