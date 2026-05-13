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

export type CompanyAlertRule = {
  id?: string | null;
  metric: "sales" | "cash" | "margin" | "stock";
  threshold: number | string;
  comparator: "below" | "above";
  enabled?: boolean;
};

export type RuleAlert = {
  ruleId?: string | null;
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

function titleForMetric(metric: CompanyAlertRule["metric"]) {
  if (metric === "sales") return "Ventas bajo meta";
  if (metric === "cash") return "Caja baja";
  if (metric === "margin") return "Margen bajo";
  return "Stock bajo";
}

function valueForMetric(metrics: BasicRuleMetrics, metric: CompanyAlertRule["metric"]) {
  if (metric === "sales") return safeNumber(metrics.salesProgressPercent);
  if (metric === "cash") return safeNumber(metrics.cashDays);
  if (metric === "margin") return safeNumber(metrics.marginPercent);
  return safeNumber(metrics.criticalStockCount);
}

function alertText(metric: CompanyAlertRule["metric"], value: number, threshold: number) {
  if (metric === "sales") return `Avance actual ${formatPercent(value)}. La regla exige mínimo ${formatPercent(threshold)}.`;
  if (metric === "cash") return `Cobertura estimada ${Math.round(value)} días. La regla exige ${Math.round(threshold)} días.`;
  if (metric === "margin") return `Margen actual ${value.toFixed(1)}%. La regla exige ${threshold.toFixed(1)}%.`;
  return `${Math.round(value)} producto(s) críticos. La regla permite hasta ${Math.round(threshold)}.`;
}

function levelForRule(metric: CompanyAlertRule["metric"], value: number, threshold: number): RuleLevel {
  if (metric === "sales" || metric === "stock") return "danger";
  if (metric === "cash") return value < Math.max(7, threshold * 0.5) ? "danger" : "warning";
  return "warning";
}

export function thresholdsToRules(thresholds: BasicRuleThresholds): CompanyAlertRule[] {
  return [
    { metric: "sales", threshold: thresholds.sales, comparator: "below", enabled: true },
    { metric: "cash", threshold: thresholds.cash, comparator: "below", enabled: true },
    { metric: "margin", threshold: thresholds.margin, comparator: "below", enabled: true },
    { metric: "stock", threshold: thresholds.stock, comparator: "above", enabled: true }
  ];
}

export function thresholdsFromRules(rules: CompanyAlertRule[], fallback: BasicRuleThresholds): BasicRuleThresholds {
  return rules.reduce<BasicRuleThresholds>((next, rule) => {
    const threshold = safeNumber(Number(rule.threshold), fallback[rule.metric]);
    return { ...next, [rule.metric]: threshold };
  }, fallback);
}

export function evaluateCompanyRules(metrics: BasicRuleMetrics, rules: CompanyAlertRule[]): RuleAlert[] {
  const alerts = rules.filter((rule) => rule.enabled !== false).flatMap((rule) => {
    const threshold = safeNumber(Number(rule.threshold));
    const value = valueForMetric(metrics, rule.metric);
    const violated = rule.comparator === "above" ? value > threshold : value < threshold;
    if (!violated) return [];
    return [{
      ruleId: rule.id || null,
      level: levelForRule(rule.metric, value, threshold),
      metric: rule.metric,
      title: titleForMetric(rule.metric),
      text: alertText(rule.metric, value, threshold),
      status: "open" as const
    }];
  });

  return alerts.length ? alerts : [{
    ruleId: null,
    level: "positive",
    metric: "system",
    title: "Reglas dentro de rango",
    text: "No hay alertas activas según los umbrales configurados.",
    status: "resolved"
  }];
}

export function evaluateBasicRules(metrics: BasicRuleMetrics, thresholds: BasicRuleThresholds): RuleAlert[] {
  return evaluateCompanyRules(metrics, thresholdsToRules(thresholds));
}
