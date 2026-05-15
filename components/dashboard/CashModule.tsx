"use client";

import { Banknote, Boxes, RefreshCw, Target } from "lucide-react";

type Metrics = {
  sales: number;
  cash: number;
  margin: number;
  criticalStock: number;
};

type CashModuleProps = {
  isActive: boolean;
  metrics: Metrics;
  monthlyGoal: number;
  salesPercent: number;
  marginRule: number;
  stockRule: number;
  showMargin: boolean;
  showStock: boolean;
  formatMoney: (value: number) => string;
  formatGoal: (value: number) => string;
  cashDays: (cash: number) => number;
};

function statusForSales(sales: number, goal: number) {
  const percent = (sales / (goal / 1_000_000)) * 100;
  if (percent >= 80) return "green";
  if (percent >= 55) return "yellow";
  return "red";
}

export function CashModule({
  isActive,
  metrics,
  monthlyGoal,
  salesPercent,
  marginRule,
  stockRule,
  showMargin,
  showStock,
  formatMoney,
  formatGoal,
  cashDays
}: CashModuleProps) {
  const salesStatus = statusForSales(metrics.sales, monthlyGoal);
  const goalCards = [
    ["sales", "Meta mensual de ventas", `${formatMoney(metrics.sales)} de ${formatGoal(monthlyGoal)}`, salesPercent],
    ["cash", "Caja disponible", `${cashDays(metrics.cash)} dias de cobertura`, Math.min((cashDays(metrics.cash) / 25) * 100, 100)],
    ["margin", "Margen minimo", `${metrics.margin.toFixed(1)}% contra meta de ${marginRule}%`, Math.min((metrics.margin / 35) * 100, 100)],
    ["stock", "Inventario critico", `${metrics.criticalStock} SKU requieren atencion`, Math.max(0, 100 - metrics.criticalStock * 12)]
  ] as const;

  return (
    <>
      <section className="goals-panel dashboard-module-section" data-active={isActive}>
        <div className="panel-heading">
          <div><span><Target aria-hidden="true" />Metas y semaforos</span><h2>Avance contra objetivos</h2></div>
          <button className="secondary-button" type="button"><RefreshCw aria-hidden="true" />Recalcular</button>
        </div>
        <div className="goals-grid">
          {goalCards.map(([key, title, text, percent]) => {
            const status = key === "sales" ? salesStatus : "yellow";
            return (
              <article className="goal-card" data-status={status} key={key}>
                <div className="goal-topline"><span className="traffic-light" data-status={status} /><strong>{title}</strong></div>
                <p>{text}</p>
                <div className="progress-track"><span data-status={status} style={{ width: `${percent}%` }} /></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="kpi-grid secondary-kpi-grid dashboard-module-section" data-active={isActive}>
        {showMargin && (
          <article className="metric-card" data-status={metrics.margin >= marginRule ? "green" : "yellow"}>
            <span><Banknote aria-hidden="true" />Margen bruto</span>
            <strong>{metrics.margin.toFixed(1)}%</strong>
            <small className="positive">{(metrics.margin - marginRule).toFixed(1)} pts vs meta</small>
          </article>
        )}
        {showStock && (
          <article className="metric-card" data-status={metrics.criticalStock > stockRule ? "red" : "green"}>
            <span><Boxes aria-hidden="true" />Inventario critico</span>
            <strong>{metrics.criticalStock} SKU</strong>
            <small className="danger">Requiere atencion hoy</small>
          </article>
        )}
      </section>
    </>
  );
}
