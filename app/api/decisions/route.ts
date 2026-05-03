import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const decisions = await query(
      `SELECT * FROM decisions
       WHERE company_id = $1
       ORDER BY decision_date DESC, created_at DESC
       LIMIT 100`,
      [companyId]
    );
    return ok({ decisions: decisions.rows });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const text = requiredString(body.text, "text");
    const owner = requiredString(body.owner, "owner");
    const impact = requiredString(body.impact, "impact");

    const decision = await query(
      `INSERT INTO decisions (company_id, text, owner, impact, status, decision_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
       RETURNING *`,
      [companyId, text, owner, impact, body.status || "Pendiente", body.date || null]
    );
    return ok({ decision: decision.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
