"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Database, Link2, RefreshCw, Settings2, Upload } from "lucide-react";

type DashboardVisibility = {
  sales: boolean;
  cash: boolean;
  margin: boolean;
  stock: boolean;
  importer: boolean;
  products: boolean;
  copilot: boolean;
  decisions: boolean;
  integrations: boolean;
  reports: boolean;
};

type Integration = {
  id: string;
  name: string;
  category: string;
  status: "Disponible" | "Conectado";
  sync: string;
};

type CsvColumnMapping = {
  fecha: string;
  cliente: string;
  producto: string;
  ventas: string;
  cantidad: string;
  precio: string;
  descuento: string;
  stock: string;
  caja: string;
  gastos: string;
  margen: string;
  canal: string;
  vendedor: string;
  metodoPago: string;
  estadoPago: string;
};

type ImportBatch = {
  id: string;
  fileName: string | null;
  rowCount: number;
  validCount: number;
  errorCount: number;
  duplicateCount: number;
  status: string;
  createdAt: string;
  reversedAt?: string | null;
};

type ImportValidation = {
  errors: Array<{ rowNumber: number; errors: string[]; raw: Record<string, string> }>;
  sample: Array<Record<string, unknown>>;
};

type SettingsModuleProps = {
  isActive: boolean;
  focus: string;
  visible: DashboardVisibility;
  integrations: Integration[];
  connectedIntegrations: number;
  activeIntegrationId: string;
  canManageIntegrations: boolean;
  canImportData: boolean;
  microAction: string | null;
  importStatus: string;
  importPreview: string;
  csvMapping: CsvColumnMapping;
  csvHeaders: string[];
  csvRows: Array<Record<string, string>>;
  importValidation: ImportValidation | null;
  importHistory: ImportBatch[];
  onFocusChange: (focus: string) => void;
  onVisibleChange: (visible: DashboardVisibility) => void;
  onSyncIntegrations: () => void;
  onConnectIntegration: (id: string) => void;
  onCsvMappingChange: (field: keyof CsvColumnMapping, value: string) => void;
  onApplyCsvImport: () => void;
  onDownloadTemplate: () => void;
  onRefreshImportHistory: () => void;
  onReverseImport: (batchId: string) => void;
};

