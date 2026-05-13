import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { evaluateBasicRules } from "@/lib/rule-engine";
import { requireCompanySession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
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
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    if (body.engine === "basic") {
      const generatedAlerts = evaluateBasicRules({
        salesProgressPercent: Number(body.metrics?.salesProgressPercent || 0),
        cashDays: Number(body.metrics?.cashDays || 0),
        marginPercent: Number(body.metrics?.marginPercent || 0),
        criticalStockCount: Number(body.metrics?.criticalStockCount || 0)
      }, {
        sales: Number(body.rules?.sales || 70),
        cash: Number(body.rules?.cash || 14),
        margin: Number(body.rules?.margin || 30),
        stock: Number(body.rules?.stock || 3)
      });

      const alerts = await Promise.all(generatedAlerts.map((alert) => query(
        `INSERT INTO alerts (company_id, rule_id, level, title, text, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [companyId, null, alert.level, alert.title, alert.text, alert.status]
      )));

      return ok({ alerts: alerts.map((alert) => alert.rows[0]) }, 201);
    }

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
