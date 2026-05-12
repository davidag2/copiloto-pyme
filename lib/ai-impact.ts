import { query } from "./db";

export type ImpactType = "ventas_adicionales" | "margen" | "ahorro" | "riesgo_evitado";

type ImpactStats = {
  rows: string;
  recentSales: string | null;
  previousSales: string | null;
  recentExpenses: string | null;
  avgMargin: string | null;
  lowStockRows: string;
  minStock: string | null;
};

const fallbackByType: Record<ImpactType, number> = {
  ventas_adicionales: 850000,
  margen: 520000,
  ahorro: 380000,
  riesgo_evitado: 650000
};

function impactTypeForCategory(category: string): ImpactType {
  if (category === "precios") return "margen";
  if (category === "costos" || category === "caja") return "ahorro";
  if (category === "inventario") return "riesgo_evitado";
  return "ventas_adicionales";
}

function labelForImpact(type: ImpactType, value: number) {
  const formatted = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(Math.max(0, Math.round(value)));

  if (type === "margen") return `+ ${formatted} en margen`;
  if (type === "ahorro") return `${formatted} de ahorro estimado`;
  if (type === "riesgo_evitado") return `${formatted} en riesgo evitado`;
  return `+ ${formatted} en ventas`;
}

function positive(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export async function calculateSuggestionImpact(companyId: string, category: string, priority = "medium") {
  const type = impactTypeForCategory(category);
  const statsResult = await query<ImpactStats>(
    `WITH scoped_rows AS (
       SELECT imported_data_rows.*,
              COALESCE(imported_data_rows.sale_date, imported_data_rows.created_at::date) AS metric_date
       FROM imported_data_rows
       WHERE imported_data_rows.company_id = $1
         AND imported_data_rows.validation_errors = '[]'::jsonb
     ),
     company AS (
       SELECT minimum_stock
       FROM companies
       WHERE id = $1
     )
     SELECT COUNT(*)::text AS rows,
            COALESCE(SUM(sales) FILTER (WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'), 0)::text AS "recentSales",
            COALESCE(SUM(sales) FILTER (WHERE metric_date < CURRENT_DATE - INTERVAL '30 days' AND metric_date >= CURRENT_DATE - INTERVAL '60 days'), 0)::text AS "previousSales",
            COALESCE(SUM(expenses) FILTER (WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'), 0)::text AS "recentExpenses",
            COALESCE(AVG(margin) FILTER (WHERE metric_date >= CURRENT_DATE - INTERVAL '30 days'), 0)::text AS "avgMargin",
            COALESCE(COUNT(*) FILTER (WHERE stock <= (SELECT minimum_stock FROM company)), 0)::text AS "lowStockRows",
            COALESCE((SELECT minimum_stock FROM company), 0)::text AS "minStock"
     FROM scoped_rows`,
    [companyId]
  );

  const stats = statsResult.rows[0];
  const rowCount = Number(stats?.rows || 0);
  const recentSales = Number(stats?.recentSales || 0);
  const previousSales = Number(stats?.previousSales || 0);
  const recentExpenses = Number(stats?.recentExpenses || 0);
  const avgMargin = Number(stats?.avgMargin || 0);
  const lowStockRows = Number(stats?.lowStockRows || 0);
  const minStock = Number(stats?.minStock || 0);
  const priorityMultiplier = priority === "critical" ? 1.35 : priority === "high" ? 1.18 : priority === "low" ? 0.72 : 1;

  let value = fallbackByType[type] * priorityMultiplier;
  if (rowCount > 0) {
    if (type === "ventas_adicionales") {
      const trendGap = positive(recentSales - previousSales);
      value = Math.max(recentSales * 0.06, trendGap * 0.22, fallbackByType[type] * 0.55) * priorityMultiplier;
    }
    if (type === "margen") {
      const marginGap = positive(32 - avgMargin) / 100;
      value = Math.max(recentSales * Math.max(marginGap, 0.025), fallbackByType[type] * 0.5) * priorityMultiplier;
    }
    if (type === "ahorro") {
      value = Math.max(recentExpenses * 0.07, recentSales * 0.018, fallbackByType[type] * 0.5) * priorityMultiplier;
    }
    if (type === "riesgo_evitado") {
      const dailySales = recentSales / 30;
      value = Math.max(dailySales * Math.max(lowStockRows, 1) * 2.5, fallbackByType[type] * 0.5) * priorityMultiplier;
    }
  }

  const impactValueCop = Math.round(value);
  return {
    impactType: type,
    impactValueCop,
    impactLabel: labelForImpact(type, impactValueCop),
    evidence: {
      calculation: rowCount > 0 ? "imported_data_rows_60d" : "fallback_without_imported_rows",
      rowCount,
      recentSales,
      previousSales,
      recentExpenses,
      avgMargin,
      lowStockRows,
      minStock,
      priorityMultiplier
    }
  };
}
