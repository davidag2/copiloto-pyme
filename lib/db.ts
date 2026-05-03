import { Pool, PoolClient, QueryResultRow } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var copilotoPymePool: Pool | undefined;
}

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL no esta configurada. Copia .env.example a .env y apunta a PostgreSQL.");
  }

  return new Pool({
    connectionString,
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined
  });
}

export function getPool() {
  if (!globalThis.copilotoPymePool) {
    globalThis.copilotoPymePool = createPool();
  }
  return globalThis.copilotoPymePool;
}

export async function query<T extends QueryResultRow>(text: string, params: unknown[] = []) {
  return getPool().query<T>(text, params);
}

export async function transaction<T>(callback: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
