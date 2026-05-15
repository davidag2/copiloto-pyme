"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { FileText } from "lucide-react";

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

function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" />
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  );
}

export function ReportsModule({
  isActive,
  showReports,
  reportSettings,
  report,
  dateRangeLabel,
  salesReportHighlights,
  microAction,
  canGenerateReports,
  onReportSettingsChange,
  onGenerateReport,
  onDownloadReport,
  formatCop
}: ReportsModuleProps) {
  if (!isActive || !showReports) return null;

  return (
    <section className="reports-panel dashboard-module-section">
      <div className="panel-heading">
        <div><span><FileText aria-hidden="true" />Reportes automáticos</span><h2>Envíos para gerencia</h2></div>
        <button className="primary-button micro-button" data-motion={microAction === "report" ? "active" : undefined} type="button" onClick={onGenerateReport} disabled={!canGenerateReports}>
          <FileText aria-hidden="true" />Generar reporte
        </button>
      </div>
      <div className="reports-layout">
        <div className="reports-sidebar">
          <form className="report-settings">
            <label>
              Frecuencia
              <select value={reportSettings.frequency} onChange={(event) => onReportSettingsChange({ ...reportSettings, frequency: event.target.value })}>
                <option>Diario</option>
                <option>Semanal</option>
                <option>Mensual</option>
              </select>
            </label>
            <label>
              Canal
              <select value={reportSettings.channel} onChange={(event) => onReportSettingsChange({ ...reportSettings, channel: event.target.value })}>
                <option>Email</option>
                <option>WhatsApp</option>
                <option>Email y WhatsApp</option>
              </select>
            </label>
            <label>
              Destinatario
              <input value={reportSettings.recipient} onChange={(event) => onReportSettingsChange({ ...reportSettings, recipient: event.target.value })} />
            </label>
            <button className="secondary-button" type="button" onClick={onDownloadReport}><FileText aria-hidden="true" />Descargar TXT</button>
          </form>
          <div className="sales-report-breakdown">
            <div className="preview-heading"><span>Ventas del rango</span><strong>{dateRangeLabel}</strong></div>
            {salesReportHighlights.map((group) => (
              <article className="sales-report-group" key={group.type}>
                <strong>{group.label}</strong>
                {group.rows.length ? group.rows.map((row) => (
                  <div className="sales-report-row" key={`${group.type}-${row.name}`}>
                    <span>{row.name}</span>
                    <small>{formatCop(row.total)} · {row.orders} ventas{row.quantity ? ` · ${Number(row.quantity).toFixed(0)} unidades` : ""}</small>
                  </div>
                )) : <small>Sin datos en el rango.</small>}
              </article>
            ))}
          </div>
        </div>
        <div className="report-preview" data-motion={microAction === "report" ? "active" : undefined}>
          <div className="preview-heading"><span>Vista previa</span><strong>Programado {reportSettings.frequency.toLowerCase()}</strong></div>
          {report ? <pre>{report}</pre> : (
            <EmptyState
              icon={FileText}
              title="Todavía no hay reportes"
              text="Genera el primer resumen ejecutivo para revisar ventas, caja, alertas y decisiones abiertas en un solo documento."
              action={<button className="primary-button" type="button" onClick={onGenerateReport} disabled={!canGenerateReports}>Generar primer reporte</button>}
            />
          )}
        </div>
      </div>
    </section>
  );
}
