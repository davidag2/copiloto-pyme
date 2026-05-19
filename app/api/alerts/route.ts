import { fail, ok, requiredString } from "@/lib/api";
import { query, transaction } from "@/lib/db";
import { CompanyAlertRule, evaluateCompanyRules } from "@/lib/rule-engine";
import { clearCompanyServerCache, withServerCache } from "@/lib/server-cache";
import { requireCompanySession } from "@/lib/session";

const defaultRules = {
  sales: { threshold: 70, comparator: "below" },
  cash: { threshold: 14, comparator: "below" },
  margin: { threshold: 30, comparator: "below" },
  stock: { threshold: 3, comparator: "above" }
} as const;

async function upsertCompanyRules(companyId: string, rules?: Record<string, number>) {
  if (!rules) return;
  await Promise.all((Object.keys(defaultRules) as Array<keyof typeof defaultRules>).map((metric) => query(
    `INSERT INTO alert_rules (company_id, metric, threshold, comparator, enabled, updated_at)
     VALUES ($1, $2, $3, $4, TRUE, NOW())
     ON CONFLICT (company_id, metric)
     DO UPDATE SET threshold = EXCLUDED.threshold,
                   comparator = EXCLUDED.comparator,
                   enabled = TRUE,
                   updated_at = NOW()`,
    [companyId, metric, Number(rules[metric] ?? defaultRules[metric].threshold), defaultRules[metric].comparator]
  )));
}

async function getCompanyRules(companyId: string) {
  const rules = await query<CompanyAlertRule>(
    `SELECT id,
            metric,
            threshold,
            comparator,
            enabled
     FROM alert_rules
     WHERE company_id = $1
       AND metric IN ('sales', 'cash', 'margin', 'stock')
     ORDER BY metric ASC`,
    [companyId]
  );
  return rules.rows;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const data = await withServerCache(`company:${companyId}:alerts:${session.session.userId}`, 20_000, async () => {
      const alerts = await query(
        `SELECT alerts.*,
              alert_rules.metric AS "ruleMetric",
              alert_rules.threshold AS "ruleThreshold",
              alert_rules.comparator AS "ruleComparator"
       FROM alerts
       LEFT JOIN alert_rules ON alert_rules.id = alerts.rule_id
       WHERE alerts.company_id = $1
       ORDER BY alerts.created_at DESC
       LIMIT 50`,
        [companyId]
      );
      return { alerts: alerts.rows };
    });
    return ok(data);
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
      await upsertCompanyRules(companyId, body.rules);
      const companyRules = await getCompanyRules(companyId);
      const generatedAlerts = evaluateCompanyRules({
        salesProgressPercent: Number(body.metrics?.salesProgressPercent || 0),
        cashDays: Number(body.metrics?.cashDays || 0),
        marginPercent: Number(body.metrics?.marginPercent || 0),
        criticalStockCount: Number(body.metrics?.criticalStockCount || 0)
      }, companyRules);

      const alerts = await transaction(async (client) => {
        const ruleIds = companyRules.map((rule) => rule.id).filter(Boolean);
        if (ruleIds.length) {
          await client.query(
            `UPDATE alerts
             SET status = 'resolved',
                 resolved_at = COALESCE(resolved_at, NOW())
             WHERE company_id = $1
               AND status = 'open'
               AND rule_id = ANY($2::uuid[])`,
            [companyId, ruleIds]
          );
        }

        const inserted = [];
        for (const alert of generatedAlerts) {
          const result = await client.query(
            `INSERT INTO alerts (company_id, rule_id, level, title, text, status, resolved_at)
             VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'resolved' THEN NOW() ELSE NULL END)
             RETURNING *`,
            [companyId, alert.ruleId || null, alert.level, alert.title, alert.text, alert.status]
          );
          inserted.push(result.rows[0]);
        }
        return inserted;
      });

      clearCompanyServerCache(companyId);
      return ok({ alerts, rules: companyRules }, 201);
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
    clearCompanyServerCache(companyId);
    return ok({ alert: alert.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
