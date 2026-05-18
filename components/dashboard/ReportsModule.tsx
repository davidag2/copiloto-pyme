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
  Lightbulb,
  PackageCheck,
  Plus,
  Sparkles,
  TrendingUp,
  TriangleAlert,
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

const topProducts = [
  ["Café Premium 500g", "$18.200.000", "1.125 unidades", "purple"],
  ["Panela Orgánica 500g", "$12.400.000", "875 unidades", "green"],
  ["Azúcar Integral 1kg", "$8.100.000", "645 unidades", "orange"]
];

const topClients = [
  ["CO", "Café Oriente", "18", "$3.800.000"],
  ["DH", "Dulce Hogar", "12", "$2.400.000"],
  ["ML", "Mercado La 80", "8", "$1.200.000"],
  ["TE", "Tiendas Express", "6", "$980.000"],
  ["DM", "Distribuciones MG", "5", "$850.000"]
];

const insights = [
  ["Oportunidad", "Las ventas por Instagram crecieron 32% este mes.", TrendingUp, "green"],
  ["Riesgo", "El flujo de caja podría verse afectado en junio.", TriangleAlert, "red"],
  ["Acción recomendada", "Reducir compras de productos con baja rotación.", Lightbulb, "blue"]
] satisfies Array<[string, string, LucideIcon, string]>;

const reportKpis: Array<{ label: string; value: string; trend: string; helper: string; icon: LucideIcon; tone: string }> = [
  { label: "Ventas del mes", value: "$48.600.000", trend: "18%", helper: "vs mes anterior", icon: Banknote, tone: "purple" },
  { label: "Utilidad estimada", value: "$12.400.000", trend: "8%", helper: "vs mes anterior", icon: WalletCards, tone: "green" },
  { label: "Caja disponible", value: "$18.450.000", trend: "Saludable", helper: "", icon: Camera, tone: "blue" },
  { label: "Productos vendidos", value: "2.845", trend: "unidades", helper: "", icon: PackageCheck, tone: "orange" }
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
            <h3>La IA detectó crecimiento en ventas y riesgo en flujo de caja.</h3>
            <div className="reports-ai-signals">
              <p><small>Ventas</small><b><ArrowUp aria-hidden="true" />18%</b></p>
              <p><small>Caja</small><b className="danger"><ArrowDown aria-hidden="true" />12%</b></p>
              <p><small>Inventario</small><b className="stable">Estable</b></p>
            </div>
            <button className="secondary-button" type="button" onClick={onGenerateReport}>Ver análisis completo <ChevronRight aria-hidden="true" /></button>
          </div>
        </article>

        {reportKpis.map(({ label, value, trend, helper, icon: KpiIcon, tone }) => {
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
          <svg viewBox="0 0 860 280" aria-label="Evolución del negocio">
            <path d="M20 190 C90 120 130 150 178 112 C246 162 292 138 344 142 C408 132 438 160 498 148 C560 130 612 120 672 116 C730 84 766 150 840 122" fill="none" stroke="#4f46e5" strokeWidth="4" />
            <path d="M20 220 C90 190 130 204 178 170 C246 188 292 180 344 174 C408 164 438 198 498 186 C560 180 612 164 672 150 C730 190 766 202 840 182" fill="none" stroke="#22c55e" strokeWidth="4" />
            <path d="M20 246 C90 230 130 232 178 224 C246 226 292 228 344 222 C408 216 438 230 498 222 C560 214 612 212 672 204 C730 222 766 230 840 216" fill="none" stroke="#2563eb" strokeWidth="4" />
          </svg>
        </section>

        <section className="reports-products-card">
          <header><strong>Productos más vendidos</strong><button type="button">Ver todos</button></header>
          {topProducts.map(([name, total, units, tone], index) => (
            <article data-tone={tone} key={name}>
              <i>{index + 1}</i>
              <span><Box aria-hidden="true" /></span>
              <div><strong>{name}</strong><b /></div>
              <p><strong>{total}</strong><small>{units}</small></p>
            </article>
          ))}
        </section>
      </div>

      <div className="reports-bottom-grid">
        <section className="reports-clients-card">
          <header><strong>Clientes top</strong><button type="button">Ver todos</button></header>
          <table>
            <thead><tr><th>Cliente</th><th>Compras</th><th>Total comprado</th></tr></thead>
            <tbody>
              {topClients.map(([initials, name, buys, total]) => (
                <tr key={name}><td><i>{initials}</i>{name}</td><td>{buys}</td><td>{total}</td></tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="reports-finance-card">
          <header><strong>Resumen financiero</strong></header>
          <div>
            <article><Banknote aria-hidden="true" /><span>Ingresos</span><strong>$48.600.000</strong><small>↑ 18%</small></article>
            <article><WalletCards aria-hidden="true" /><span>Gastos</span><strong>$36.200.000</strong><small className="danger">↓ 5%</small></article>
            <article><TrendingUp aria-hidden="true" /><span>Margen bruto</span><strong>$12.400.000</strong><small>↑ 8%</small></article>
            <article><Download aria-hidden="true" /><span>IVA por pagar</span><strong>$2.150.000</strong><small>0%</small></article>
          </div>
        </section>

        <section className="reports-insights-card">
          <header><strong>Insights de la IA</strong><button type="button">Ver todos</button></header>
          {insights.map(([label, text, InsightIcon, tone]) => {
            return (
              <article data-tone={tone} key={String(text)}>
                <span><InsightIcon aria-hidden="true" /></span>
                <div><strong>{label}</strong><p>{text}</p></div>
                <ChevronRight aria-hidden="true" />
              </article>
            );
          })}
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