const visibilityLabels: Record<keyof DashboardVisibility, string> = {
  sales: "Ventas",
  cash: "Caja",
  margin: "Margen",
  stock: "Inventario crítico",
  importer: "Importador CSV",
  products: "Productos",
  copilot: "Copiloto IA",
  decisions: "Decisiones",
  integrations: "Integraciones",
  reports: "Reportes"
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

export function SettingsModule({
  isActive,
  focus,
  visible,
  integrations,
  connectedIntegrations,
  activeIntegrationId,
  canManageIntegrations,
  canImportData,
  microAction,
  importStatus,
  importPreview,
  csvMapping,
  csvHeaders,
  csvRows,
  importValidation,
  importHistory,
  onFocusChange,
  onVisibleChange,
  onSyncIntegrations,
  onConnectIntegration,
  onCsvMappingChange,
  onApplyCsvImport,
  onDownloadTemplate,
  onRefreshImportHistory,
  onReverseImport
}: SettingsModuleProps) {
  return (
    <section className="settings-command-center dashboard-module-section" data-active={isActive}>
      <section className="customizer-panel">
        <div className="panel-heading">
          <div><span><Settings2 aria-hidden="true" />Dashboard personalizable</span><h2>Elige qué ve cada usuario</h2></div>
          <select value={focus} onChange={(event) => onFocusChange(event.target.value)}>
            <option value="owner">Propietario / Gerencia</option>
            <option value="admin">Administrador</option>
            <option value="finance">Contador</option>
            <option value="sales">Ventas</option>
          </select>
        </div>
        <div className="customizer-grid">
          {(Object.keys(visible) as Array<keyof DashboardVisibility>).map((key) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={visible[key]}
                onChange={(event) => onVisibleChange({ ...visible, [key]: event.target.checked })}
              />
              {visibilityLabels[key]}
            </label>
          ))}
        </div>
      </section>

      <section className="integrations-panel">
        <div className="panel-heading">
          <div><span><Link2 aria-hidden="true" />Integraciones latinoamericanas</span><h2>Conecta tus fuentes de datos</h2></div>
          <button className="primary-button micro-button" data-motion={microAction === "sync" ? "active" : undefined} type="button" onClick={onSyncIntegrations} disabled={!canManageIntegrations}>
            <RefreshCw aria-hidden="true" />Sincronizar
          </button>
        </div>
        {connectedIntegrations === 0 && (
          <EmptyState
            icon={Link2}
            title="Aún no hay integraciones conectadas"
            text="Conecta tu primera fuente para que ventas, caja e inventario empiecen a actualizarse con menos trabajo manual."
            action={<button className="primary-button" type="button" onClick={() => onConnectIntegration("sheets")} disabled={!canManageIntegrations}>Conectar Google Sheets</button>}
          />
        )}
        <div className="integrations-grid">
          {integrations.map((integration) => (
            <article className="integration-card" data-future={integration.id === "banking"} data-motion={activeIntegrationId === integration.id ? "active" : undefined} data-status={integration.status} key={integration.id}>
              <div><span><Database aria-hidden="true" />{integration.category}</span><strong>{integration.name}</strong><small>{integration.sync}</small></div>
              <button className="secondary-button micro-button" data-motion={activeIntegrationId === integration.id ? "active" : undefined} type="button" onClick={() => onConnectIntegration(integration.id)} disabled={integration.id === "banking" || !canManageIntegrations}>
                {integration.id === "banking" ? "Próximamente" : integration.status === "Conectado" ? "Reconectar" : "Conectar"}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="importer-panel">
        <div className="panel-heading"><div><span><Upload aria-hidden="true" />Importador real CSV</span><h2>Ventas, caja, gastos e inventario</h2></div><strong>{importStatus}</strong></div>
        <div className="importer-grid">
          <div>
            <p>Mapea las columnas del archivo para detectar errores, duplicados y guardar solo filas válidas.</p>
            <div className="mapping-grid">
              {(Object.keys(csvMapping) as Array<keyof CsvColumnMapping>).map((field) => (
                <label key={field}>
                  {field}
                  <select value={csvMapping[field]} onChange={(event) => onCsvMappingChange(field, event.target.value)}>
                    <option value="">No mapear</option>
                    {csvHeaders.map((header) => <option value={header} key={header}>{header}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className={`import-validation ${importValidation?.errors.length ? "has-errors" : ""}`}>{importPreview}</div>
          </div>
          <div className="preview-box">
            <div className="preview-heading">
              <span>Vista previa y validación</span>
              <button className="primary-button" type="button" onClick={onApplyCsvImport} disabled={!canImportData || !csvRows.length}>
                <Database aria-hidden="true" />Aplicar importación
              </button>
            </div>
            <div className="preview-table">
              {csvRows.length ? (
                <table>
                  <thead><tr>{csvHeaders.slice(0, 5).map((header) => <th key={header}>{header}</th>)}</tr></thead>
                  <tbody>{csvRows.slice(0, 4).map((row, index) => <tr key={`${row[csvHeaders[0]]}-${index}`}>{csvHeaders.slice(0, 5).map((header) => <td key={header}>{row[header]}</td>)}</tr>)}</tbody>
                </table>
              ) : (
                <EmptyState
                  icon={Upload}
                  title="Carga tu primer archivo"
                  text="Importa un CSV para mapear columnas, detectar errores por fila y guardar datos reales en esta empresa."
                  action={<button className="secondary-button" type="button" onClick={onDownloadTemplate}>Descargar plantilla CSV</button>}
                />
              )}
            </div>
            {importValidation?.errors.length ? <div className="row-errors">{importValidation.errors.slice(0, 5).map((error) => <span key={error.rowNumber}>Fila {error.rowNumber}: {error.errors.join(", ")}</span>)}</div> : null}
          </div>
        </div>
        <div className="import-history">
          <div className="preview-heading"><span>Historial de cargas</span><button className="secondary-button" type="button" onClick={onRefreshImportHistory}>Actualizar historial</button></div>
          <div className="history-list">
            {importHistory.length ? importHistory.map((batch) => (
              <article key={batch.id} data-status={batch.status}>
                <div><strong>{batch.fileName || "CSV sin nombre"}</strong><span>{batch.validCount}/{batch.rowCount} válidas · {batch.errorCount} errores · {batch.duplicateCount} duplicados</span></div>
                <small>{new Date(batch.createdAt).toLocaleString("es-CO")} · {batch.status}</small>
                <button className="secondary-button" type="button" disabled={batch.status === "reversed"} onClick={() => onReverseImport(batch.id)}>Reversar</button>
              </article>
            )) : (
              <EmptyState
                icon={Database}
                title="Sin historial de cargas"
                text="Cuando apliques una importación, aquí verás filas válidas, errores, duplicados y la opción de reversar."
              />
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
