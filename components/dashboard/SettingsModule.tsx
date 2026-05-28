"use client";

import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Brain,
  Building2,
  CalendarDays,
  ChevronRight,
  Crown,
  FileText,
  HelpCircle,
  Mail,
  Plus,
  Settings2,
  Sparkles,
  Table2,
  Users,
  WalletCards
} from "lucide-react";

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

type CompanySettings = {
  ownerName: string;
  ownerEmail: string;
  companyName: string;
  country: string;
  plan: string;
  businessType: string;
  currency: string;
  monthlyGoal: number;
  minimumStock: number;
  dataSource: string;
};

type SettingsModuleProps = {
  isActive: boolean;
  customer: CompanySettings;
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
  onCustomerChange: (customer: CompanySettings) => void;
};

const users: Array<[string, string, string, string, string]> = [];

const notificationChannels: Array<[string, string, string, LucideIcon]> = [
  ["WhatsApp", "Sin configurar", "green", Bell],
  ["Email", "Sin configurar", "blue", Mail],
  ["Alertas de IA", "Sin configurar", "purple", Sparkles]
];

const integrationIcons: Record<string, LucideIcon> = {
  sheets: Table2,
  whatsapp: Bell,
  siigo: FileText,
  banking: WalletCards
};

const aiPreferences: Array<[string, string, LucideIcon]> = [
  ["Resumen ejecutivo diario", "Pendiente de configurar", CalendarDays],
  ["Alertas automáticas", "Pendiente de configurar", Bell],
  ["Recomendaciones IA", "Pendiente de configurar", Sparkles]
];

