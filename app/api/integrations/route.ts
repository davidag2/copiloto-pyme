import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const integrations = await query(`SELECT * FROM integrations WHERE company_id = $1 ORDER BY provider ASC`, [companyId]);
    return ok({ integrations: integrations.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const provider = requiredString(body.provider, "provider");
    const category = requiredString(body.category, "category");

    const integration = await query(
      `INSERT INTO integrations (company_id, provider, category, status, sync_label, last_sync_at, credentials_ref)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6)
       ON CONFLICT (company_id, provider)
       DO UPDATE SET category = EXCLUDED.category,
                     status = EXCLUDED.status,
                     sync_label = EXCLUDED.sync_label,
                     last_sync_at = NOW(),
                     credentials_ref = EXCLUDED.credentials_ref,
                     updated_at = NOW()
       RETURNING *`,
      [companyId, provider, category, body.status || "Conectado", body.syncLabel || "Sincronizado ahora", body.credentialsRef || null]
    );
    return ok({ integration: integration.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
