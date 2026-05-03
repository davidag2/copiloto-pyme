import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { companyId } = await context.params;
    const [company, users, latestImports, alertRules, alerts, integrations, decisions, reports] = await Promise.all([
      query(`SELECT * FROM companies WHERE id = $1`, [companyId]),
      query(`SELECT id, name, email, role, created_at AS "createdAt" FROM users WHERE company_id = $1 ORDER BY created_at DESC`, [companyId]),
      query(
        `SELECT id, source, file_name AS "fileName", row_count AS "rowCount", status, created_at AS "createdAt"
         FROM imported_data_batches
         WHERE company_id = $1
         ORDER BY created_at DESC
         LIMIT 10`,
        [companyId]
      ),
      query(`SELECT * FROM alert_rules WHERE company_id = $1 ORDER BY metric ASC`, [companyId]),
      query(`SELECT * FROM alerts WHERE company_id = $1 ORDER BY created_at DESC LIMIT 20`, [companyId]),
      query(`SELECT * FROM integrations WHERE company_id = $1 ORDER BY provider ASC`, [companyId]),
      query(`SELECT * FROM decisions WHERE company_id = $1 ORDER BY decision_date DESC, created_at DESC LIMIT 50`, [companyId]),
      query(`SELECT * FROM reports WHERE company_id = $1 ORDER BY created_at DESC LIMIT 20`, [companyId])
    ]);

    if (!company.rows[0]) {
      return fail(new Error("Empresa no encontrada"), 404);
    }

    return ok({
      company: company.rows[0],
      users: users.rows,
      imports: latestImports.rows,
      alertRules: alertRules.rows,
      alerts: alerts.rows,
      integrations: integrations.rows,
      decisions: decisions.rows,
      reports: reports.rows
    });
  } catch (error) {
    return fail(error);
  }
}
