"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Bell,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  CreditCard,
  Info,
  MoreHorizontal,
  Plus,
  Sparkles,
  TrendingDown,
  TrendingUp,
  WalletCards
} from "lucide-react";

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

const shortMoney = (value: number) => value.toLocaleString("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

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
  const availableCash = Math.max(metrics.cash * 1_000_000, 0);
  const projectedIncome = Math.max(metrics.sales * 150_000, 12_600_000);
  const pendingPayments = Math.max(availableCash * 0.44, 8_200_000);
  const days = cashDays(metrics.cash);
  const projectedBalance = Math.max(availableCash - pendingPayments + projectedIncome * 0.52, 0);
  const lowestPoint = Math.max(availableCash * 0.15, 2_800_000);
  const monthlyGoalText = formatGoal(monthlyGoal);
  const riskDate = "28 may 2026";

  const kpis = [
    {
      label: "Caja disponible",
      value: shortMoney(availableCash),
      helper: "Disponible en todas las cuentas",
      icon: WalletCards,
      tone: "purple",
      info: true
    },
    {
      label: "Días de caja",
      value: `${days} días`,
      helper: days >= 18 ? "Estable" : "Revisar esta semana",
      icon: CalendarDays,
      tone: "green",
      info: true
    },
    {
      label: "Ingresos esperados",
      value: shortMoney(projectedIncome),
      helper: "Próximos 7 días",
      icon: ArrowUpCircle,
      tone: "blue",
      info: true
    },
    {
      label: "Pagos pendientes",
      value: shortMoney(pendingPayments),
      helper: "3 vencen esta semana",
      icon: ArrowDownCircle,
      tone: "red",
      info: true
    }
  ];

  const upcomingPayments = [
    ["Nómina", "25 may", 6_200_000, "Próximo", "blue"],
    ["Arriendo", "28 may", 2_100_000, "Pendiente", "red"],
    ["Proveedor Café", "30 may", 4_800_000, "Programado", "purple"]
  ] as const;

  const receivables = [
    ["CO", "Café Oriente", 2_500_000, "15 días pendiente"],
    ["DH", "Dulce Hogar", 1_250_000, "8 días pendiente"],
    ["ML", "Mercado La 80", 980_000, "5 días pendiente"]
  ] as const;

  const accounts = [
    ["Bancolombia Ahorros", "•••• 2345", 8_450_000, "yellow"],
    ["Nequi", "•••• 5678", 3_200_000, "purple"],
    ["Daviplata", "•••• 9876", 1_800_000, "red"],
    ["Efectivo en caja", "", 5_000_000, "orange"]
  ] as const;

  const suggestions = [
    {
      label: "Optimización",
      title: "Reducir compras de inventario lento",
      text: "Puedes liberar hasta $1.200.000 esta semana.",
      tone: "blue",
      icon: TrendingUp
    },
    {
      label: "Riesgo",
      title: "Caja podría bajar bajo el mínimo recomendado",
      text: "Revisa los pagos del 28 al 30 de mayo.",
      tone: "red",
      icon: Bell
    },
    {
      label: "Oportunidad",
      title: "Cobrar 2 clientes mejora 5 días de caja",
      text: "Café Oriente y Dulce Hogar suman $3.750.000.",
      tone: "green",
      icon: CheckCircle2
    }
  ];

  return (
    <section className="cash-command-center dashboard-module-section" data-active={isActive}>
      <header className="cash-page-heading">
        <div>
          <h2>Caja</h2>
          <p>Controla tu dinero, proyecta tu flujo y toma mejores decisiones.</p>
        </div>
        <div className="cash-page-actions">
          <button className="cash-date-button" type="button"><CalendarRange aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="cash-icon-button" aria-label="Notificaciones" type="button"><Bell aria-hidden="true" /></button>
          <button className="primary-button cash-add-button" type="button"><Plus aria-hidden="true" />Movimiento</button>
        </div>
      </header>

      <div className="cash-kpi-row">
        {kpis.map((card) => {
          const Icon = card.icon;
          return (
            <article className="cash-kpi-card" data-tone={card.tone} key={card.label}>
              <span><Icon aria-hidden="true" /></span>
              <div>
                <small>{card.label} {card.info && <Info aria-hidden="true" />}</small>
                <strong>{card.value}</strong>
                <em>{card.helper}</em>
              </div>
            </article>
          );
        })}
      </div>

      <div className="cash-layout">
        <main className="cash-main-column">
          <article className="cash-ai-banner">
            <div className="cash-ai-orb" aria-hidden="true">
              <Sparkles />
              <i />
            </div>
            <div>
              <span>Copiloto de caja</span>
              <h3>Tu flujo de caja estará ajustado en 6 días.</h3>
              <p>Cobrar facturas pendientes y reducir compras no prioritarias esta semana.</p>
              <footer>
                <small>Impacto estimado:</small>
                <b>+8 días de caja</b>
              </footer>
            </div>
            <button className="primary-button" type="button">Ver acciones recomendadas</button>
          </article>

          <article className="cash-projection-card">
            <header>
              <strong>Proyección de caja <Info aria-hidden="true" /></strong>
              <div className="cash-chart-legend">
                <span data-tone="green">Estable</span>
                <span data-tone="amber">Atención</span>
                <span data-tone="red">Riesgo</span>
              </div>
            </header>

            <div className="cash-chart">
              <div className="cash-chart-scale"><span>$30M</span><span>$20M</span><span>$10M</span><span>$0</span></div>
              <svg viewBox="0 0 760 250" role="img" aria-label="Proyección de caja">
                <defs>
                  <linearGradient id="cashArea" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M18 72 C92 72 124 82 172 70 C218 91 270 88 324 88 C356 112 390 130 426 136 C470 168 500 205 548 198 C594 191 642 218 690 226 C716 228 738 227 748 226" fill="none" stroke="#22c55e" strokeWidth="4" />
                <path d="M324 88 C356 112 390 130 426 136" fill="none" stroke="#f59e0b" strokeWidth="5" />
                <path d="M426 136 C470 168 500 205 548 198 C594 191 642 218 690 226 C716 228 738 227 748 226" fill="none" stroke="#ef4444" strokeDasharray="10 10" strokeWidth="5" />
                <path d="M18 72 C92 72 124 82 172 70 C218 91 270 88 324 88 C356 112 390 130 426 136 L426 230 L18 230 Z" fill="url(#cashArea)" />
                <line x1="426" x2="426" y1="42" y2="232" stroke="#4f46e5" strokeDasharray="6 8" />
                <circle cx="426" cy="136" fill="#111827" r="5" />
              </svg>
              <div className="cash-chart-tooltip"><Bell aria-hidden="true" />La caja podría bajar peligrosamente el 28 de mayo.</div>
              <div className="cash-chart-dates"><span>14 may</span><span>17 may</span><span>20 may</span><span>23 may</span><span>26 may</span><span>29 may</span><span>1 jun</span><span>4 jun</span><span>7 jun</span><span>10 jun</span></div>
            </div>

            <div className="cash-projection-summary">
              <div><span>Saldo inicial (hoy)</span><strong>{shortMoney(availableCash)}</strong></div>
              <div><span>Saldo proyectado (30 días)</span><strong className="danger">{shortMoney(projectedBalance)}</strong></div>
              <div><span>Punto más bajo</span><strong className="danger">{shortMoney(lowestPoint)}</strong><small>{riskDate}</small></div>
            </div>
          </article>

          <section className="cash-suggestions">
            <header><strong>Sugerencias de Copiloto <Info aria-hidden="true" /></strong></header>
            <div>
              {suggestions.map((item) => {
                const Icon = item.icon;
                return (
                  <article data-tone={item.tone} key={item.title}>
                    <span><Icon aria-hidden="true" />{item.label}</span>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                    <button type="button">Ver detalle</button>
                  </article>
                );
              })}
            </div>
          </section>
        </main>

        <aside className="cash-side-column">
          <article className="cash-panel">
            <header><strong>Pagos próximos</strong><button type="button">Ver todos</button></header>
            <table>
              <thead><tr><th>Concepto</th><th>Fecha</th><th>Valor</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {upcomingPayments.map(([concept, date, value, status, tone]) => (
                  <tr key={concept}>
                    <td><span className="cash-table-icon"><Clock3 aria-hidden="true" /></span>{concept}</td>
                    <td>{date}</td>
                    <td>{shortMoney(value)}</td>
                    <td><mark data-tone={tone}>{status}</mark></td>
                    <td><button aria-label={`Opciones ${concept}`} type="button"><MoreHorizontal aria-hidden="true" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button className="cash-full-button" type="button"><CalendarDays aria-hidden="true" />Ver calendario completo</button>
          </article>

          <article className="cash-panel cash-receivables-panel">
            <header><strong>Cuentas por cobrar</strong><button type="button">Ver todas</button></header>
            <div className="cash-receivables-list">
              {receivables.map(([initials, name, value, delay]) => (
                <div key={name}>
                  <i>{initials}</i>
                  <span>{name}</span>
                  <strong>{shortMoney(value)}<small>{delay}</small></strong>
                  <button type="button">Cobrar</button>
                </div>
              ))}
            </div>
            <p><Sparkles aria-hidden="true" />Prioriza cobrar Café Oriente esta semana.</p>
          </article>

          <article className="cash-panel">
            <header><strong>Cuentas y medios de pago</strong><button type="button">Ver todas</button></header>
            <div className="cash-accounts-list">
              {accounts.map(([name, digits, value, tone]) => (
                <div key={name}>
                  <span data-tone={tone}><CreditCard aria-hidden="true" /></span>
                  <b>{name}</b>
                  <small>{digits}</small>
                  <strong>{shortMoney(value)}</strong>
                </div>
              ))}
            </div>
            <footer><span>Total disponible</span><strong>{shortMoney(availableCash)}</strong></footer>
          </article>

          <article className="cash-panel cash-context-panel">
            <header><strong>Lectura del negocio</strong></header>
            <p>Meta mensual: {monthlyGoalText}. Avance comercial: {Math.round(salesPercent)}%. {showMargin ? `Margen observado: ${metrics.margin.toFixed(1)}% vs meta ${marginRule}%.` : ""} {showStock ? `Inventario crítico: ${metrics.criticalStock}/${stockRule} SKU.` : ""}</p>
            <span><Banknote aria-hidden="true" />La caja disponible equivale a {days} días de operación.</span>
          </article>
        </aside>
      </div>
    </section>
  );
}
