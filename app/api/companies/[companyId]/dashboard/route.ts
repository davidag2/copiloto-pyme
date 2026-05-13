import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { requireCompanySession } from "@/lib/session";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMillions(value: unknown) {
  return Number((toNumber(value) / 1_000_000).toFixed(1));
}

function dayLabel(date: Date) {
  return ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"][date.getDay()];
}

function dayDiff(startDate: Date, endDate: Date) {
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000));
}

function chartLabel(date: Date, totalDays: number) {
  if (totalDays > 10) return date.toLocaleDateString("es-CO", { day: "numeric", month: "short" });
  return dayLabel(date);
}

function stockLabel(stock: number, minimumStock: number) {
  if (stock <= minimumStock) return "Critico";
  if (stock <= minimumStock * 2) return "Bajo";
  return "Normal";
}

function parseDateParam(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toSqlDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function resolveRange(request: Request) {
  const { searchParams } = new URL(request.url);
  const today = new Date();
  const fallbackStart = new Date();
  fallbackStart.setDate(today.getDate() - 6);

  const parsedEnd = parseDateParam(searchParams.get("endDate"));
  const parsedStart = parseDateParam(searchParams.get("startDate"));
  const end = parsedEnd || today;
  const start = parsedStart || fallbackStart;

  if (start > end) {
    return {
      startDate: toSqlDate(fallbackStart),
      endDate: toSqlDate(today)
    };
  }

  const maxStart = new Date(end);
  maxStart.setDate(end.getDate() - 365);
  return {
    startDate: toSqlDate(start < maxStart ? maxStart : start),
    endDate: toSqlDate(end)
  };
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { companyId } = await context.params;
    const { startDate, endDate } = resolveRange(request);
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const [company, users, latestImports, alertRules, alerts, integrations, decisions, aiSuggestions, reports, kpiSummary, salesByDay, topProducts] = await Promise.all([
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
      query(`SELECT * FROM ai_suggestions WHERE company_id = $1 AND status <> 'descartada' ORDER BY generated_at DESC LIMIT 20`, [companyId]),
      query(`SELECT * FROM reports WHERE company_id = $1 ORDER BY created_at DESC LIMIT 20`, [companyId]),
      query(
        `WITH valid_rows AS (
           SELECT *,
                  COALESCE(sale_date, created_at::date) AS metric_date
           FROM imported_data_rows
           WHERE company_id = $1
             AND validation_errors = '[]'::jsonb
             AND COALESCE(sale_date, created_at::date) BETWEEN $2::date AND $3::date
         ),
         latest_cash AS (
           SELECT cash
           FROM valid_rows
           WHERE cash IS NOT NULL
           ORDER BY metric_date DESC, created_at DESC
           LIMIT 1
         ),
         latest_products AS (
           SELECT product_name,
                  stock,
                  ROW_NUMBER() OVER (PARTITION BY product_name ORDER BY metric_date DESC, created_at DESC) AS rn
           FROM valid_rows
         ),
         summary AS (
           SELECT COUNT(*)::int AS row_count,
                  COALESCE(SUM(sales), 0) AS sales_30d,
                  COALESCE(AVG(margin) FILTER (WHERE margin IS NOT NULL), 0) AS avg_margin
           FROM valid_rows
         )
         SELECT summary.row_count AS "rowCount",
                summary.sales_30d::text AS "sales30d",
                COALESCE((SELECT cash FROM latest_cash), 0)::text AS "latestCash",
                summary.avg_margin::text AS "avgMargin",
                COALESCE(COUNT(*) FILTER (WHERE latest_products.rn = 1 AND latest_products.stock <= companies.minimum_stock), 0)::int AS "criticalStock"
         FROM companies
         CROSS JOIN summary
         LEFT JOIN latest_products ON TRUE
         WHERE companies.id = $1
         GROUP BY companies.id, summary.row_count, summary.sales_30d, summary.avg_margin`,
        [companyId, startDate, endDate]
      ),
      query(
        `SELECT COALESCE(sale_date, created_at::date) AS "saleDate",
                COALESCE(SUM(sales), 0)::text AS sales
         FROM imported_data_rows
         WHERE company_id = $1
           AND validation_errors = '[]'::jsonb
           AND COALESCE(sale_date, created_at::date) BETWEEN $2::date AND $3::date
         GROUP BY "saleDate"
         ORDER BY "saleDate" ASC`,
        [companyId, startDate, endDate]
      ),
      query(
        `WITH valid_rows AS (
           SELECT *,
                  COALESCE(sale_date, created_at::date) AS metric_date
           FROM imported_data_rows
           WHERE company_id = $1
             AND validation_errors = '[]'::jsonb
             AND COALESCE(sale_date, created_at::date) BETWEEN $2::date AND $3::date
         ),
         sales_totals AS (
           SELECT product_name,
                  SUM(sales) AS total_sales
           FROM valid_rows
           GROUP BY product_name
         ),
         latest_stock AS (
           SELECT product_name,
                  stock,
                  ROW_NUMBER() OVER (PARTITION BY product_name ORDER BY metric_date DESC, created_at DESC) AS rn
           FROM valid_rows
         )
         SELECT sales_totals.product_name AS name,
                sales_totals.total_sales::text AS sales,
                COALESCE(latest_stock.stock, 0)::int AS stock
         FROM sales_totals
         LEFT JOIN latest_stock ON latest_stock.product_name = sales_totals.product_name AND latest_stock.rn = 1
         ORDER BY sales_totals.total_sales DESC
         LIMIT 4`,
        [companyId, startDate, endDate]
      )
    ]);

    if (!company.rows[0]) {
      return fail(new Error("Empresa no encontrada"), 404);
    }

    const companyRow = company.rows[0] as { minimum_stock?: number };
    const minimumStock = Number(companyRow.minimum_stock || 0);
    const summary = kpiSummary.rows[0] || {};
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T00:00:00`);
    const totalDays = dayDiff(start, end) + 1;
    const salesByDate = new Map(salesByDay.rows.map((row) => [new Date(row.saleDate as string).toISOString().slice(0, 10), toMillions(row.sales)]));
    const weeklySales = Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { day: chartLabel(date, totalDays), value: salesByDate.get(key) || 0 };
    });
    const products = topProducts.rows.map((product) => {
      const stock = toNumber(product.stock);
      return {
        name: String(product.name || "Producto sin nombre"),
        sales: `$${toMillions(product.sales).toFixed(1)}M`,
        stock: stockLabel(stock, minimumStock)
      };
    });

    return ok({
      company: company.rows[0],
      users: users.rows,
      imports: latestImports.rows,
      kpis: {
        metrics: {
          sales: toMillions(summary.sales30d),
          cash: toMillions(summary.latestCash),
          margin: Number(toNumber(summary.avgMargin).toFixed(1)),
          criticalStock: Number(summary.criticalStock || 0)
        },
        weeklySales,
        products,
        rowCount: Number(summary.rowCount || 0),
        range: { startDate, endDate }
      },
      alertRules: alertRules.rows,
      alerts: alerts.rows,
      integrations: integrations.rows,
      decisions: decisions.rows,
      aiSuggestions: aiSuggestions.rows,
      reports: reports.rows
    });
  } catch (error) {
    return fail(error);
  }
}
