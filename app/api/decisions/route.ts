import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const decisions = await query(
      `SELECT id,
              company_id AS "companyId",
              text,
              owner,
              impact,
              status,
              decision_date AS "date",
              created_at AS "createdAt",
              updated_at AS "updatedAt"
       FROM decisions
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
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const text = requiredString(body.text, "text");
    const owner = requiredString(body.owner, "owner");
    const impact = requiredString(body.impact, "impact");

    const decision = await query(
      `INSERT INTO decisions (company_id, text, owner, impact, status, decision_date)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6::date, CURRENT_DATE))
       RETURNING id,
                 company_id AS "companyId",
                 text,
                 owner,
                 impact,
                 status,
                 decision_date AS "date",
                 created_at AS "createdAt",
                 updated_at AS "updatedAt"`,
      [companyId, text, owner, impact, body.status || "Pendiente", body.date || null]
    );
    return ok({ decision: decision.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const decisionId = requiredString(body.decisionId, "decisionId");
    const status = requiredString(body.status, "status");
    if (!["Pendiente", "En curso", "Completada"].includes(status)) {
      throw new Error(`Estado no permitido: ${status}`);
    }

    const decision = await query(
      `UPDATE decisions
       SET status = $3,
           owner = COALESCE($4, owner),
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
       RETURNING id,
                 company_id AS "companyId",
                 text,
                 owner,
                 impact,
                 status,
                 decision_date AS "date",
                 created_at AS "createdAt",
                 updated_at AS "updatedAt"`,
      [decisionId, companyId, status, body.owner || null]
    );

    if (!decision.rows[0]) {
      return fail(new Error("Decisión no encontrada"), 404);
    }

    return ok({ decision: decision.rows[0] });
  } catch (error) {
    return fail(error, 400);
  }
}
