"use client";

import {
  ArrowDown,
  ArrowUp,
  Banknote,
  Box,
  CalendarDays,
  Camera,
  ChevronRight,
  Download,
  Filter,
  PackageCheck,
  Plus,
  Sparkles,
  TrendingUp,
  Users,
  WalletCards
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ReportSettings = {
  frequency: string;
  channel: string;
  recipient: string;
};

type SalesReportHighlight = {
  type: "vendedor" | "producto" | "cliente" | "canal";
  label: string;
  rows: Array<{
    type: "vendedor" | "producto" | "cliente" | "canal";
    name: string;
    total: string | number;
    orders: number;
    quantity?: string | number | null;
  }>;
};

type ReportsModuleProps = {
  isActive: boolean;
  showReports: boolean;
  reportSettings: ReportSettings;
  report: string;
  dateRangeLabel: string;
  salesReportHighlights: SalesReportHighlight[];
  microAction: string | null;
  canGenerateReports: boolean;
  onReportSettingsChange: (settings: ReportSettings) => void;
  onGenerateReport: () => void;
  onDownloadReport: () => void;
  formatCop: (value: string | number) => string;
};

const topProducts: string[][] = [];

const topClients: string[][] = [];

const insights: Array<[string, string, LucideIcon, string]> = [];

const reportKpis: Array<{ label: string; value: string; trend: string; helper: string; icon: LucideIcon; tone: string }> = [
  { label: "Ventas del mes", value: "$0", trend: "Sin datos", helper: "", icon: Banknote, tone: "purple" },
  { label: "Utilidad estimada", value: "$0", trend: "Sin datos", helper: "", icon: WalletCards, tone: "green" },
  { label: "Caja disponible", value: "$0", trend: "Sin datos", helper: "", icon: Camera, tone: "blue" },
  { label: "Productos vendidos", value: "0", trend: "unidades", helper: "", icon: PackageCheck, tone: "orange" }
];

const quickReports: Array<{ title: string; text: string; icon: LucideIcon }> = [
  { title: "Ventas", text: "Análisis de ventas", icon: Banknote },
  { title: "Financiero", text: "Estado financiero", icon: TrendingUp },
  { title: "Inventario", text: "Rotación y stock", icon: PackageCheck },
  { title: "Clientes", text: "Análisis de clientes", icon: Users },
  { title: "Cartera", text: "Cuentas por cobrar", icon: WalletCards }
];

export function ReportsModule({
  isActive,
  showReports,
  onGenerateReport,
  onDownloadReport
}: ReportsModuleProps) {
  if (!isActive || !showReports) return null;
  const productRows: typeof topProducts = [];
  const clientRows: typeof topClients = [];
  const insightRows: typeof insights = [];
  const zeroReportKpis = reportKpis.map((card) => ({
    ...card,
    helper: "",
    trend: card.label === "Productos vendidos" ? "unidades" : "Sin datos",
    value: card.label === "Productos vendidos" ? "0" : "$0"
  }));

  return (
    <section className="reports-command-center dashboard-module-section">
      <header className="reports-page-heading">
        <div>
          <h2>Reportes</h2>
          <p>Entiende tu negocio con datos claros y toma mejores decisiones.</p>
        </div>
        <div className="reports-page-actions">
          <button className="reports-date-button" type="button"><CalendarDays aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="reports-filter-button" type="button"><Filter aria-hidden="true" />Filtros</button>
          <button className="primary-button" type="button" onClick={onDownloadReport}><Download aria-hidden="true" />Exportar</button>
        </div>
      </header>

      <div className="reports-top-grid">
        <article className="reports-ai-card">
          <div className="reports-ai-orb"><Sparkles aria-hidden="true" /></div>
          <div>
            <span>Copiloto de reportes</span>
            <h3>Reportes empieza en cero: carga datos para activar análisis reales.</h3>
            <div className="reports-ai-signals">
              <p><small>Ventas</small><b><ArrowUp aria-hidden="true" />0%</b></p>
              <p><small>Caja</small><b className="danger"><ArrowDown aria-hidden="true" />0%</b></p>
              <p><small>Inventario</small><b className="stable">Sin datos</b></p>
            </div>
            <button className="secondary-button" type="button" onClick={onGenerateReport}>Ver análisis completo <ChevronRight aria-hidden="true" /></button>
          </div>
        </article>

        {zeroReportKpis.map(({ label, value, trend, helper, icon: KpiIcon, tone }) => {
          return (
            <article className="reports-kpi-card" data-tone={tone} key={String(label)}>
              <span><KpiIcon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{trend} {helper}</em>
              <svg viewBox="0 0 160 54" aria-hidden="true"><path d="M4 40 C24 34 28 22 42 30 C58 38 66 18 82 26 C98 34 108 22 122 18 C138 10 146 20 156 14" fill="none" stroke="currentColor" strokeWidth="4" /></svg>
            </article>
          );
        })}
      </div>

      <div className="reports-main-grid">
        <section className="reports-evolution-card">
          <header>
            <strong>Evolución del negocio</strong>
            <div><button type="button">7 días</button><button className="active" type="button">30 días</button><button type="button">3 meses</button><button type="button">1 año</button></div>
          </header>
          <div className="reports-legend"><span>Ventas</span><span>Utilidad</span><span>Caja</span></div>
          <svg viewBox="0 0 860 280" aria-label="Evolución del negocio sin datos">
            <path d="M20 236 H840" fill="none" stroke="#4f46e5" strokeDasharray="10 12" strokeWidth="4" />
            <path d="M20 248 H840" fill="none" stroke="#22c55e" strokeDasharray="10 12" strokeWidth="4" />
            <path d="M20 260 H840" fill="none" stroke="#2563eb" strokeDasharray="10 12" strokeWidth="4" />
          </svg>
          <p className="module-empty-note">Sin evolución para mostrar. Este gráfico se activará cuando existan datos de ventas, utilidad y caja.</p>
        </section>

        <section className="reports-products-card">
          <header><strong>Productos más vendidos</strong><button type="button">Ver todos</button></header>
          {productRows.map(([name, total, units, tone], index) => (
            <article data-tone={tone} key={name}>
              <i>{index + 1}</i>
              <span><Box aria-hidden="true" /></span>
              <div><strong>{name}</strong><b /></div>
              <p><strong>{total}</strong><small>{units}</small></p>
            </article>
          ))}
          {!productRows.length ? <p className="module-empty-note">Sin productos vendidos. Los rankings aparecerán cuando existan ventas reales.</p> : null}
        </section>
      </div>

      <div className="reports-bottom-grid">
        <section className="reports-clients-card">
          <header><strong>Clientes top</strong><button type="button">Ver todos</button></header>
          <table>
            <thead><tr><th>Cliente</th><th>Compras</th><th>Total comprado</th></tr></thead>
            <tbody>
              {clientRows.map(([initials, name, buys, total]) => (
                <tr key={name}><td><i>{initials}</i>{name}</td><td>{buys}</td><td>{total}</td></tr>
              ))}
              {!clientRows.length ? <tr><td colSpan={3}><p className="module-empty-note">Sin clientes para reportar todavía.</p></td></tr> : null}
            </tbody>
          </table>
        </section>

        <section className="reports-finance-card">
          <header><strong>Resumen financiero</strong></header>
          <div>
            <article><Banknote aria-hidden="true" /><span>Ingresos</span><strong>$0</strong><small>Sin datos</small></article>
            <article><WalletCards aria-hidden="true" /><span>Gastos</span><strong>$0</strong><small>Sin datos</small></article>
            <article><TrendingUp aria-hidden="true" /><span>Margen bruto</span><strong>$0</strong><small>Sin datos</small></article>
            <article><Download aria-hidden="true" /><span>IVA por pagar</span><strong>$0</strong><small>Sin datos</small></article>
          </div>
        </section>

        <section className="reports-insights-card">
          <header><strong>Insights de la IA</strong><button type="button">Ver todos</button></header>
          {insightRows.map(([label, text, InsightIcon, tone]) => {
            return (
              <article data-tone={tone} key={String(text)}>
                <span><InsightIcon aria-hidden="true" /></span>
                <div><strong>{label}</strong><p>{text}</p></div>
                <ChevronRight aria-hidden="true" />
              </article>
            );
          })}
          {!insightRows.length ? <p className="module-empty-note">La IA generará insights cuando haya datos suficientes en ventas, caja, inventario y clientes.</p> : null}
        </section>
      </div>

      <section className="reports-quick-card">
        <header><strong>Reportes rápidos</strong></header>
        <div>
          {quickReports.map(({ title, text, icon: QuickIcon }) => {
            return <button type="button" key={String(title)}><QuickIcon aria-hidden="true" /><span>{title}</span><small>{text}</small></button>;
          })}
          <button className="dashed" type="button"><Plus aria-hidden="true" /><span>Crear reporte</span><small>Personalizado</small></button>
        </div>
      </section>
    </section>
  );
}
