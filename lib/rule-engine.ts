export type RuleLevel = "positive" | "warning" | "danger";

export type BasicRuleMetrics = {
  salesProgressPercent: number;
  cashDays: number;
  marginPercent: number;
  criticalStockCount: number;
};

export type BasicRuleThresholds = {
  sales: number;
  cash: number;
  margin: number;
  stock: number;
};

export type RuleAlert = {
  level: RuleLevel;
  metric: "sales" | "cash" | "margin" | "stock" | "system";
  title: string;
  text: string;
  status: "open" | "resolved";
};

function safeNumber(value: number, fallback = 0) {
  return Number.isFinite(value) ? value : fallback;
}

function formatPercent(value: number) {
  return `${safeNumber(value).toFixed(value % 1 === 0 ? 0 : 1)}%`;
}

export function evaluateBasicRules(metrics: BasicRuleMetrics, thresholds: BasicRuleThresholds): RuleAlert[] {
  const alerts: RuleAlert[] = [];
  const salesProgress = safeNumber(metrics.salesProgressPercent);
  const cashCoverage = safeNumber(metrics.cashDays);
  const margin = safeNumber(metrics.marginPercent);
  const criticalStock = safeNumber(metrics.criticalStockCount);

  if (salesProgress < thresholds.sales) {
    alerts.push({
      level: "danger",
      metric: "sales",
      title: "Ventas bajo meta",
      text: `Avance actual ${formatPercent(salesProgress)}. La regla exige mínimo ${formatPercent(thresholds.sales)}.`,
      status: "open"
    });
  }

  if (cashCoverage < thresholds.cash) {
    alerts.push({
      level: cashCoverage < Math.max(7, thresholds.cash * 0.5) ? "danger" : "warning",
      metric: "cash",
      title: "Caja baja",
      text: `Cobertura estimada ${Math.round(cashCoverage)} días. La regla exige ${Math.round(thresholds.cash)} días.`,
      status: "open"
    });
  }

  if (margin < thresholds.margin) {
    alerts.push({
      level: "warning",
      metric: "margin",
      title: "Margen bajo",
      text: `Margen actual ${margin.toFixed(1)}%. La regla exige ${thresholds.margin.toFixed(1)}%.`,
      status: "open"
    });
  }

  if (criticalStock > thresholds.stock) {
    alerts.push({
      level: "danger",
      metric: "stock",
      title: "Stock bajo",
      text: `${Math.round(criticalStock)} producto(s) críticos. La regla permite hasta ${Math.round(thresholds.stock)}.`,
      status: "open"
    });
  }

  return alerts.length ? alerts : [{
    level: "positive",
    metric: "system",
    title: "Reglas dentro de rango",
    text: "No hay alertas activas según los umbrales configurados.",
    status: "resolved"
  }];
}
