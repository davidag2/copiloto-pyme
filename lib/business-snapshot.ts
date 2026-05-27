import { query } from "@/lib/db";
import type { BusinessSnapshot, BusinessSnapshotMetric } from "@/lib/ai-decision-engine";

type SnapshotSummaryRow = {
  activeAlerts: number;
  activeCustomers: number;
  averageTicket: string;
  criticalStock: number;
  importedRows: number;
  latestCash: string;
  openSuggestions: number;
  pendingReceivables: string;
  sales30d: string;
  sales7d: string;
  totalProducts: number;
};

type NamedMetricRow = {
  label: string;
  value: string;
};

type AlertRow = {
  message: string;
  severity: string;
};

function money(value: unknown) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount)) return "COP $0";
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}

function numberMetric(label: string, value: unknown, trend?: string): BusinessSnapshotMetric {
  const parsed = Number(value || 0);
  return {
    label,
    trend,
    value: Number.isFinite(parsed) ? parsed : 0
  };
}

function moneyMetric(label: string, value: unknown, trend?: string): BusinessSnapshotMetric {
  return {
    label,
    trend,
    value: money(value)
  };
}

export async function buildBusinessSnapshot(companyId: string): Promise<BusinessSnapshot> {
  const [company, summary, topProducts, topCustomers, channelSummary, alerts, recentActivity] = await Promise.all([
    query<{ name: string }>(`SELECT name FROM companies WHERE id = $1 LIMIT 1`, [companyId]),
    query<SnapshotSummaryRow>(
      `WITH orders AS (
         SELECT *
         FROM sales_orders
         WHERE company_id = $1
           AND status <> 'anulada'
       ),
       latest_cash AS (
         SELECT cash
         FROM imported_data_rows
         WHERE company_id = $1
           AND validation_errors = '[]'::jsonb
           AND cash IS NOT NULL
         ORDER BY COALESCE(sale_date, created_at::date) DESC, created_at DESC
         LIMIT 1
       )
       SELECT COALESCE(SUM(total) FILTER (WHERE sale_date >= CURRENT_DATE - INTERVAL '29 days'), 0)::text AS "sales30d",
              COALESCE(SUM(total) FILTER (WHERE sale_date >= CURRENT_DATE - INTERVAL '6 days'), 0)::text AS "sales7d",
              COALESCE(AVG(total) FILTER (WHERE sale_date >= CURRENT_DATE - INTERVAL '29 days'), 0)::text AS "averageTicket",
              COALESCE(SUM(total) FILTER (WHERE status = 'pendiente'), 0)::text AS "pendingReceivables",
              COALESCE((SELECT cash FROM latest_cash), 0)::text AS "latestCash",
              COALESCE((SELECT COUNT(*) FROM sales_products WHERE company_id = $1 AND status = 'active'), 0)::int AS "totalProducts",
              COALESCE((SELECT COUNT(*) FROM sales_products JOIN companies ON companies.id = sales_products.company_id WHERE sales_products.company_id = $1 AND sales_products.status = 'active' AND sales_products.stock <= companies.minimum_stock), 0)::int AS "criticalStock",
              COALESCE((SELECT COUNT(*) FROM sales_customers WHERE company_id = $1 AND status = 'active'), 0)::int AS "activeCustomers",
              COALESCE((SELECT COUNT(*) FROM imported_data_rows WHERE company_id = $1 AND validation_errors = '[]'::jsonb), 0)::int AS "importedRows",
              COALESCE((SELECT COUNT(*) FROM alerts WHERE company_id = $1 AND status <> 'resuelta'), 0)::int AS "activeAlerts",
              COALESCE((SELECT COUNT(*) FROM ai_suggestions WHERE company_id = $1 AND status IN ('nueva', 'vista', 'asignada', 'en_progreso')), 0)::int AS "openSuggestions"
       FROM orders`,
      [companyId]
    ),
    query<NamedMetricRow>(
      `SELECT sales_order_items.description AS label,
              COALESCE(SUM(sales_order_items.total), 0)::text AS value
       FROM sales_order_items
       JOIN sales_orders ON sales_orders.id = sales_order_items.order_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY sales_order_items.description
       ORDER BY SUM(sales_order_items.total) DESC NULLS LAST
       LIMIT 5`,
      [companyId]
    ),
    query<NamedMetricRow>(
      `SELECT COALESCE(sales_customers.name, 'Cliente sin nombre') AS label,
              COALESCE(SUM(sales_orders.total), 0)::text AS value
       FROM sales_orders
       LEFT JOIN sales_customers ON sales_customers.id = sales_orders.customer_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY COALESCE(sales_customers.name, 'Cliente sin nombre')
       ORDER BY SUM(sales_orders.total) DESC NULLS LAST
       LIMIT 5`,
      [companyId]
    ),
    query<NamedMetricRow>(
      `SELECT COALESCE(sales_channels.name, 'Canal no definido') AS label,
              COALESCE(SUM(sales_orders.total), 0)::text AS value
       FROM sales_orders
       LEFT JOIN sales_channels ON sales_channels.id = sales_orders.channel_id
       WHERE sales_orders.company_id = $1
         AND sales_orders.status <> 'anulada'
         AND sales_orders.sale_date >= CURRENT_DATE - INTERVAL '29 days'
       GROUP BY COALESCE(sales_channels.name, 'Canal no definido')
       ORDER BY SUM(sales_orders.total) DESC NULLS LAST
       LIMIT 5`,
      [companyId]
    ),
    query<AlertRow>(
      `SELECT severity, message
       FROM alerts
       WHERE company_id = $1
         AND status <> 'resuelta'
       ORDER BY created_at DESC
       LIMIT 8`,
      [companyId]
    ),
    query<AlertRow>(
      `SELECT severity, message
       FROM activity_events
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 8`,
      [companyId]
    )
  ]);

  if (!company.rows[0]) {
    throw new Error("Empresa no encontrada.");
  }

  const row = summary.rows[0] || {
    activeAlerts: 0,
    activeCustomers: 0,
    averageTicket: "0",
    criticalStock: 0,
    importedRows: 0,
    latestCash: "0",
    openSuggestions: 0,
    pendingReceivables: "0",
    sales30d: "0",
    sales7d: "0",
    totalProducts: 0
  };

  return {
    alerts: alerts.rows.map((alert) => `${alert.severity}: ${alert.message}`),
    companyId,
    companyName: company.rows[0].name,
    currency: "COP",
    dateRangeLabel: "Ultimos 30 dias",
    metrics: [
      moneyMetric("Ventas ultimos 30 dias", row.sales30d),
      moneyMetric("Ventas ultimos 7 dias", row.sales7d),
      moneyMetric("Ticket promedio", row.averageTicket),
      moneyMetric("Cuentas por cobrar", row.pendingReceivables),
      moneyMetric("Caja registrada mas reciente", row.latestCash),
      numberMetric("Productos activos", row.totalProducts),
      numberMetric("Productos criticos", row.criticalStock),
      numberMetric("Clientes activos", row.activeCustomers),
      numberMetric("Filas importadas validas", row.importedRows),
      numberMetric("Alertas abiertas", row.activeAlerts),
      numberMetric("Sugerencias abiertas", row.openSuggestions)
    ],
    notes: [
      ...topProducts.rows.map((item) => `Producto destacado: ${item.label} (${money(item.value)})`),
      ...topCustomers.rows.map((item) => `Cliente destacado: ${item.label} (${money(item.value)})`),
      ...channelSummary.rows.map((item) => `Canal destacado: ${item.label} (${money(item.value)})`)
    ],
    recentActivity: recentActivity.rows.map((event) => `${event.severity}: ${event.message}`)
  };
}
