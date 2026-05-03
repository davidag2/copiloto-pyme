import pg from "pg";
import { getDatabaseUrl, getSslConfig } from "./env.mjs";

const { Client } = pg;

async function main() {
  const client = new Client({
    connectionString: getDatabaseUrl(),
    ssl: getSslConfig()
  });

  await client.connect();
  await client.query("BEGIN");

  try {
    const company = await client.query(
      `INSERT INTO companies (name, country, business_type, currency, plan, monthly_goal, minimum_stock, data_source)
       VALUES ('Distribuidora Andina', 'Colombia', 'Distribuidora', 'COP', 'Crecimiento', 100000000, 10, 'Excel/CSV')
       RETURNING id`
    );
    const companyId = company.rows[0].id;

    await client.query(
      `INSERT INTO users (company_id, name, email, role)
       VALUES ($1, 'Diana Gomez', 'diana.demo@copilotopyme.local', 'owner')
       ON CONFLICT (email) DO NOTHING`,
      [companyId]
    );

    await client.query(
      `INSERT INTO decisions (company_id, text, owner, impact, status)
       VALUES ($1, 'Reponer inventario critico antes del viernes', 'Operaciones', 'Inventario', 'Pendiente')`,
      [companyId]
    );

    await client.query(
      `INSERT INTO alerts (company_id, level, title, text, status)
       VALUES ($1, 'warning', 'Caja por debajo del minimo', 'Cobertura estimada menor al umbral configurado.', 'open')`,
      [companyId]
    );

    await client.query(
      `INSERT INTO reports (company_id, frequency, channel, recipient, content, status)
       VALUES ($1, 'Semanal', 'Email', 'gerencia@empresa.com', 'Reporte demo inicial de Copiloto Pyme.', 'draft')`,
      [companyId]
    );

    await client.query("COMMIT");
    console.log(`Datos demo creados. companyId=${companyId}`);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`Error cargando datos demo: ${error.message}`);
  process.exit(1);
});
