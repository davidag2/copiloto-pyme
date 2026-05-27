"use client";

import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Bell,
  Brain,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Clock3,
  CreditCard,
  Database,
  Info,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Sparkles,
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
  formatGoal,
  cashDays
}: CashModuleProps) {
  const hasCashData = metrics.cash > 0 || metrics.sales > 0;
  const availableCash = Math.max(metrics.cash * 1_000_000, 0);
  const projectedIncome = hasCashData ? Math.max(metrics.sales * 150_000, 0) : 0;
  const pendingPayments = hasCashData ? Math.max(availableCash * 0.44, 0) : 0;
  const receivablesTotal = hasCashData ? Math.max(projectedIncome * 0.38, 0) : 0;
  const expensesNextWeek = hasCashData ? Math.max(pendingPayments * 0.72, 0) : 0;
  const bankedCash = hasCashData ? Math.max(availableCash * 0.73, 0) : 0;
  const physicalCash = Math.max(availableCash - bankedCash, 0);
  const days = cashDays(metrics.cash);
  const projectedBalance = Math.max(availableCash - pendingPayments + projectedIncome * 0.52, 0);
  const lowestPoint = hasCashData ? Math.max(availableCash * 0.15, 0) : 0;
  const monthlyGoalText = formatGoal(monthlyGoal);
  const riskDate = "28 may 2026";

  const kpis = [
    {
      label: "Caja disponible",
      value: shortMoney(availableCash),
      helper: "Bancos y efectivo",
      icon: WalletCards,
      tone: "purple"
    },
    {
      label: "Días de caja",
      value: `${days} días`,
      helper: days >= 18 ? "Flujo estable" : "Requiere acción",
      icon: CalendarDays,
      tone: days >= 18 ? "green" : "red"
    },
    {
      label: "Ingresos esperados",
      value: shortMoney(projectedIncome),
      helper: "Próximos 7 días",
      icon: ArrowUpCircle,
      tone: "blue"
    },
    {
      label: "Egresos próximos",
      value: shortMoney(expensesNextWeek),
      helper: "Pagos por priorizar",
      icon: ArrowDownCircle,
      tone: "red"
    }
  ];

  const upcomingPayments = hasCashData ? [
    ["Nómina", "25 may", 6_200_000, "Próximo", "blue"],
    ["Arriendo", "28 may", 2_100_000, "Pendiente", "red"],
    ["Proveedor Café", "30 may", 4_800_000, "Programado", "purple"]
  ] as const : [];

  const receivables = hasCashData ? [
    ["CO", "Café Oriente", 2_500_000, "15 días pendiente"],
    ["DH", "Dulce Hogar", 1_250_000, "8 días pendiente"],
    ["ML", "Mercado La 80", 980_000, "5 días pendiente"]
  ] as const : [];

  const accounts = hasCashData ? [
    ["Bancolombia Ahorros", "**** 2345", 8_450_000, "yellow"],
    ["Nequi", "**** 5678", 3_200_000, "purple"],
    ["Daviplata", "**** 9876", 1_800_000, "red"],
    ["Efectivo en caja", "", 5_000_000, "orange"]
  ] as const : [];

  const suggestions = hasCashData ? [
    {
      label: "Optimización",
      title: "Reducir compras de baja rotación",
      text: "Puedes liberar hasta $1.200.000 esta semana sin afectar ventas.",
      tone: "blue",
      icon: TrendingUp
    },
    {
      label: "Riesgo",
      title: "Caja podría bajar del mínimo recomendado",
      text: "Revisa egresos del 28 al 30 de mayo antes de aprobar nuevos pagos.",
      tone: "red",
      icon: Bell
    },
    {
      label: "Oportunidad",
      title: "Cobrar 2 clientes mejora 5 días de caja",
      text: "Café Oriente y Dulce Hogar suman $3.750.000 por recuperar.",
      tone: "green",
      icon: CheckCircle2
    }
  ] : [];
  const cashSuggestions: typeof suggestions = [];
  const cashUpcomingPayments: Array<readonly [string, string, number, string, string]> = [];
  const cashReceivables: Array<readonly [string, string, number, string]> = [];
  const cashAccounts: Array<readonly [string, string, number, string]> = [];

  const aiSignals = [
    { label: "Ingresos", value: shortMoney(projectedIncome), helper: "ventas esperadas y cartera recuperable", icon: ArrowUpCircle },
    { label: "Egresos", value: shortMoney(pendingPayments), helper: "pagos próximos y gastos no prioritarios", icon: ArrowDownCircle },
    { label: "Cartera", value: shortMoney(receivablesTotal), helper: "clientes pendientes por cobrar", icon: CreditCard },
    { label: "Bancos", value: shortMoney(bankedCash), helper: "dinero disponible por cuenta", icon: Banknote }
  ];

  return (
    <section className="cash-command-center dashboard-module-section" data-active={isActive}>
      <header className="cash-page-heading">
        <div>
          <h2>Caja</h2>
          <p>Controla ingresos, egresos, cuentas por cobrar, pagos próximos, bancos y flujo disponible para que la IA priorice qué decisión financiera tomar hoy.</p>
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
                <small>{card.label} <Info aria-hidden="true" /></small>
                <strong>{card.value}</strong>
                <em>{card.helper}</em>
              </div>
            </article>
          );
        })}
      </div>

      <article className="cash-ai-decision-banner">
        <div className="cash-ai-orb" aria-hidden="true">
          <Sparkles />
          <i />
        </div>
        <div>
          <span>Motor de sugerencias OpenAI para caja</span>
          <h3>{hasCashData ? "La IA revisa tu dinero y te dice qué pagar, qué cobrar y qué aplazar." : "Caja empieza en cero: registra ingresos, egresos y bancos para activar decisiones financieras."}</h3>
          <p>Copiloto Pyme cruza ingresos esperados, egresos próximos, cartera por cobrar, bancos y días de caja para evitar quedarte sin flujo.</p>
        </div>
        <aside>
          <small>Decisión recomendada</small>
          <strong>{hasCashData ? "Cobrar cartera antes de aprobar compras nuevas" : "Carga caja para recibir la primera recomendación"}</strong>
          <p>{hasCashData ? "Impacto: +5 a +8 días de caja disponible." : "Puedes importar un Excel desde Datos o registrar movimientos manuales."}</p>
          <button className="primary-button" type="button">Ver acciones recomendadas</button>
        </aside>
      </article>

      <section className="cash-ai-signal-grid" aria-label="Datos de caja que usa OpenAI">
        <article className="cash-ai-signal-intro">
          <Brain aria-hidden="true" />
          <div>
            <small>Datos que mejoran las decisiones de caja</small>
            <h3>Mientras más completo esté Caja, mejores serán las recomendaciones en Inicio.</h3>
            <p>La IA necesita saber cuánto entra, cuánto sale, qué clientes deben, qué pagos vencen y dónde está el dinero.</p>
          </div>
        </article>
        {aiSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <article className="cash-ai-signal-card" key={signal.label}>
              <Icon aria-hidden="true" />
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <small>{signal.helper}</small>
            </article>
          );
        })}
      </section>

      <div className="cash-layout">
        <main className="cash-main-column">
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
              <div><span>Saldo inicial</span><strong>{shortMoney(availableCash)}</strong></div>
              <div><span>Saldo proyectado</span><strong className="danger">{shortMoney(projectedBalance)}</strong></div>
              <div><span>Punto más bajo</span><strong className="danger">{shortMoney(lowestPoint)}</strong><small>{riskDate}</small></div>
            </div>
          </article>

          <section className="cash-suggestions">
            <header><strong>Sugerencias de Copiloto <Info aria-hidden="true" /></strong></header>
            <div>
              {cashSuggestions.map((item) => {
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
              {!cashSuggestions.length ? <p className="module-empty-note">La IA generará sugerencias cuando registres ingresos, egresos, cartera y bancos.</p> : null}
            </div>
          </section>
        </main>

        <aside className="cash-side-column">
          <article className="cash-panel">
            <header><strong>Pagos próximos</strong><button type="button">Ver todos</button></header>
            <table>
              <thead><tr><th>Concepto</th><th>Fecha</th><th>Valor</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {cashUpcomingPayments.map(([concept, date, value, status, tone]) => (
                  <tr key={concept}>
                    <td><span className="cash-table-icon"><Clock3 aria-hidden="true" /></span>{concept}</td>
                    <td>{date}</td>
                    <td>{shortMoney(value)}</td>
                    <td><mark data-tone={tone}>{status}</mark></td>
                    <td><button aria-label={`Opciones ${concept}`} type="button"><MoreHorizontal aria-hidden="true" /></button></td>
                  </tr>
                ))}
                {!cashUpcomingPayments.length ? <tr><td colSpan={5}><p className="module-empty-note">Sin pagos próximos registrados.</p></td></tr> : null}
              </tbody>
            </table>
            <button className="cash-full-button" type="button"><CalendarDays aria-hidden="true" />Ver calendario completo</button>
          </article>

          <article className="cash-panel cash-receivables-panel">
            <header><strong>Cuentas por cobrar</strong><button type="button">Ver todas</button></header>
            <div className="cash-receivables-list">
              {cashReceivables.map(([initials, name, value, delay]) => (
                <div key={name}>
                  <i>{initials}</i>
                  <span>{name}</span>
                  <strong>{shortMoney(value)}<small>{delay}</small></strong>
                  <button type="button">Cobrar</button>
                </div>
              ))}
              {!cashReceivables.length ? <p className="module-empty-note">No hay cuentas por cobrar registradas.</p> : null}
            </div>
            <p><Sparkles aria-hidden="true" />{hasCashData ? "Prioriza los cobros con mayor impacto en caja." : "La IA activará prioridades cuando haya cartera registrada."}</p>
          </article>

          <article className="cash-panel">
            <header><strong>Bancos y medios de pago</strong><button type="button">Ver todos</button></header>
            <div className="cash-accounts-list">
              {cashAccounts.map(([name, digits, value, tone]) => (
                <div key={name}>
                  <span data-tone={tone}><CreditCard aria-hidden="true" /></span>
                  <b>{name}</b>
                  <small>{digits}</small>
                  <strong>{shortMoney(value)}</strong>
                </div>
              ))}
              {!cashAccounts.length ? <p className="module-empty-note">Sin bancos o efectivo registrados.</p> : null}
            </div>
            <footer><span>Total disponible</span><strong>{shortMoney(availableCash)}</strong></footer>
          </article>

          <article className="cash-panel cash-context-panel">
            <header><strong>Contexto para decisiones</strong></header>
            <p>Meta mensual: {monthlyGoalText}. Avance comercial: {Math.round(salesPercent)}%. {showMargin ? `Margen observado: ${metrics.margin.toFixed(1)}% vs meta ${marginRule}%.` : ""} {showStock ? `Inventario crítico: ${metrics.criticalStock}/${stockRule} SKU.` : ""}</p>
            <span><ShieldCheck aria-hidden="true" />La caja disponible equivale a {days} días de operación.</span>
            <span><Database aria-hidden="true" />Bancos: {shortMoney(bankedCash)} · Efectivo: {shortMoney(physicalCash)}</span>
          </article>
        </aside>
      </div>
    </section>
  );
}
