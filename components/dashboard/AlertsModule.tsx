"use client";

import { AlertTriangle, Settings2 } from "lucide-react";

type Alert = {
  level: "positive" | "warning" | "danger";
  title: string;
  text: string;
  metric?: string;
  status?: string;
};

type AlertRules = {
  sales: number;
  cash: number;
  margin: number;
  stock: number;
};

type AlertsModuleProps = {
  isActive: boolean;
  alerts: Alert[];
  rules: AlertRules;
  microAction: string | null;
  canManageRules: boolean;
  onRulesChange: (rules: AlertRules) => void;
  onApplyRules: () => void;
};

export function AlertsModule({
  isActive,
  alerts,
  rules,
  microAction,
  canManageRules,
  onRulesChange,
  onApplyRules
}: AlertsModuleProps) {
  return (
    <>
      <section className="rules-panel dashboard-module-section" data-active={isActive}>
        <div className="panel-heading">
          <div><span><AlertTriangle aria-hidden="true" />Alertas configurables</span><h2>Reglas de riesgo del negocio</h2></div>
          <button className="primary-button micro-button" data-motion={microAction === "rules" ? "active" : undefined} type="button" onClick={onApplyRules} disabled={!canManageRules}>
            <Settings2 aria-hidden="true" />Aplicar reglas
          </button>
        </div>
        <div className="rules-grid" data-motion={microAction === "rules" ? "active" : undefined}>
          <label><span>Ventas bajo meta</span><input type="number" value={rules.sales} onChange={(event) => onRulesChange({ ...rules, sales: Number(event.target.value) })} /><small>% minimo de avance mensual</small></label>
          <label><span>Caja insuficiente</span><input type="number" value={rules.cash} onChange={(event) => onRulesChange({ ...rules, cash: Number(event.target.value) })} /><small>Dias minimos de cobertura</small></label>
          <label><span>Margen bajo</span><input type="number" value={rules.margin} onChange={(event) => onRulesChange({ ...rules, margin: Number(event.target.value) })} /><small>% minimo de margen bruto</small></label>
          <label><span>Inventario critico</span><input type="number" value={rules.stock} onChange={(event) => onRulesChange({ ...rules, stock: Number(event.target.value) })} /><small>SKU maximos en riesgo</small></label>
        </div>
      </section>

      <article className="panel alerts-panel priority-panel dashboard-module-panel" data-active={isActive}>
        <div className="panel-heading">
          <div><span><AlertTriangle aria-hidden="true" />Atencion requerida</span><h2>Alertas inteligentes</h2></div>
        </div>
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div className="alert-item" data-level={alert.level} key={alert.title}>
              <strong className={alert.level}>{alert.title}</strong>
              <p>{alert.text}</p>
            </div>
          ))}
        </div>
      </article>
    </>
  );
}
