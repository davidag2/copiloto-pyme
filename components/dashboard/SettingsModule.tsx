"use client";

import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Brain,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileText,
  HelpCircle,
  Mail,
  MoreHorizontal,
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

const users: Array<[string, string, string, string, string]> = [
  ["Andrés Vélez", "andres@cafeoriente.com", "Administrador", "purple", "AV"],
  ["María Gómez", "maria@cafeoriente.com", "Ventas", "blue", "MG"],
  ["Juan Pablo Ruiz", "juan@cafeoriente.com", "Inventario", "orange", "JR"]
];

const notificationChannels: Array<[string, string, string, LucideIcon]> = [
  ["WhatsApp", "Recibe alertas importantes", "green", Bell],
  ["Email", "Recibe reportes y novedades", "blue", Mail],
  ["Alertas de IA", "Recomendaciones y riesgos", "purple", Sparkles]
];

const integrationIcons: Record<string, LucideIcon> = {
  sheets: Table2,
  whatsapp: Bell,
  siigo: FileText,
  banking: WalletCards
};

const aiPreferences: Array<[string, string, LucideIcon]> = [
  ["Resumen ejecutivo diario", "Recibe un resumen de tu negocio cada día", CalendarDays],
  ["Alertas automáticas", "La IA te avisa sobre riesgos importantes", Bell],
  ["Recomendaciones IA", "Sugerencias para mejorar tus ventas y operación", Sparkles]
];

export function SettingsModule({
  isActive,
  integrations,
  connectedIntegrations,
  activeIntegrationId,
  canManageIntegrations,
  microAction,
  onConnectIntegration,
  onSyncIntegrations
}: SettingsModuleProps) {
  const visibleIntegrations = integrations.filter((integration) => integration.id !== "banking").slice(0, 3);

  return (
    <section className="settings-command-center settings-2026 dashboard-module-section" data-active={isActive}>
      <header className="settings-page-heading">
        <div>
          <h2>Configuración</h2>
          <p>Administra tu cuenta, usuarios, integraciones y preferencias.</p>
        </div>
        <button className="settings-help-button" type="button"><HelpCircle aria-hidden="true" />Centro de ayuda</button>
      </header>

      <div className="settings-top-grid">
        <article className="settings-card settings-billing-card">
          <header><span><Crown aria-hidden="true" /></span><strong>Plan y facturación</strong></header>
          <div className="settings-plan-box">
            <small>Plan actual</small>
            <h3>Pyme Pro</h3>
            <em>Activo</em>
            <p>Próximo pago</p>
            <strong><CalendarDays aria-hidden="true" />18 de junio de 2026</strong>
          </div>
          <div className="settings-payment-row">
            <div><small>Método de pago</small><strong>VISA</strong><span>•••• 4242</span></div>
            <em>Predeterminado</em>
          </div>
          <footer>
            <button type="button">Cambiar plan</button>
            <button type="button">Ver facturas</button>
          </footer>
        </article>

        <article className="settings-card settings-users-card">
          <header><span><Users aria-hidden="true" /></span><strong>Usuarios</strong><button type="button"><Plus aria-hidden="true" />Agregar usuario</button></header>
          <div>
            {users.map(([name, email, role, tone, initials]) => (
              <article key={email}>
                <i data-tone={tone}>{initials}</i>
                <div><strong>{name}</strong><p>{email}</p></div>
                <em data-tone={tone}>{role}</em>
                <button aria-label={`Opciones de ${name}`} type="button"><MoreHorizontal aria-hidden="true" /></button>
              </article>
            ))}
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
                <button aria-label={`Activar ${title}`} className="settings-toggle is-on" type="button"><span /></button>
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
              {connectedIntegrations ? "Ver todas" : "Sincronizar"}
            </button>
          </header>
          <div className="settings-integration-list">
            {visibleIntegrations.map((integration) => {
              const Icon = integrationIcons[integration.id] ?? Settings2;
              const isActiveIntegration = activeIntegrationId === integration.id;
              return (
                <button
                  data-motion={isActiveIntegration || microAction === "sync" ? "active" : undefined}
                  key={integration.id}
                  onClick={() => onConnectIntegration(integration.id)}
                  disabled={!canManageIntegrations}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  <strong>{integration.name}</strong>
                  <span>{integration.status === "Conectado" ? "Conectado" : "Disponible"}</span>
                  <CheckCircle2 aria-hidden="true" />
                  <ChevronRight aria-hidden="true" />
                </button>
              );
            })}
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
                <button aria-label={`Activar ${title}`} className="settings-toggle is-on" type="button"><span /></button>
              </article>
            ))}
          </div>
          <a href="#ai">Personalizar IA <ChevronRight aria-hidden="true" /></a>
        </article>
      </div>
    </section>
  );
}