export function SettingsModule({
  isActive,
  customer,
  integrations,
  canManageIntegrations,
  microAction,
  onCustomerChange,
  onConnectIntegration,
  onSyncIntegrations
}: SettingsModuleProps) {
  const visibleIntegrations = integrations.filter((integration) => integration.id !== "banking").slice(0, 3);
  const [editingCompany, setEditingCompany] = useState(false);
  const companyPlan = customer.plan?.trim() ? customer.plan.toUpperCase() : "SIN PLAN";
  const hasUsers = users.length > 0;
  const hasIntegrations = false;

  return (
    <section className="settings-command-center settings-2026 dashboard-module-section" data-active={isActive}>
      <header className="settings-page-heading">
        <div>
          <h2>Configuración</h2>
          <p>Administra tu cuenta, usuarios, integraciones y preferencias.</p>
        </div>
        <button className="settings-help-button" type="button"><HelpCircle aria-hidden="true" />Centro de ayuda</button>
      </header>

      <article className="settings-card settings-company-card" id="empresa">
        <header>
          <span><Building2 aria-hidden="true" /></span>
          <div>
            <strong>Datos de la empresa</strong>
            <p>Actualiza la información principal que usa Copiloto Pyme para personalizar el dashboard.</p>
          </div>
          <button type="button" onClick={() => setEditingCompany((current) => !current)}>
            {editingCompany ? "Cerrar edición" : "Editar empresa"}
          </button>
        </header>
        <div className="settings-company-summary">
          <article><small>Empresa</small><strong>{customer.companyName}</strong></article>
          <article><small>Tipo</small><strong>{customer.businessType}</strong></article>
          <article><small>País</small><strong>{customer.country}</strong></article>
          <article><small>Plan</small><strong>{companyPlan}</strong></article>
        </div>
        {editingCompany ? (
          <form className="settings-company-form" onSubmit={(event) => { event.preventDefault(); setEditingCompany(false); }}>
            <label>Nombre de la empresa<input value={customer.companyName} onChange={(event) => onCustomerChange({ ...customer, companyName: event.target.value })} /></label>
            <label>Tipo de negocio<input value={customer.businessType} onChange={(event) => onCustomerChange({ ...customer, businessType: event.target.value })} /></label>
            <label>País<input value={customer.country} onChange={(event) => onCustomerChange({ ...customer, country: event.target.value })} /></label>
            <label>Moneda<input value={customer.currency} onChange={(event) => onCustomerChange({ ...customer, currency: event.target.value })} /></label>
            <label>Meta mensual<input type="number" value={customer.monthlyGoal} onChange={(event) => onCustomerChange({ ...customer, monthlyGoal: Number(event.target.value) })} /></label>
            <label>Stock mínimo<input type="number" value={customer.minimumStock} onChange={(event) => onCustomerChange({ ...customer, minimumStock: Number(event.target.value) })} /></label>
            <label>Fuente principal<input value={customer.dataSource} onChange={(event) => onCustomerChange({ ...customer, dataSource: event.target.value })} /></label>
            <button type="submit">Guardar cambios</button>
          </form>
        ) : null}
      </article>

      <div className="settings-top-grid">
        <article className="settings-card settings-billing-card">
          <header><span><Crown aria-hidden="true" /></span><strong>Plan y facturación</strong></header>
          <div className="settings-plan-box">
            <small>Plan actual</small>
            <h3>{companyPlan}</h3>
            <em>Sin pago registrado</em>
            <p>Próximo pago</p>
            <strong><CalendarDays aria-hidden="true" />Sin programar</strong>
          </div>
          <div className="settings-payment-row">
            <div><small>Método de pago</small><strong>Sin método</strong><span>Agrega un medio de pago</span></div>
            <em>Pendiente</em>
          </div>
          <footer>
            <button type="button">Cambiar plan</button>
            <button type="button">Ver facturas</button>
          </footer>
        </article>

        <article className="settings-card settings-users-card">
          <header><span><Users aria-hidden="true" /></span><strong>Usuarios</strong><button type="button"><Plus aria-hidden="true" />Agregar usuario</button></header>
          <div>
            {hasUsers ? users.map(([name, email, role, tone, initials]) => (
              <article key={email}>
                <i data-tone={tone}>{initials}</i>
                <div><strong>{name}</strong><p>{email}</p></div>
                <em data-tone={tone}>{role}</em>
              </article>
            )) : <p className="module-empty-note">Sin usuarios invitados todavía. Agrega integrantes cuando quieras delegar ventas, caja, inventario o reportes.</p>}
          </div>
          <a href="#equipo">Ver todos los usuarios <ChevronRight aria-hidden="true" /></a>
        </article>

        <article className="settings-card settings-notifications-card">
          <header><span><Bell aria-hidden="true" /></span><strong>Notificaciones</strong></header>
          <div>
            {notificationChannels.map(([title, text, tone, Icon]) => (
              <article key={title}>
                <Icon aria-hidden="true" data-tone={tone} />
                <div><strong>{title}</strong><p>{text}</p></div>
                <button aria-label={`Activar ${title}`} className="settings-toggle" type="button"><span /></button>
              </article>
            ))}
          </div>
          <a href="#alertas">Configurar preferencias <ChevronRight aria-hidden="true" /></a>
        </article>
      </div>

      <div className="settings-bottom-grid">
        <article className="settings-card settings-integrations-card">
          <header>
            <span><Settings2 aria-hidden="true" /></span>
            <strong>Integraciones</strong>
            <button type="button" onClick={onSyncIntegrations} disabled={!canManageIntegrations}>
              {hasIntegrations ? "Ver todas" : "Sincronizar"}
            </button>
          </header>
          <div className="settings-integration-list">
            {visibleIntegrations.map((integration) => {
              const Icon = integrationIcons[integration.id] ?? Settings2;
              return (
                <button
                  data-motion={microAction === "sync" ? "active" : undefined}
                  key={integration.id}
                  onClick={() => onConnectIntegration(integration.id)}
                  disabled={!canManageIntegrations}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  <strong>{integration.name}</strong>
                  <span>Disponible</span>
                  <ChevronRight aria-hidden="true" />
                </button>
              );
            })}
            {!visibleIntegrations.length ? <p className="module-empty-note">Sin integraciones configuradas todavía.</p> : null}
          </div>
          <a href="#datos">Gestionar integraciones <ChevronRight aria-hidden="true" /></a>
        </article>

        <article className="settings-card settings-ai-card">
          <header><span><Brain aria-hidden="true" /></span><strong>Inteligencia Artificial</strong></header>
          <div>
            {aiPreferences.map(([title, text, Icon]) => (
              <article key={title}>
                <Icon aria-hidden="true" />
                <div><strong>{title}</strong><p>{text}</p></div>
                <button aria-label={`Activar ${title}`} className="settings-toggle" type="button"><span /></button>
              </article>
            ))}
          </div>
          <a href="#ai">Personalizar IA <ChevronRight aria-hidden="true" /></a>
        </article>
      </div>
    </section>
  );
}
