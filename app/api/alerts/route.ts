import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const alerts = await query(
      `SELECT * FROM alerts
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
      [companyId]
    );
    return ok({ alerts: alerts.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const level = requiredString(body.level, "level");
    const title = requiredString(body.title, "title");
    const text = requiredString(body.text, "text");

    const alert = await query(
      `INSERT INTO alerts (company_id, rule_id, level, title, text, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [companyId, body.ruleId || null, level, title, text, body.status || "open"]
    );
    return ok({ alert: alert.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
