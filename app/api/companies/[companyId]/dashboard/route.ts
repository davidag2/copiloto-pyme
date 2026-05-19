import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { withServerCache } from "@/lib/server-cache";
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
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
    const currentStart = new Date(`${startDate}T00:00:00`);
    const currentEnd = new Date(`${endDate}T00:00:00`);
    const rangeDays = dayDiff(currentStart, currentEnd) + 1;
    const previousEnd = addDays(currentStart, -1);
    const previousStart = addDays(previousEnd, -(rangeDays - 1));
    const previousStartDate = toSqlDate(previousStart);
    const previousEndDate = toSqlDate(previousEnd);
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const data = await withServerCache(
      `company:${companyId}:dashboard:${session.session.userId}:${startDate}:${endDate}`,
      30_000,
      async () => {
        const [company, users, latestImports, alertRules, alerts, integrations, decisions, aiSuggestions, reports, kpiSummary, previousSummary, metricsByDay, previousSalesByDay, topProducts, salesReports] = await Promise.all([
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
      query(
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
         LIMIT 50`,
        [companyId]
      ),
      query(`SELECT * FROM ai_suggestions WHERE company_id = $1 AND status <> 'descartada' ORDER BY generated_at DESC LIMIT 20`, [companyId]),
      query(`SELECT * FROM reports WHERE company_id = $1 ORDER BY created_at DESC LIMIT 20`, [companyId]),
      query(
        `WITH valid_sales AS (
           SELECT sale_date AS metric_date,
                  total
           FROM sales_orders
           WHERE company_id = $1
             AND status <> 'anulada'
             AND sale_date BETWEEN $2::date AND $3::date
         ),
         valid_rows AS (
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
                  COALESCE(SUM(total), 0) AS sales_30d
           FROM valid_sales
         ),
         margin_summary AS (
           SELECT COALESCE(AVG(margin) FILTER (WHERE margin IS NOT NULL), 0) AS avg_margin
           FROM valid_rows
         )
         SELECT summary.row_count AS "rowCount",
                summary.sales_30d::text AS "sales30d",
                COALESCE((SELECT cash FROM latest_cash), 0)::text AS "latestCash",
                margin_summary.avg_margin::text AS "avgMargin",
                COALESCE(COUNT(*) FILTER (WHERE sales_products.stock <= companies.minimum_stock AND sales_products.status = 'active'), 0)::int AS "criticalStock"
         FROM companies
         CROSS JOIN summary
         CROSS JOIN margin_summary
         LEFT JOIN sales_products ON sales_products.company_id = companies.id
         WHERE companies.id = $1
         GROUP BY companies.id, summary.row_count, summary.sales_30d, margin_summary.avg_margin`,
        [companyId, startDate, endDate]
      ),
      query(
        `WITH valid_sales AS (
           SELECT sale_date AS metric_date,
                  total
           FROM sales_orders
           WHERE company_id = $1
             AND status <> 'anulada'
             AND sale_date BETWEEN $2::date AND $3::date
         )
         SELECT COUNT(*)::int AS "rowCount",
                COALESCE(SUM(total), 0)::text AS sales,
                0::text AS margin
         FROM valid_sales`,
        [companyId, previousStartDate, previousEndDate]
      ),
      query(
        `WITH sales_by_day AS (
           SELECT sale_date AS metric_date,
                  COALESCE(SUM(total), 0) AS sales
           FROM sales_orders
           WHERE company_id = $1
             AND status <> 'anulada'
             AND sale_date BETWEEN $2::date AND $3::date
           GROUP BY sale_date
         ),
         valid_rows AS (
           SELECT imported_data_rows.*,
                  COALESCE(sale_date, imported_data_rows.created_at::date) AS metric_date,
                  companies.minimum_stock
           FROM imported_data_rows
           JOIN companies ON companies.id = imported_data_rows.company_id
           WHERE imported_data_rows.company_id = $1
             AND validation_errors = '[]'::jsonb
             AND COALESCE(sale_date, imported_data_rows.created_at::date) BETWEEN $2::date AND $3::date
         ),
         latest_cash AS (
           SELECT DISTINCT ON (metric_date)
                  metric_date,
                  cash
           FROM valid_rows
           WHERE cash IS NOT NULL
           ORDER BY metric_date, created_at DESC
         ),
         imported_by_day AS (
           SELECT valid_rows.metric_date,
                  COALESCE(MAX(latest_cash.cash), 0) AS cash,
                  COALESCE(AVG(valid_rows.margin) FILTER (WHERE valid_rows.margin IS NOT NULL), 0) AS margin,
                  COUNT(*) FILTER (WHERE valid_rows.stock <= valid_rows.minimum_stock)::int AS "criticalStock"
           FROM valid_rows
           LEFT JOIN latest_cash ON latest_cash.metric_date = valid_rows.metric_date
           GROUP BY valid_rows.metric_date
         )
         SELECT COALESCE(sales_by_day.metric_date, imported_by_day.metric_date) AS "saleDate",
                COALESCE(sales_by_day.sales, 0)::text AS sales,
                COALESCE(imported_by_day.cash, 0)::text AS cash,
                COALESCE(imported_by_day.margin, 0)::text AS margin,
                COALESCE(imported_by_day."criticalStock", 0)::int AS "criticalStock"
         FROM sales_by_day
         FULL OUTER JOIN imported_by_day ON imported_by_day.metric_date = sales_by_day.metric_date
         ORDER BY "saleDate" ASC`,
        [companyId, startDate, endDate]
      ),
      query(
        `SELECT sale_date AS "saleDate",
                COALESCE(SUM(total), 0)::text AS sales
         FROM sales_orders
         WHERE company_id = $1
           AND status <> 'anulada'
           AND sale_date BETWEEN $2::date AND $3::date
         GROUP BY sale_date
         ORDER BY sale_date ASC`,
        [companyId, previousStartDate, previousEndDate]
      ),
      query(
        `SELECT sales_order_items.description AS name,
                COALESCE(SUM(sales_order_items.total), 0)::text AS sales,
                COALESCE(MAX(sales_products.stock), 0)::int AS stock
         FROM sales_order_items
         JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
         LEFT JOIN sales_products ON sales_products.id = sales_order_items.product_id
         WHERE sales_orders.company_id = $1
           AND sales_orders.status <> 'anulada'
           AND sales_orders.sale_date BETWEEN $2::date AND $3::date
         GROUP BY sales_order_items.description
         ORDER BY SUM(sales_order_items.total) DESC
         LIMIT 4`,
        [companyId, startDate, endDate]
      ),
      query(
        `WITH valid_orders AS (
           SELECT *
           FROM sales_orders
           WHERE company_id = $1
             AND status <> 'anulada'
             AND sale_date BETWEEN $2::date AND $3::date
         ),
         report_rows AS (
           SELECT 'vendedor' AS type,
                  COALESCE(sales_reps.name, 'Sin vendedor') AS name,
                  COALESCE(SUM(valid_orders.total), 0) AS total,
                  COUNT(*)::int AS orders,
                  NULL::numeric AS quantity
           FROM valid_orders
           LEFT JOIN sales_reps ON sales_reps.id = valid_orders.sales_rep_id
           GROUP BY sales_reps.name

           UNION ALL

           SELECT 'producto' AS type,
                  COALESCE(sales_order_items.description, 'Producto sin nombre') AS name,
                  COALESCE(SUM(sales_order_items.total), 0) AS total,
                  COUNT(DISTINCT valid_orders.id)::int AS orders,
                  COALESCE(SUM(sales_order_items.quantity), 0) AS quantity
           FROM valid_orders
           JOIN sales_order_items ON sales_order_items.order_id = valid_orders.id
           GROUP BY sales_order_items.description

           UNION ALL

           SELECT 'cliente' AS type,
                  COALESCE(sales_customers.name, 'Cliente sin nombre') AS name,
                  COALESCE(SUM(valid_orders.total), 0) AS total,
                  COUNT(*)::int AS orders,
                  NULL::numeric AS quantity
           FROM valid_orders
           LEFT JOIN sales_customers ON sales_customers.id = valid_orders.customer_id
           GROUP BY sales_customers.name

           UNION ALL

           SELECT 'canal' AS type,
                  COALESCE(sales_channels.name, 'Canal no definido') AS name,
                  COALESCE(SUM(valid_orders.total), 0) AS total,
                  COUNT(*)::int AS orders,
                  NULL::numeric AS quantity
           FROM valid_orders
           LEFT JOIN sales_channels ON sales_channels.id = valid_orders.channel_id
           GROUP BY sales_channels.name
         )
         SELECT type,
                name,
                total::text,
                orders,
                quantity::text
         FROM report_rows
         ORDER BY total DESC
         LIMIT 30`,
        [companyId, startDate, endDate]
      )
        ]);

        if (!company.rows[0]) {
          throw new Error("Empresa no encontrada");
        }

        const companyRow = company.rows[0] as { minimum_stock?: number };
        const minimumStock = Number(companyRow.minimum_stock || 0);
        const summary = kpiSummary.rows[0] || {};
        const start = currentStart;
        const totalDays = rangeDays;
        const metricsByDate = new Map(metricsByDay.rows.map((row) => [new Date(row.saleDate as string).toISOString().slice(0, 10), row]));
        const previousByOffset = new Map(previousSalesByDay.rows.map((row) => {
          const previousDate = new Date(row.saleDate as string);
          return [dayDiff(previousStart, previousDate), toMillions(row.sales)];
        }));
        const weeklySales = Array.from({ length: totalDays }, (_, index) => {
          const date = new Date(start);
          date.setDate(start.getDate() + index);
          const key = date.toISOString().slice(0, 10);
          const metric = metricsByDate.get(key) || {};
          return {
            day: chartLabel(date, totalDays),
            value: toMillions(metric.sales),
            previous: previousByOffset.get(index) || 0,
            cash: toMillions(metric.cash),
            margin: Number(toNumber(metric.margin).toFixed(1)),
            criticalStock: Number(metric.criticalStock || 0)
          };
        });
        const products = topProducts.rows.map((product) => {
          const stock = toNumber(product.stock);
          return {
            name: String(product.name || "Producto sin nombre"),
            sales: `$${toMillions(product.sales).toFixed(1)}M`,
            stock: stockLabel(stock, minimumStock)
          };
        });

        return {
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
            comparison: {
              previousStartDate,
              previousEndDate,
              previousSales: toMillions(previousSummary.rows[0]?.sales),
              previousMargin: Number(toNumber(previousSummary.rows[0]?.margin).toFixed(1))
            },
            range: { startDate, endDate }
          },
          alertRules: alertRules.rows,
          alerts: alerts.rows,
          integrations: integrations.rows,
          decisions: decisions.rows,
          aiSuggestions: aiSuggestions.rows,
          reports: reports.rows,
          salesReports: salesReports.rows
        };
      }
    );

    return ok(data);
  } catch (error) {
    return fail(error);
  }
}
