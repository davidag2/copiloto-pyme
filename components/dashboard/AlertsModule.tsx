"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Filter,
  LineChart,
  Megaphone,
  Package,
  Plus,
  Search,
  Settings2,
  ShoppingCart,
  Sparkles,
  TriangleAlert,
  Users,
  WalletCards,
  Zap
} from "lucide-react";

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

const criticalAlerts: Array<[string, string, string, string, string, string, string, LucideIcon]> = [
];

const activity: Array<[string, string, string, string, LucideIcon]> = [
];

const aiAlerts: Array<[string, string, string, string, LucideIcon]> = [
];

const filters = ["Todas", "Ventas", "Caja", "Inventario", "Clientes", "Compras", "Financieras"];

const quickActions: Array<[string, LucideIcon]> = [
  ["Crear orden de compra", ShoppingCart],
  ["Contactar cliente", Megaphone],
  ["Ver reporte de ventas", LineChart],
  ["Ajustar inventario", Package],
  ["Registrar pago", WalletCards],
  ["Más acciones", Plus]
];

const kpiCards: Array<[string, string, string, LucideIcon, string]> = [
  ["Alertas activas", "0", "Total pendientes", Bell, "red"],
  ["Críticas", "0", "Atención inmediata", TriangleAlert, "red"],
  ["Resueltas hoy", "0", "Sin actividad", CheckCircle2, "green"],
  ["Riesgos IA", "0", "Detectados", Settings2, "purple"]
];

export function AlertsModule({
  isActive,
  alerts,
  rules,
  microAction,
  canManageRules,
  onRulesChange,
  onApplyRules
}: AlertsModuleProps) {
  const activeAlerts = alerts.length;

  return (
    <section className="alerts-command-center dashboard-module-section" data-active={isActive}>
      <header className="alerts-page-heading">
        <div>
          <h2>Alertas</h2>
          <p>Monitorea lo importante y actúa a tiempo con la ayuda de la IA.</p>
        </div>
        <div className="alerts-page-actions">
          <button className="alerts-icon-button" aria-label="Buscar alerta" type="button"><Search aria-hidden="true" /></button>
          <button className="alerts-date-button" type="button"><CalendarDays aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="alerts-icon-button" aria-label="Configurar alertas" type="button"><Settings2 aria-hidden="true" /></button>
          <button className="primary-button" type="button"><Zap aria-hidden="true" />Acciones rápidas</button>
        </div>
      </header>

      <div className="alerts-top-grid">
        <article className="alerts-ai-card">
          <div className="alerts-ai-orb"><Sparkles aria-hidden="true" /></div>
          <div>
            <span>Copiloto de alertas</span>
            <h3>Alertas empieza en cero: la IA te avisará cuando encuentre riesgos reales.</h3>
            <ul>
              <li>Sin alertas críticas por ahora</li>
              <li>Conecta ventas, caja, inventario y clientes</li>
              <li>Configura reglas para recibir avisos importantes</li>
            </ul>
            <button className="secondary-button" type="button">Ver acciones recomendadas <ChevronRight aria-hidden="true" /></button>
          </div>
        </article>

        {kpiCards.map(([label, value, helper, KpiIcon, tone], index) => {
          const displayValue = index === 0 ? activeAlerts.toString() : value;
          return (
            <article className="alerts-kpi-card" data-tone={tone} key={String(label)}>
              <span><KpiIcon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{displayValue}</strong>
              <em>{helper}</em>
            </article>
          );
        })}
      </div>

      <div className="alerts-main-grid">
        <section className="alerts-critical-panel">
          <header><strong>Alertas críticas</strong><button type="button">Ver todas</button></header>
          <div>
            {criticalAlerts.map(([label, title, detailA, detailB, actionA, actionB, tone, Icon]) => (
              <article data-tone={tone} key={title}>
                <span><Icon aria-hidden="true" />{label}</span>
                <h3>{title}</h3>
                <p>{detailA}</p>
                <p>{detailB}</p>
                <footer><button type="button">{actionA}</button><button type="button">{actionB}</button></footer>
              </article>
            ))}
            {!criticalAlerts.length ? <p className="module-empty-note">Sin alertas críticas. Aparecerán aquí cuando una regla detecte riesgo en ventas, caja, inventario o clientes.</p> : null}
          </div>
        </section>

        <section className="alerts-activity-panel">
          <header><strong>Actividad reciente</strong><button type="button">Ver todas</button></header>
          <div>
            {activity.map(([title, text, time, tone, Icon]) => (
              <article data-tone={tone} key={title}>
                <span><Icon aria-hidden="true" /></span>
                <div><strong>{title}</strong><p>{text}</p></div>
                <time>{time}</time>
              </article>
            ))}
            {!activity.length ? <p className="module-empty-note">Sin actividad reciente. La línea de tiempo se llenará cuando se generen alertas reales.</p> : null}
          </div>
        </section>
      </div>

      <div className="alerts-lower-grid">
        <main>
          <section className="alerts-ai-list-panel">
            <header><strong>Alertas de la IA</strong><button type="button">Ver todas</button></header>
            <div>
              {aiAlerts.map(([label, text, action, tone, Icon]) => (
                <article data-tone={tone} key={text}>
                  <span><Icon aria-hidden="true" /></span>
                  <div><strong>{label}</strong><p>{text}</p><button type="button">{action}</button></div>
                </article>
              ))}
              {!aiAlerts.length ? <p className="module-empty-note">Sin alertas de IA. Copiloto empezará a sugerir acciones cuando existan datos suficientes.</p> : null}
            </div>
          </section>

          <section className="alerts-actions-panel">
            <header><strong>Acciones rápidas</strong></header>
            <div>
              {quickActions.map(([label, Icon]) => (
                <button type="button" key={label}><Icon aria-hidden="true" /><span>{label}</span></button>
              ))}
            </div>
          </section>
        </main>

        <aside>
          <section className="alerts-filter-panel">
            <header><strong>Filtrar alertas</strong></header>
            {filters.map((filter, index) => <button className={index === 0 ? "active" : ""} type="button" key={filter}><Filter aria-hidden="true" />{filter}</button>)}
            <button className="custom-filter" type="button"><Settings2 aria-hidden="true" />Personalizar filtros</button>
          </section>

          <section className="alerts-config-panel">
            <header><strong>Configuración de alertas</strong><button type="button" onClick={onApplyRules} disabled={!canManageRules}>Ver configuración</button></header>
            <p>Elige cómo y cuándo recibir tus alertas</p>
            {microAction ? <small className="alerts-micro-action">{microAction}</small> : null}
            <div>
              {["WhatsApp", "Email", "Notificaciones", "Alertas críticas IA"].map((item) => <article key={item}><strong>{item}</strong><span>Activo</span></article>)}
            </div>
            <details>
              <summary>Reglas actuales</summary>
              <label>Ventas <input type="number" value={rules.sales} onChange={(event) => onRulesChange({ ...rules, sales: Number(event.target.value) })} /></label>
              <label>Caja <input type="number" value={rules.cash} onChange={(event) => onRulesChange({ ...rules, cash: Number(event.target.value) })} /></label>
              <label>Margen <input type="number" value={rules.margin} onChange={(event) => onRulesChange({ ...rules, margin: Number(event.target.value) })} /></label>
              <label>Stock <input type="number" value={rules.stock} onChange={(event) => onRulesChange({ ...rules, stock: Number(event.target.value) })} /></label>
            </details>
          </section>
        </aside>
      </div>
    </section>
  );
}
