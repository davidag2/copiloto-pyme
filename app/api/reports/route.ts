import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { clearCompanyServerCache, withServerCache } from "@/lib/server-cache";
import { requireCompanySession } from "@/lib/session";

function resolveSalesRange(period: string) {
  if (period === "diario") return "CURRENT_DATE";
  if (period === "semanal") return "CURRENT_DATE - INTERVAL '6 days'";
  if (period === "mensual") return "date_trunc('month', CURRENT_DATE)::date";
  return "CURRENT_DATE - INTERVAL '29 days'";
}

async function getSalesReports(companyId: string, period = "mensual") {
  const startExpression = resolveSalesRange(period);
  const [summary, byDay, bySeller, byProduct, byCustomer, byChannel] = await Promise.all([
    query(
      `SELECT COALESCE(SUM(total) FILTER (WHERE status <> 'anulada'), 0)::text AS total,
              COUNT(*) FILTER (WHERE status <> 'anulada')::int AS orders,
              COALESCE(AVG(total) FILTER (WHERE status <> 'anulada'), 0)::text AS "averageTicket",
              COALESCE(SUM(total) FILTER (WHERE status = 'pendiente'), 0)::text AS "pendingReceivables"
       FROM sales_orders
       WHERE company_id = $1
         AND sale_date >= ${startExpression}`,
      [companyId]
    ),
    query(
      `SELECT sale_date AS "date",
              COALESCE(SUM(total) FILTER (WHERE status <> 'anulada'), 0)::text AS total,
              COUNT(*) FILTER (WHERE status <> 'anulada')::int AS orders
       FROM sales_orders
       WHERE company_id = $1
         AND sale_date >= ${startExpression}
       GROUP BY sale_date
       ORDER BY sale_date ASC`,
      [companyId]
    ),
    query(
      `SELECT COALESCE(sales_reps.name, 'Sin vendedor') AS name,
              COALESCE(SUM(sales_orders.total) FILTER (WHERE sales_orders.status <> 'anulada'), 0)::text AS total,
              COUNT(*) FILTER (WHERE sales_orders.status <> 'anulada')::int AS orders
       FROM sales_orders
       LEFT JOIN sales_reps ON sales_reps.id = sales_orders.sales_rep_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.sale_date >= ${startExpression}
       GROUP BY COALESCE(sales_reps.name, 'Sin vendedor')
       ORDER BY SUM(sales_orders.total) DESC NULLS LAST
       LIMIT 20`,
      [companyId]
    ),
    query(
      `SELECT sales_order_items.description AS name,
              COALESCE(SUM(sales_order_items.total) FILTER (WHERE sales_orders.status <> 'anulada'), 0)::text AS total,
              COALESCE(SUM(sales_order_items.quantity) FILTER (WHERE sales_orders.status <> 'anulada'), 0)::text AS quantity
       FROM sales_order_items
       JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.sale_date >= ${startExpression}
       GROUP BY sales_order_items.description
       ORDER BY SUM(sales_order_items.total) DESC NULLS LAST
       LIMIT 20`,
      [companyId]
    ),
    query(
      `SELECT COALESCE(sales_customers.name, 'Cliente sin nombre') AS name,
              COALESCE(SUM(sales_orders.total) FILTER (WHERE sales_orders.status <> 'anulada'), 0)::text AS total,
              COUNT(*) FILTER (WHERE sales_orders.status <> 'anulada')::int AS orders
       FROM sales_orders
       LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.sale_date >= ${startExpression}
       GROUP BY COALESCE(sales_customers.name, 'Cliente sin nombre')
       ORDER BY SUM(sales_orders.total) DESC NULLS LAST
       LIMIT 20`,
      [companyId]
    ),
    query(
      `SELECT COALESCE(sales_channels.name, 'Canal no definido') AS name,
              COALESCE(SUM(sales_orders.total) FILTER (WHERE sales_orders.status <> 'anulada'), 0)::text AS total,
              COUNT(*) FILTER (WHERE sales_orders.status <> 'anulada')::int AS orders
       FROM sales_orders
       LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.sale_date >= ${startExpression}
       GROUP BY COALESCE(sales_channels.name, 'Canal no definido')
       ORDER BY SUM(sales_orders.total) DESC NULLS LAST
       LIMIT 20`,
      [companyId]
    )
  ]);

  return {
    period,
    summary: summary.rows[0] || { total: "0", orders: 0, averageTicket: "0", pendingReceivables: "0" },
    daily: byDay.rows,
    bySeller: bySeller.rows,
    byProduct: byProduct.rows,
    byCustomer: byCustomer.rows,
    byChannel: byChannel.rows
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const period = searchParams.get("period") || "mensual";
    const data = await withServerCache(`company:${companyId}:reports:${session.session.userId}:${period}`, 30_000, async () => {
      const reports = await query(
        `SELECT * FROM reports
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 50`,
        [companyId]
      );
      const salesReports = await getSalesReports(companyId, period);
      return { reports: reports.rows, salesReports };
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
    const frequency = requiredString(body.frequency, "frequency");
    const channel = requiredString(body.channel, "channel");
    const recipient = requiredString(body.recipient, "recipient");
    const content = requiredString(body.content, "content");

    const report = await query(
      `INSERT INTO reports (company_id, frequency, channel, recipient, content, status, sent_at)
       VALUES ($1, $2, $3, $4, $5, $6, CASE WHEN $6 = 'sent' THEN NOW() ELSE NULL END)
       RETURNING *`,
      [companyId, frequency, channel, recipient, content, body.status || "draft"]
    );
    clearCompanyServerCache(companyId);
    return ok({ report: report.rows[0] }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
