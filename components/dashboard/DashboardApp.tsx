"use client";

import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BarChart3,
  Bell,
  Boxes,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  Link2,
  LogOut,
  LockKeyhole,
  Moon,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Settings2,
  Sun,
  Target,
  TrendingUp,
  UserCircle,
  Users,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { AlertsModule } from "@/components/dashboard/AlertsModule";
import { CashModule } from "@/components/dashboard/CashModule";
import { ClientsModule } from "@/components/dashboard/ClientsModule";
import { DashboardHome } from "@/components/dashboard/DashboardHome";
import { InventoryModule } from "@/components/dashboard/InventoryModule";
import { ReportsModule } from "@/components/dashboard/ReportsModule";
import { SalesModule } from "@/components/dashboard/SalesModule";
import { SettingsModule } from "@/components/dashboard/SettingsModule";
import { evaluateBasicRules, thresholdsFromRules } from "@/lib/rule-engine";
import type { CompanyAlertRule } from "@/lib/rule-engine";
import { canManageTeam, roleCapabilities, roleLabel } from "@/lib/roles";

type SalePoint = { day: string; value: number; previous?: number; cash?: number; margin?: number; criticalStock?: number };
type Product = { name: string; sales: string; stock: "Bajo" | "Normal" | "Critico" };
type Alert = { level: "positive" | "warning" | "danger"; title: string; text: string; metric?: string; status?: string };
type Decision = {
  id: number | string;
  text: string;
  owner: string;
  impact: string;
  status: "Pendiente" | "En curso" | "Completada";
  date: string;
};
type Integration = {
  id: string;
  name: string;
  category: string;
  status: "Disponible" | "Conectado";
  sync: string;
};
type Metrics = {
  sales: number;
  cash: number;
  margin: number;
  criticalStock: number;
};
type DashboardKpis = {
  metrics: Metrics;
  weeklySales: SalePoint[];
  products: Product[];
  rowCount: number;
  comparison?: {
    previousStartDate: string;
    previousEndDate: string;
    previousSales: number;
    previousMargin: number;
  };
  range?: { startDate: string; endDate: string };
};
type DashboardSalesReportRow = {
  type: "vendedor" | "producto" | "cliente" | "canal";
  name: string;
  total: string | number;
  orders: number;
  quantity?: string | number | null;
};
type ThemeMode = "light" | "dark";
type DateRangeMode = "today" | "7d" | "30d" | "month" | "custom";
type MicroAction = "integration" | "sync" | "rules" | "report" | "decision" | null;
type DashboardModule = "inicio" | "ventas" | "caja" | "inventario" | "clientes" | "reportes" | "alertas" | "configuracion";
type NavItem = { id: DashboardModule; label: string; icon: LucideIcon };
type ApiResult<T> = { ok: true; data: T } | { ok: false; error: string };
type CompanyCreateResponse = { company: { id: string }; user: { id: string } };
type EntityResponse<T> = { [key: string]: T };
type AuthUser = { id: string; companyId: string; name: string; email: string; role: string; status: string };
type AuthCompany = {
  id: string;
  name: string;
  country: string;
  businessType: string;
  currency: string;
  plan: string;
  monthlyGoal: number;
  minimumStock: number;
  dataSource: string;
};
type AuthResponse = { user: AuthUser; company: AuthCompany; session: { token: string; tokenHash: string; expiresIn: string } };
type RecoveryResponse = { message: string; resetToken: string | null; expiresIn: string };
type Invitation = { id: string; email: string; role: string; status: string; expiresAt: string; createdAt: string };
type TeamMember = { id: string; companyId: string; name: string; email: string; role: string; status: string; lastLoginAt?: string | null; createdAt: string };
type InviteResponse = { invitation: Invitation; inviteToken: string; inviteUrl: string };
type AlertRuleRow = CompanyAlertRule & { id: string; companyId?: string; createdAt?: string; updatedAt?: string };
type DashboardDataResponse = { kpis?: DashboardKpis; alertRules?: AlertRuleRow[]; decisions?: Decision[]; salesReports?: DashboardSalesReportRow[] };
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
type ImportValidation = { errors: Array<{ rowNumber: number; errors: string[]; raw: Record<string, string> }>; sample: Array<Record<string, unknown>> };
type AiSuggestionRow = {
  id: string;
  companyId: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  recommendation: string;
  impactType: "ventas_adicionales" | "margen" | "ahorro" | "riesgo_evitado";
  impactLabel: string;
  impactValueCop: string | number | null;
  confidence: string | number;
  status: "nueva" | "vista" | "asignada" | "en_progreso" | "aplicada" | "descartada";
  generatedAt: string;
};
type ActivityEventRow = {
  id: string;
  companyId: string;
  actorUserId: string | null;
  actorName?: string | null;
  eventType: string;
  entityType: string;
  entityId: string | null;
  title: string;
  description: string;
  severity: "info" | "success" | "warning" | "danger";
  metadata: Record<string, unknown> | null;
  occurredAt: string;
  createdAt: string;
};
type NotificationRow = {
  id: string;
  companyId: string;
  targetUserId: string | null;
  type: "ai_suggestion" | "alert" | "decision" | "integration" | "report" | "payment" | "billing" | "team" | "system";
  title: string;
  body: string;
  severity: "info" | "success" | "warning" | "danger";
  actionUrl: string | null;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
};
type AiSuggestionCard = {
  id?: string;
  tone: string;
  label: string;
  icon: LucideIcon;
  title: string;
  text: string;
  impact: string;
};
type AiActivityItem = {
  id: string;
  title: string;
  text: string;
  time: string;
  icon: LucideIcon;
  tone: string;
  href?: string;
};
type SmartAction = {
  id: string;
  kind: "integration" | "future" | "dismiss";
  icon: LucideIcon;
  title: string;
  text: string;
  buttonLabel: string;
  featured?: boolean;
};
type SalesCatalogOption = { id: string; name: string; unitPrice?: string | number };
type RecentSale = {
  id: string;
  saleDate: string;
  customerId?: string | null;
  customerName: string;
  productId?: string | null;
  productName: string;
  channelId?: string | null;
  channelName: string;
  salesRepId?: string | null;
  salesRepName: string;
  paymentMethodId?: string | null;
  paymentMethodName: string;
  status: "pagada" | "pendiente" | "anulada";
  quantity?: string | number;
  unitPrice?: string | number;
  discount?: string | number;
  notes?: string | null;
  total: string | number;
};
type SalesFilters = {
  startDate: string;
  endDate: string;
  customer: string;
  product: string;
  channel: string;
  salesRep: string;
  status: string;
  search: string;
};
type EditingSale = {
  saleDate: string;
  status: RecentSale["status"];
  discount: string;
  notes: string;
};
type SalesCatalogs = {
  customers: SalesCatalogOption[];
  products: SalesCatalogOption[];
  channels: SalesCatalogOption[];
  reps: SalesCatalogOption[];
  paymentMethods: SalesCatalogOption[];
};
type SalesSummary = {
  salesToday: string | number;
  salesMonth: string | number;
  averageTicket: string | number;
  topProduct: string;
  topCustomer: string;
  topChannel: string;
  pendingReceivables: string | number;
};
type ManualSaleForm = {
  saleDate: string;
  customerName: string;
  productName: string;
  quantity: string;
  unitPrice: string;
  discount: string;
  channelName: string;
  salesRepName: string;
  paymentMethodName: string;
  status: "pagada" | "pendiente" | "anulada";
  notes: string;
};
type QuickSaleForm = {
  productName: string;
  unitPrice: string;
  paymentMethodName: string;
};
const navItems: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Target },
  { id: "ventas", label: "Ventas", icon: BarChart3 },
  { id: "caja", label: "Caja", icon: WalletCards },
  { id: "inventario", label: "Inventario", icon: Boxes },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "reportes", label: "Reportes", icon: FileText },
  { id: "alertas", label: "Alertas", icon: AlertTriangle },
  { id: "configuracion", label: "Configuración", icon: Settings2 }
];

async function apiJson<T>(path: string, options: RequestInit): Promise<ApiResult<T>> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || "No se pudo guardar en PostgreSQL." };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "PostgreSQL no disponible." };
  }
}

function parseCsv(text: string) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",").map((header) => header.trim().toLowerCase());
  return lines.filter(Boolean).map((line) => {
    const values = line.split(",").map((value) => value.trim());
    return headers.reduce<Record<string, string>>((row, header, index) => {
      row[header] = values[index] || "";
      return row;
    }, {});
  });
}

function inferCsvMapping(headers: string[]): CsvColumnMapping {
  const findColumn = (...candidates: string[]) => headers.find((header) => candidates.some((candidate) => header.includes(candidate))) || "";
  return {
    fecha: findColumn("fecha", "date", "dia"),
    cliente: findColumn("cliente", "customer", "comprador", "tercero"),
    producto: findColumn("producto", "product", "item", "sku"),
    ventas: findColumn("ventas", "venta", "sales", "ingreso"),
    cantidad: findColumn("cantidad", "qty", "quantity", "unidades"),
    precio: findColumn("precio", "price", "valor_unitario", "unitario"),
    descuento: findColumn("descuento", "discount", "rebaja"),
    stock: findColumn("stock", "inventario", "existencia"),
    caja: findColumn("caja", "cash"),
    gastos: findColumn("gastos", "expenses", "egresos"),
    margen: findColumn("margen", "margin"),
    canal: findColumn("canal", "channel", "origen"),
    vendedor: findColumn("vendedor", "asesor", "responsable", "seller"),
    metodoPago: findColumn("metodo", "método", "forma", "payment", "pago"),
    estadoPago: findColumn("estado", "status", "pagada", "pendiente")
  };
}

function suggestionLabel(priority: AiSuggestionRow["priority"]) {
  if (priority === "critical") return "Prioridad alta";
  if (priority === "high") return "Oportunidad";
  if (priority === "medium") return "Atención";
  return "Seguimiento";
}

function suggestionTone(priority: AiSuggestionRow["priority"]) {
  if (priority === "critical") return "high";
  if (priority === "high") return "opportunity";
  if (priority === "medium") return "warning";
  return "neutral";
}

function suggestionIcon(category: string) {
  if (category === "inventario") return PackageCheck;
  if (category === "precios" || category === "ventas") return TrendingUp;
  if (category === "caja" || category === "costos") return WalletCards;
  if (category === "integraciones") return Link2;
  if (category === "reportes") return FileText;
  return Sparkles;
}

function mapSuggestionCard(suggestion: AiSuggestionRow): AiSuggestionCard {
  return {
    id: suggestion.id,
    tone: suggestionTone(suggestion.priority),
    label: suggestionLabel(suggestion.priority),
    icon: suggestionIcon(suggestion.category),
    title: suggestion.title,
    text: suggestion.description,
    impact: suggestion.impactLabel || suggestion.recommendation
  };
}

function activityIcon(eventType: string, severity: ActivityEventRow["severity"]) {
  if (eventType.startsWith("ai_suggestion")) return Sparkles;
  if (eventType.startsWith("alert") || severity === "danger" || severity === "warning") return AlertTriangle;
  if (eventType.startsWith("integration")) return Link2;
  if (eventType.startsWith("report")) return FileText;
  if (eventType.startsWith("payment")) return WalletCards;
  if (eventType.startsWith("sale")) return BarChart3;
  if (eventType.startsWith("user")) return Users;
  if (eventType.startsWith("onboarding")) return CheckCircle2;
  return Clock3;
}

function activityTone(severity: ActivityEventRow["severity"]) {
  if (severity === "success") return "green";
  if (severity === "warning") return "warning";
  if (severity === "danger") return "red";
  return "purple";
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Ahora";
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return date.toLocaleString("es-CO", sameDay
    ? { hour: "numeric", minute: "2-digit" }
    : { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

function mapActivityEvent(event: ActivityEventRow): AiActivityItem {
  return {
    id: event.id,
    title: event.title,
    text: event.description || event.eventType.replaceAll("_", " "),
    time: formatActivityTime(event.occurredAt),
    icon: activityIcon(event.eventType, event.severity),
    tone: activityTone(event.severity),
    href: event.entityType === "ai_suggestions" && event.entityId ? `/dashboard/suggestions/${event.entityId}` : undefined
  };
}

function notificationIcon(type: NotificationRow["type"], severity: NotificationRow["severity"]) {
  if (severity === "danger" || severity === "warning" || type === "alert") return AlertTriangle;
  if (type === "ai_suggestion") return Sparkles;
  if (type === "decision") return ClipboardCheck;
  if (type === "integration") return Link2;
  if (type === "report") return FileText;
  if (type === "payment" || type === "billing") return WalletCards;
  if (type === "team") return Users;
  return Bell;
}

function notificationTone(severity: NotificationRow["severity"]) {
  if (severity === "success") return "green";
  if (severity === "warning") return "warning";
  if (severity === "danger") return "red";
  return "purple";
}

function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon"><Icon aria-hidden="true" /></div>
      <strong>{title}</strong>
      <p>{text}</p>
      {action ? <div className="empty-action">{action}</div> : null}
    </div>
  );
}

const initialWeeklySales: SalePoint[] = [
  { day: "Lun", value: 9.8 },
  { day: "Mar", value: 11.4 },
  { day: "Mie", value: 10.2 },
  { day: "Jue", value: 13.7 },
  { day: "Vie", value: 15.1 },
  { day: "Sab", value: 17.9 },
  { day: "Dom", value: 6.1 }
];

const initialProducts: Product[] = [
  { name: "Cafe Premium 500g", sales: "$18.4M", stock: "Bajo" },
  { name: "Chocolate Familiar", sales: "$12.7M", stock: "Normal" },
  { name: "Panela Organica", sales: "$9.8M", stock: "Critico" },
  { name: "Avena Instantanea", sales: "$7.9M", stock: "Normal" }
];

const initialIntegrations: Integration[] = [
  { id: "sheets", name: "Google Sheets", category: "Hojas de calculo", status: "Disponible", sync: "Manual" },
  { id: "siigo", name: "Siigo", category: "Facturacion y contabilidad", status: "Disponible", sync: "Cada 6 horas" },
  { id: "alegra", name: "Alegra", category: "Facturacion y contabilidad", status: "Disponible", sync: "Cada 6 horas" },
  { id: "banking", name: "Conexion bancaria", category: "Banca y caja", status: "Disponible", sync: "Proximamente" },
  { id: "mercadopago", name: "Mercado Pago", category: "Pagos", status: "Disponible", sync: "Cada hora" },
  { id: "shopify", name: "Shopify", category: "Ecommerce", status: "Disponible", sync: "Cada hora" },
  { id: "woocommerce", name: "WooCommerce", category: "Ecommerce", status: "Disponible", sync: "Cada hora" }
];

const formatMoney = (value: number) => `$${value.toFixed(1)}M`;
const formatGoal = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
const formatCop = (value: number | string | null | undefined) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(value || 0));
const cashDays = (cash: number) => Math.round(cash / 1.55);
const initialManualSaleForm = (): ManualSaleForm => ({
  saleDate: toInputDate(new Date()),
  customerName: "",
  productName: "",
  quantity: "1",
  unitPrice: "",
  discount: "0",
  channelName: "",
  salesRepName: "",
  paymentMethodName: "",
  status: "pagada",
  notes: ""
});
const initialQuickSaleForm = (): QuickSaleForm => ({
  productName: "",
  unitPrice: "",
  paymentMethodName: ""
});
const formatCopCompact = (value: number) => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`;
  return `$${Math.round(value)}`;
};

function repairDisplayName(value: string) {
  return value
    .replace(/Andr.s/gi, (match) => match[0] === "A" ? "Andrés" : "andrés")
    .replace(/V.lez/gi, (match) => match[0] === "V" ? "Vélez" : "vélez")
    .replace(/\uFFFD/g, "");
}

function statusClass(status: string) {
  return status === "green" ? "positive" : status === "yellow" ? "warning" : "danger";
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeLabel(range: DateRangeMode, customRange: { start: string; end: string }) {
  if (range === "today") return "Hoy";
  if (range === "7d") return "Últimos 7 días";
  if (range === "30d") return "Últimos 30 días";
  if (range === "month") return "Mes actual";
  return `${formatShortDate(customRange.start)} - ${formatShortDate(customRange.end)}`;
}

function formatShortDate(value: string) {
  if (!value) return "Sin fecha";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "short" });
}

function salesForRange(source: SalePoint[], range: DateRangeMode, customRange: { start: string; end: string }) {
  if (range === "today") return source.slice(-1);
  if (range === "7d") return source;

  const days = range === "30d" ? 30 : range === "month" ? new Date().getDate() : customDayCount(customRange.start, customRange.end);
  const labels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];
  return Array.from({ length: Math.max(days, 1) }, (_, index) => {
    const base = source[index % source.length] ?? source[0];
    const wave = 0.92 + ((index % 6) * 0.035);
    return {
      day: days > 10 ? `${index + 1}` : labels[index % labels.length],
      value: Number((base.value * wave).toFixed(1))
    };
  });
}

function customDayCount(start: string, end: string) {
  const startDate = new Date(`${start}T00:00:00`).getTime();
  const endDate = new Date(`${end}T00:00:00`).getTime();
  if (!Number.isFinite(startDate) || !Number.isFinite(endDate) || endDate < startDate) return 7;
  return Math.min(Math.round((endDate - startDate) / 86_400_000) + 1, 60);
}

function dashboardRange(range: DateRangeMode, customRange: { start: string; end: string }) {
  const end = new Date();
  const start = new Date();
  if (range === "today") {
    return { startDate: toInputDate(end), endDate: toInputDate(end) };
  }
  if (range === "30d") {
    start.setDate(end.getDate() - 29);
    return { startDate: toInputDate(start), endDate: toInputDate(end) };
  }
  if (range === "month") {
    start.setDate(1);
    return { startDate: toInputDate(start), endDate: toInputDate(end) };
  }
  if (range === "custom") {
    return { startDate: customRange.start, endDate: customRange.end };
  }
  start.setDate(end.getDate() - 6);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
}

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [companyId, setCompanyId] = useState("");
  const [persistenceStatus, setPersistenceStatus] = useState("Modo demo: aun no hay empresa guardada en PostgreSQL.");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authForm, setAuthForm] = useState({ password: "", loginEmail: "", loginPassword: "", recoverEmail: "" });
  const [authStatus, setAuthStatus] = useState("Crea tu cuenta o entra con tu usuario empresarial.");
  const [resetToken, setResetToken] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteForm, setInviteForm] = useState({ email: "", role: "viewer" });
  const [inviteLink, setInviteLink] = useState("");
  const [customer, setCustomer] = useState({
    ownerName: "",
    ownerEmail: "",
    companyName: "Distribuidora Andina",
    country: "Colombia",
    plan: "go",
    businessType: "Distribuidora",
    currency: "COP - Peso colombiano",
    monthlyGoal: 100_000_000,
    minimumStock: 10,
    dataSource: "Excel/CSV"
  });
  const [paid, setPaid] = useState(false);
  const [onboardingReady, setOnboardingReady] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ sales: 84.2, cash: 27.6, margin: 31.8, criticalStock: 7 });
  const [weeklySales, setWeeklySales] = useState(initialWeeklySales);
  const [products, setProducts] = useState(initialProducts);
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [decisions, setDecisions] = useState<Decision[]>([
    { id: 1, text: "Reponer Panela Organica antes del viernes", owner: "Administrador", impact: "Inventario", status: "En curso", date: "2026-04-29" },
    { id: 2, text: "Revisar gasto de transporte con proveedor", owner: "Administrador", impact: "Margen", status: "Pendiente", date: "2026-04-29" }
  ]);
  const [rules, setRules] = useState({ sales: 70, cash: 14, margin: 30, stock: 3 });
  const [visible, setVisible] = useState({
    sales: true,
    cash: true,
    margin: true,
    stock: true,
    importer: true,
    products: true,
    copilot: true,
    decisions: true,
    integrations: true,
    reports: true
  });
  const [focus, setFocus] = useState("owner");
  const [recommendation, setRecommendation] = useState("Reponer inventario de Cafe Premium antes del viernes y revisar el gasto de transporte.");
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [importStatus, setImportStatus] = useState("Sin archivo cargado");
  const [importPreview, setImportPreview] = useState("Aun no hay datos para mostrar.");
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<Array<Record<string, string>>>([]);
  const [csvFileName, setCsvFileName] = useState("");
  const [csvMapping, setCsvMapping] = useState<CsvColumnMapping>({
    fecha: "",
    cliente: "",
    producto: "",
    ventas: "",
    cantidad: "",
    precio: "",
    descuento: "",
    stock: "",
    caja: "",
    gastos: "",
    margen: "",
    canal: "",
    vendedor: "",
    metodoPago: "",
    estadoPago: ""
  });
  const [importValidation, setImportValidation] = useState<ImportValidation | null>(null);
  const [importHistory, setImportHistory] = useState<ImportBatch[]>([]);
  const [report, setReport] = useState("");
  const [dashboardSalesReports, setDashboardSalesReports] = useState<DashboardSalesReportRow[]>([]);
  const [reportSettings, setReportSettings] = useState({ frequency: "Semanal", channel: "Email", recipient: "gerencia@empresa.com" });
  const [microAction, setMicroAction] = useState<MicroAction>(null);
  const [microFeedback, setMicroFeedback] = useState("");
  const [activeIntegrationId, setActiveIntegrationId] = useState("");
  const [activeDecisionId, setActiveDecisionId] = useState<number | string>("");
  const [aiSuggestionRows, setAiSuggestionRows] = useState<AiSuggestionRow[]>([]);
  const [aiSuggestionsStatus, setAiSuggestionsStatus] = useState("Sugerencias demo listas.");
  const [activityRows, setActivityRows] = useState<ActivityEventRow[]>([]);
  const [activityStatus, setActivityStatus] = useState("Actividad demo lista.");
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [notificationsUnreadCount, setNotificationsUnreadCount] = useState(0);
  const [notificationsStatus, setNotificationsStatus] = useState("Notificaciones listas.");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [salesCatalogs, setSalesCatalogs] = useState<SalesCatalogs>({
    customers: [],
    products: [],
    channels: [],
    reps: [],
    paymentMethods: []
  });
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [salesSummary, setSalesSummary] = useState<SalesSummary>({
    salesToday: 0,
    salesMonth: 0,
    averageTicket: 0,
    topProduct: "Sin ventas",
    topCustomer: "Sin clientes",
    topChannel: "Sin canal",
    pendingReceivables: 0
  });
  const [manualSaleForm, setManualSaleForm] = useState<ManualSaleForm>(() => initialManualSaleForm());
  const [quickSaleForm, setQuickSaleForm] = useState<QuickSaleForm>(() => initialQuickSaleForm());
  const [manualSaleStatus, setManualSaleStatus] = useState("Registra ventas manuales para alimentar el dashboard y la IA.");
  const [quickSaleStatus, setQuickSaleStatus] = useState("Captura ventas simples en segundos.");
  const [salesFilters, setSalesFilters] = useState<SalesFilters>({ startDate: "", endDate: "", customer: "", product: "", channel: "", salesRep: "", status: "", search: "" });
  const [editingSaleId, setEditingSaleId] = useState("");
  const [editingSale, setEditingSale] = useState<EditingSale>({ saleDate: "", status: "pagada", discount: "0", notes: "" });
  const [kpiSourceStatus, setKpiSourceStatus] = useState("KPIs demo hasta cargar datos reales.");
  const [kpiRowCount, setKpiRowCount] = useState(0);
  const [activeModule, setActiveModule] = useState<DashboardModule>("inicio");
  const [showAutomationStrip, setShowAutomationStrip] = useState(true);
  const [topbarCollapsed, setTopbarCollapsed] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dateRange, setDateRange] = useState<DateRangeMode>("7d");
  const [customRange, setCustomRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    return {
      start: toInputDate(start),
      end: toInputDate(end)
    };
  });

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("copiloto-pyme-theme");
    const savedCompanyId = window.localStorage.getItem("copiloto-pyme-company-id");
    const savedAuthUser = window.localStorage.getItem("copiloto-pyme-user");
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    }
    if (savedCompanyId) {
      setCompanyId(savedCompanyId);
      setPersistenceStatus("Empresa conectada a PostgreSQL.");
    }
    if (savedAuthUser) {
      try {
        setAuthUser(JSON.parse(savedAuthUser) as AuthUser);
        setAuthStatus("Sesion local restaurada.");
      } catch {
        window.localStorage.removeItem("copiloto-pyme-user");
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("copiloto-pyme-theme", theme);
  }, [theme]);

  useEffect(() => {
    if (companyId) {
      window.localStorage.setItem("copiloto-pyme-company-id", companyId);
    }
  }, [companyId]);

  useEffect(() => {
    if (authUser) {
      window.localStorage.setItem("copiloto-pyme-user", JSON.stringify(authUser));
    }
  }, [authUser]);

  useEffect(() => {
    if (!microAction) return;
    const timer = window.setTimeout(() => {
      setMicroAction(null);
      setMicroFeedback("");
      setActiveIntegrationId("");
      setActiveDecisionId("");
    }, 1700);
    return () => window.clearTimeout(timer);
  }, [microAction, microFeedback]);

  useEffect(() => {
    if (companyId && authUser) {
      void loadTeam(companyId);
      void loadImportHistory(companyId);
      void loadAiSuggestions(companyId);
      void loadActivity(companyId);
      void loadNotifications(companyId);
      void loadSalesData(companyId);
    }
  }, [companyId, authUser]);

  useEffect(() => {
    if (companyId && authUser) {
      void loadDashboardData(companyId);
    }
  }, [companyId, authUser, dateRange, customRange.start, customRange.end]);

  const salesPercent = Math.round((metrics.sales / (customer.monthlyGoal / 1_000_000)) * 100);
  const connectedIntegrations = integrations.filter((integration) => integration.status === "Conectado").length;
  const openDecisions = decisions.filter((decision) => decision.status !== "Completada").length;
  const activeRoleLabel = roleLabel(authUser?.role);
  const permissions = roleCapabilities(authUser?.role);
  const tenantShortId = companyId ? companyId.slice(0, 8) : "demo";
  const onboardingProgress = onboardingReady ? 100 : paid ? 75 : authUser ? 50 : 25;
  const onboardingSteps: Array<{ title: string; status: string; icon: LucideIcon; text: string }> = [
    { title: "Cuenta", status: authUser ? "completed" : "active", icon: Bot, text: "Crea el usuario principal de la empresa." },
    { title: "Pago", status: paid ? "completed" : authUser ? "active" : "locked", icon: WalletCards, text: "Activa la suscripcion antes de configurar datos." },
    { title: "Configuracion", status: onboardingReady ? "completed" : paid ? "active" : "locked", icon: Settings2, text: "Define negocio, meta, inventario y fuente inicial." },
    { title: "Confirmacion", status: onboardingReady ? "active" : "locked", icon: CheckCircle2, text: "Revisa el resumen antes de entrar al dashboard." }
  ];

  const alerts = useMemo<Alert[]>(() => {
    return evaluateBasicRules({
      salesProgressPercent: salesPercent,
      cashDays: cashDays(metrics.cash),
      marginPercent: metrics.margin,
      criticalStockCount: metrics.criticalStock
    }, rules);
  }, [metrics, rules, salesPercent]);
  const criticalAlerts = alerts.filter((alert) => alert.level === "danger" || alert.level === "warning");
  const overallStatus = criticalAlerts.some((alert) => alert.level === "danger")
    ? "Riesgo alto"
    : criticalAlerts.length
      ? "Atencion"
      : "Controlado";
  const overallStatusTone = overallStatus === "Riesgo alto" ? "red" : overallStatus === "Atencion" ? "yellow" : "green";
  const currentDateLabel = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const userDisplayName = repairDisplayName(authUser?.name || customer.ownerName || "Andrés Vélez");
  const userFirstName = userDisplayName.split(" ")[0] || "Equipo";
  const userInitials = userDisplayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP";
  const notificationCount = companyId && authUser ? notificationsUnreadCount : criticalAlerts.length + openDecisions;
  const fallbackNotifications: NotificationRow[] = [
    {
      id: "demo-ai",
      companyId: companyId || "demo",
      targetUserId: null,
      type: "ai_suggestion",
      title: "Nueva sugerencia IA",
      body: "Reponer Panela Orgánica hoy para evitar quiebre de inventario.",
      severity: "info",
      actionUrl: "",
      entityType: "ai_suggestions",
      entityId: null,
      metadata: null,
      readAt: null,
      createdAt: new Date().toISOString()
    },
    {
      id: "demo-alert",
      companyId: companyId || "demo",
      targetUserId: null,
      type: "alert",
      title: "Inventario crítico",
      body: `${metrics.criticalStock} productos requieren atención.`,
      severity: "warning",
      actionUrl: "",
      entityType: "alerts",
      entityId: null,
      metadata: null,
      readAt: null,
      createdAt: new Date().toISOString()
    }
  ];
  const visibleNotifications = companyId && authUser ? notifications : fallbackNotifications;

  const selectedSales = useMemo<SalePoint[]>(() => (kpiRowCount ? weeklySales : salesForRange(weeklySales, dateRange, customRange)), [weeklySales, dateRange, customRange, kpiRowCount]);
  const dateRangeLabel = rangeLabel(dateRange, customRange);
  const bestDay = selectedSales.reduce((best, item) => (item.value > best.value ? item : best), selectedSales[0] ?? weeklySales[0]);
  const chartData = selectedSales.map((item, index) => {
    const previous = typeof item.previous === "number" ? item.previous : Math.max(4.8, Number((item.value * (0.86 + index * 0.025)).toFixed(1)));
    const target = Number(((customer.monthlyGoal / 1_000_000) / Math.max(selectedSales.length, 1)).toFixed(1));
    return {
      day: item.day,
      actual: Number(item.value.toFixed(1)),
      previous,
      target,
      cash: typeof item.cash === "number" ? item.cash : Number((cashDays(metrics.cash) * (0.94 + index * 0.01)).toFixed(1)),
      margin: typeof item.margin === "number" ? item.margin : Number((metrics.margin + (index % 3) * 0.4 - 0.3).toFixed(1)),
      criticalStock: typeof item.criticalStock === "number" ? item.criticalStock : Math.max(0, metrics.criticalStock - (index % 4)),
      variation: previous ? Number((((item.value - previous) / previous) * 100).toFixed(1)) : 0
    };
  });
  const weeklyTotal = selectedSales.reduce((total, item) => total + item.value, 0);
  const previousTotal = chartData.reduce((total, item) => total + item.previous, 0);
  const weeklyVariation = previousTotal ? Math.round(((weeklyTotal - previousTotal) / previousTotal) * 100) : 0;
  const trendCards = [
    { id: "cash", title: "Caja", value: `${cashDays(metrics.cash)} días`, helper: "Cobertura diaria", dataKey: "cash", color: "#22c55e", suffix: " días" },
    { id: "margin", title: "Margen", value: `${metrics.margin.toFixed(1)}%`, helper: "Margen promedio", dataKey: "margin", color: "#6d5dfc", suffix: "%" },
    { id: "stock", title: "Inventario crítico", value: `${metrics.criticalStock} SKU`, helper: "Productos en riesgo", dataKey: "criticalStock", color: "#ef4444", suffix: " SKU" }
  ];
  const filteredSales = recentSales.filter((sale) => {
    const haystack = [
      sale.customerName,
      sale.productName,
      sale.channelName,
      sale.salesRepName,
      sale.paymentMethodName,
      sale.notes || "",
      sale.status
    ].join(" ").toLowerCase();
    const saleDate = String(sale.saleDate || "").slice(0, 10);
    if (salesFilters.startDate && saleDate < salesFilters.startDate) return false;
    if (salesFilters.endDate && saleDate > salesFilters.endDate) return false;
    if (salesFilters.customer && sale.customerName !== salesFilters.customer) return false;
    if (salesFilters.product && sale.productName !== salesFilters.product) return false;
    if (salesFilters.channel && sale.channelName !== salesFilters.channel) return false;
    if (salesFilters.salesRep && sale.salesRepName !== salesFilters.salesRep) return false;
    if (salesFilters.status && sale.status !== salesFilters.status) return false;
    if (salesFilters.search && !haystack.includes(salesFilters.search.toLowerCase())) return false;
    return true;
  });
  const filteredSalesTotal = filteredSales.reduce((total, sale) => total + Number(sale.total || 0), 0);
  const salesSummaryCards = [
    { label: "Ventas del día", value: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(salesSummary.salesToday || 0)), helper: "Facturación de hoy", icon: BarChart3, tone: "blue" },
    { label: "Ventas del mes", value: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(salesSummary.salesMonth || 0)), helper: "Mes actual", icon: TrendingUp, tone: "green" },
    { label: "Ticket promedio", value: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(salesSummary.averageTicket || 0)), helper: "Promedio por venta", icon: WalletCards, tone: "purple" },
    { label: "Producto más vendido", value: salesSummary.topProduct || "Sin ventas", helper: "Mayor venta del mes", icon: PackageCheck, tone: "blue" },
    { label: "Cliente más frecuente", value: salesSummary.topCustomer || "Sin clientes", helper: "Más compras del mes", icon: Users, tone: "green" },
    { label: "Canal más rentable", value: salesSummary.topChannel || "Sin canal", helper: "Mayor margen bruto", icon: Link2, tone: "purple" },
    { label: "Pendiente por cobrar", value: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(salesSummary.pendingReceivables || 0)), helper: "Ventas pendientes", icon: AlertTriangle, tone: Number(salesSummary.pendingReceivables || 0) > 0 ? "red" : "green" }
  ];
  const salesReportGroups = dashboardSalesReports.reduce<Record<DashboardSalesReportRow["type"], DashboardSalesReportRow[]>>((groups, row) => {
    groups[row.type].push(row);
    return groups;
  }, { vendedor: [], producto: [], cliente: [], canal: [] });
  const salesReportHighlights = (["vendedor", "producto", "cliente", "canal"] as const).map((type) => ({
    type,
    label: type === "vendedor" ? "Por vendedor" : type === "producto" ? "Por producto" : type === "cliente" ? "Por cliente" : "Por canal",
    rows: salesReportGroups[type].slice(0, 3)
  }));
  const activeNavItem = navItems.find((item) => item.id === activeModule) || navItems[0];
  const moduleVisibility = useMemo<Record<DashboardModule, boolean>>(() => ({
    inicio: activeModule === "inicio",
    ventas: activeModule === "ventas",
    caja: activeModule === "caja",
    inventario: activeModule === "inventario",
    clientes: activeModule === "clientes",
    reportes: activeModule === "reportes",
    alertas: activeModule === "alertas",
    configuracion: activeModule === "configuracion"
  }), [activeModule]);
  const isCommercialModule = moduleVisibility.ventas || moduleVisibility.alertas;
  const fallbackAiSuggestions: AiSuggestionCard[] = [
    {
      tone: "high",
      label: "Prioridad alta",
      icon: PackageCheck,
      title: "Reponer Panela Orgánica",
      text: "Quedan pocas unidades y las ventas subieron 12% esta semana.",
      impact: "+ $1.250.000 en ventas"
    },
    {
      tone: "opportunity",
      label: "Oportunidad",
      icon: TrendingUp,
      title: "Aumentar precio en Café Premium",
      text: "Tu margen está 18% menor que el promedio del mercado.",
      impact: "+ $890.000 en margen"
    },
    {
      tone: "warning",
      label: "Atención",
      icon: AlertTriangle,
      title: "Stock bajo en 2 productos",
      text: "Riesgo de quiebre de inventario en los próximos 5 días.",
      impact: "Revisar compras hoy"
    }
  ];
  const aiSuggestions = aiSuggestionRows.length ? aiSuggestionRows.slice(0, 3).map(mapSuggestionCard) : fallbackAiSuggestions;
  const aiHomeKpis = [
    { label: "Ventas hoy", value: formatMoney(metrics.sales), helper: `${salesPercent}% de la meta`, icon: BarChart3, tone: "blue", trend: selectedSales.map((item) => item.value), delta: weeklyVariation >= 0 ? `+${weeklyVariation}% vs periodo anterior` : `${weeklyVariation}% vs periodo anterior` },
    { label: "Caja disponible", value: formatMoney(metrics.cash), helper: `${cashDays(metrics.cash)} días de caja`, icon: WalletCards, tone: "green", trend: [18, 18.5, 18.1, 19.2, 20.1, 21.4, cashDays(metrics.cash)], delta: "Suficiente para operar" },
    { label: "Productos críticos", value: String(metrics.criticalStock), helper: "requieren atención", icon: AlertTriangle, tone: "red", trend: [7, 6, 6, 5, 6, 5, metrics.criticalStock], delta: "Comprar antes de quiebre" },
    { label: "Sugerencias activas", value: String(openDecisions + criticalAlerts.length), helper: "listas para asignar", icon: Sparkles, tone: "purple", trend: [2, 3, 4, 3, 5, 6, openDecisions + criticalAlerts.length], delta: "Priorizadas por IA" }
  ];
  const aiImpactData = chartData.map((item, index) => ({
    day: item.day,
    actual: item.actual,
    withAi: Number((item.actual * (1.08 + index * 0.012)).toFixed(1))
  }));
  const fallbackAiImpactLift = Math.max(0, Math.round((aiImpactData.reduce((total, item) => total + item.withAi, 0) - weeklyTotal) * 1_000_000));
  const impactValueByType = aiSuggestionRows.reduce<Record<AiSuggestionRow["impactType"], number>>((totals, suggestion) => {
    const value = Number(suggestion.impactValueCop || 0);
    totals[suggestion.impactType] += Number.isFinite(value) ? value : 0;
    return totals;
  }, { ventas_adicionales: 0, margen: 0, ahorro: 0, riesgo_evitado: 0 });
  const totalRealAiImpact = Object.values(impactValueByType).reduce((total, value) => total + value, 0);
  const aiImpactLift = totalRealAiImpact || fallbackAiImpactLift;
  const aiImpactSummaryCards = [
    { type: "ventas_adicionales" as const, label: "Ventas adicionales", value: impactValueByType.ventas_adicionales || fallbackAiImpactLift, helper: "ingreso potencial", icon: BarChart3, tone: "blue" },
    { type: "margen" as const, label: "Margen", value: impactValueByType.margen, helper: "mejora por precios", icon: TrendingUp, tone: "green" },
    { type: "ahorro" as const, label: "Ahorro", value: impactValueByType.ahorro, helper: "costos evitables", icon: WalletCards, tone: "purple" },
    { type: "riesgo_evitado" as const, label: "Riesgo evitado", value: impactValueByType.riesgo_evitado, helper: "inventario y caja", icon: ShieldCheck, tone: "red" }
  ];
  const aiImpactCategories = aiSuggestionRows.length
    ? (["inventario", "precios", "ventas", "caja"] as const).map((category) => {
      const rows = aiSuggestionRows.filter((suggestion) => suggestion.category === category);
      const impactTotal = rows.reduce((total, suggestion) => {
        const value = Number(suggestion.impactValueCop || 0);
        return total + (Number.isFinite(value) ? value : 0);
      }, 0);
      const tone = category === "inventario" ? "red" : category === "precios" ? "green" : category === "ventas" ? "blue" : "purple";
      const icon = category === "inventario" ? PackageCheck : category === "precios" ? TrendingUp : category === "ventas" ? BarChart3 : WalletCards;
      const label = category === "inventario" ? "Inventario" : category === "precios" ? "Precios" : category === "ventas" ? "Ventas" : "Caja";
      return { label, count: rows.length, tag: rows[0]?.impactLabel || "Sin impacto activo", impactTotal, firstSuggestionId: rows[0]?.id, icon, tone };
    }).filter((category) => category.count > 0)
    : [
      { label: "Inventario", count: Math.max(2, metrics.criticalStock - 3), tag: "Alta prioridad", impactTotal: Math.round(fallbackAiImpactLift * 0.34), firstSuggestionId: "", icon: PackageCheck, tone: "red" },
      { label: "Precios", count: 2, tag: "Oportunidad", impactTotal: Math.round(fallbackAiImpactLift * 0.24), firstSuggestionId: "", icon: TrendingUp, tone: "green" },
      { label: "Ventas", count: Math.max(1, Math.round(salesPercent / 45)), tag: "Optimización", impactTotal: Math.round(fallbackAiImpactLift * 0.3), firstSuggestionId: "", icon: BarChart3, tone: "blue" },
      { label: "Caja", count: cashDays(metrics.cash) < rules.cash ? 2 : 1, tag: "Revisión", impactTotal: Math.round(fallbackAiImpactLift * 0.12), firstSuggestionId: "", icon: WalletCards, tone: "purple" }
    ];
  const aiCategoryMaxImpact = Math.max(...aiImpactCategories.map((category) => category.impactTotal), 1);
  const fallbackAiActivity: AiActivityItem[] = [
    { id: "demo-suggestion", title: "Nueva sugerencia generada", text: "Reponer Panela Orgánica", time: "8:30 a. m.", icon: Sparkles, tone: "purple" },
    { id: "demo-opportunity", title: "Oportunidad detectada", text: "Ajuste de precio en Café Premium", time: "7:45 a. m.", icon: TrendingUp, tone: "green" },
    { id: "demo-alert", title: "Alerta de inventario", text: "Stock bajo en Azúcar Integral", time: "Ayer, 6:20 p. m.", icon: AlertTriangle, tone: "red" }
  ];
  const aiActivity = activityRows.length ? activityRows.slice(0, 5).map(mapActivityEvent) : fallbackAiActivity;
  const automationActions: SmartAction[] = [
    {
      id: "siigo",
      kind: "integration",
      icon: FileText,
      title: "Conecta tu facturación electrónica",
      text: "Acción destacada: conecta SIIGO para traer ventas, facturas, cartera e impuestos al resumen diario.",
      buttonLabel: "Conectar SIIGO",
      featured: true
    },
    {
      id: "banking",
      kind: "future",
      icon: Banknote,
      title: "Sincroniza tu banco",
      text: "Módulo futuro para conectar movimientos bancarios y mejorar la proyección de caja.",
      buttonLabel: "Próximamente"
    },
    {
      id: "dismiss-suggestion",
      kind: "dismiss",
      icon: X,
      title: "Cerrar esta sugerencia",
      text: "Oculta esta barra cuando el equipo ya tenga claro el siguiente paso.",
      buttonLabel: "Cerrar"
    }
  ];
  const salesGoalGap = Math.max(0, (customer.monthlyGoal / 1_000_000) - metrics.sales);
  const salesInsightCards = [
    {
      label: "Ritmo de ventas",
      value: weeklyVariation >= 0 ? `+${weeklyVariation}%` : `${weeklyVariation}%`,
      text: weeklyVariation >= 0 ? "El periodo actual viene por encima del anterior." : "El periodo actual necesita impulso comercial.",
      icon: TrendingUp,
      tone: weeklyVariation >= 0 ? "green" : "red"
    },
    {
      label: "Brecha contra meta",
      value: formatMoney(salesGoalGap),
      text: salesGoalGap > 0 ? "Falta para cumplir la meta mensual configurada." : "Meta mensual cubierta con el ritmo actual.",
      icon: Target,
      tone: salesGoalGap > 0 ? "blue" : "green"
    },
    {
      label: "Producto líder",
      value: products[0]?.name ?? "Sin datos",
      text: `${products[0]?.sales ?? "$0"} vendidos. Vigila inventario antes de impulsar campaña.`,
      icon: PackageCheck,
      tone: "purple"
    }
  ];

  function recommendedAction() {
    if (metrics.criticalStock > rules.stock) return `Reponer los SKU criticos antes de lanzar promociones. Hay ${metrics.criticalStock} SKU en riesgo.`;
    if (cashDays(metrics.cash) < rules.cash) return `Priorizar cobros y aplazar pagos no urgentes. La caja cubre ${cashDays(metrics.cash)} dias.`;
    if (metrics.margin < rules.margin) return `Revisar descuentos, costos y productos de bajo margen. Margen actual ${metrics.margin.toFixed(1)}%.`;
    if (salesPercent < rules.sales) return `Activar ventas sobre ${products[0]?.name ?? "productos lideres"} para cerrar la brecha de meta mensual.`;
    return "Mantener seguimiento diario, revisar productos lideres y preparar reporte semanal para el equipo.";
  }

  function updateMetrics(next: Metrics) {
    setMetrics(next);
  }

  function applyDashboardKpis(kpis: DashboardKpis) {
    setKpiRowCount(kpis.rowCount);
    if (!kpis.rowCount) {
      setKpiSourceStatus("Sin filas reales importadas. KPIs en modo demo.");
      return;
    }
    setMetrics(kpis.metrics);
    if (kpis.weeklySales.length) setWeeklySales(kpis.weeklySales);
    if (kpis.products.length) setProducts(kpis.products);
    const rangeText = kpis.range ? ` del ${formatShortDate(kpis.range.startDate)} al ${formatShortDate(kpis.range.endDate)}` : "";
    setKpiSourceStatus(`${kpis.rowCount} fila(s) reales${rangeText}.`);
  }

  function triggerMicroInteraction(action: Exclude<MicroAction, null>, message: string) {
    setMicroAction(action);
    setMicroFeedback(message);
  }

  function applyAuthSession(data: AuthResponse) {
    setAuthUser(data.user);
    setCompanyId(data.company.id);
    setCustomer((current) => ({
      ...current,
      ownerName: data.user.name,
      ownerEmail: data.user.email,
      companyName: data.company.name,
      country: data.company.country,
      plan: data.company.plan,
      businessType: data.company.businessType,
      currency: data.company.currency.includes(" - ") ? data.company.currency : `${data.company.currency} - Peso colombiano`,
      monthlyGoal: data.company.monthlyGoal,
      minimumStock: data.company.minimumStock,
      dataSource: data.company.dataSource
    }));
    setPersistenceStatus("Sesion autenticada y empresa conectada a PostgreSQL.");
  }

  async function loadTeam(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const teamResult = await apiJson<{ users: TeamMember[] }>(`/api/auth/team?companyId=${activeCompanyId}`, { method: "GET" });
    if (teamResult.ok) setTeamMembers(teamResult.data.users);
    const invitationResult = await apiJson<{ invitations: Invitation[] }>(`/api/auth/invite?companyId=${activeCompanyId}`, { method: "GET" });
    if (invitationResult.ok) setInvitations(invitationResult.data.invitations);
  }

  async function loadDashboardData(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const range = dashboardRange(dateRange, customRange);
    const params = new URLSearchParams(range);
    const result = await apiJson<DashboardDataResponse>(`/api/companies/${activeCompanyId}/dashboard?${params.toString()}`, { method: "GET" });
    if (!result.ok) {
      setKpiSourceStatus(`KPIs demo: ${result.error}`);
      return;
    }
    if (result.data.alertRules?.length) {
      setRules(thresholdsFromRules(result.data.alertRules, rules));
    }
    if (result.data.decisions) {
      setDecisions(result.data.decisions);
    }
    if (result.data.salesReports) {
      setDashboardSalesReports(result.data.salesReports);
    }
    if (result.data.kpis) applyDashboardKpis(result.data.kpis);
  }

  async function loadImportHistory(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ batches: ImportBatch[] }>(`/api/imports?companyId=${activeCompanyId}`, { method: "GET" });
    if (result.ok) setImportHistory(result.data.batches);
  }

  async function loadAiSuggestions(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ suggestions: AiSuggestionRow[] }>(`/api/ai/suggestions?companyId=${activeCompanyId}`, { method: "GET" });
    if (!result.ok) {
      setAiSuggestionsStatus(`Modo demo local: ${result.error}`);
      return;
    }
    setAiSuggestionRows(result.data.suggestions);
    setAiSuggestionsStatus(`${result.data.suggestions.length} sugerencia(s) cargadas desde PostgreSQL.`);
  }

  async function loadActivity(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ activity: ActivityEventRow[] }>(`/api/activity?companyId=${activeCompanyId}&limit=6`, { method: "GET" });
    if (!result.ok) {
      setActivityStatus(`Modo demo local: ${result.error}`);
      return;
    }
    setActivityRows(result.data.activity);
    setActivityStatus(result.data.activity.length
      ? `${result.data.activity.length} evento(s) cargados desde PostgreSQL.`
      : "Sin eventos reales todavía. Mostrando ejemplo de actividad AI.");
  }

  async function loadNotifications(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ notifications: NotificationRow[]; unreadCount: number }>(`/api/notifications?companyId=${activeCompanyId}&limit=8`, { method: "GET" });
    if (!result.ok) {
      setNotificationsStatus(`Modo demo local: ${result.error}`);
      setNotificationsUnreadCount(criticalAlerts.length + openDecisions);
      return;
    }
    setNotifications(result.data.notifications);
    setNotificationsUnreadCount(result.data.unreadCount);
    setNotificationsStatus(result.data.notifications.length
      ? `${result.data.unreadCount} notificación(es) sin leer.`
      : "Sin notificaciones reales todavía.");
  }

  async function loadSalesData(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ catalogs: SalesCatalogs; recentSales: RecentSale[]; summary: SalesSummary }>(`/api/sales?companyId=${activeCompanyId}`, { method: "GET" });
    if (!result.ok) {
      setManualSaleStatus(`Ventas en modo local: ${result.error}`);
      return;
    }
    setSalesCatalogs(result.data.catalogs);
    setRecentSales(result.data.recentSales);
    setSalesSummary(result.data.summary);
    setManualSaleStatus(result.data.recentSales.length
      ? `${result.data.recentSales.length} venta(s) recientes cargadas desde PostgreSQL.`
      : "Listo para registrar la primera venta manual.");

    setManualSaleForm((current) => ({
      ...current,
      channelName: current.channelName || result.data.catalogs.channels[0]?.name || "",
      salesRepName: current.salesRepName || result.data.catalogs.reps[0]?.name || authUser?.name || "",
      paymentMethodName: current.paymentMethodName || result.data.catalogs.paymentMethods[0]?.name || ""
    }));
    setQuickSaleForm((current) => ({
      ...current,
      paymentMethodName: current.paymentMethodName || result.data.catalogs.paymentMethods[0]?.name || "Efectivo"
    }));
  }

  function updateManualSaleField<K extends keyof ManualSaleForm>(field: K, value: ManualSaleForm[K]) {
    setManualSaleForm((current) => ({ ...current, [field]: value }));
  }

  function updateQuickSaleField<K extends keyof QuickSaleForm>(field: K, value: QuickSaleForm[K]) {
    setQuickSaleForm((current) => ({ ...current, [field]: value }));
  }

  function updateSalesFilter<K extends keyof SalesFilters>(field: K, value: SalesFilters[K]) {
    setSalesFilters((current) => ({ ...current, [field]: value }));
  }

  function selectProductForManualSale(productName: string) {
    const product = salesCatalogs.products.find((item) => item.name === productName);
    setManualSaleForm((current) => ({
      ...current,
      productName,
      unitPrice: product?.unitPrice ? String(product.unitPrice) : current.unitPrice
    }));
  }

  function selectProductForQuickSale(productName: string) {
    const product = salesCatalogs.products.find((item) => item.name === productName);
    setQuickSaleForm((current) => ({
      ...current,
      productName,
      unitPrice: product?.unitPrice ? String(product.unitPrice) : current.unitPrice
    }));
  }

  function startEditingSale(sale: RecentSale) {
    setEditingSaleId(sale.id);
    setEditingSale({
      saleDate: String(sale.saleDate || "").slice(0, 10),
      status: sale.status,
      discount: String(sale.discount || 0),
      notes: sale.notes || ""
    });
  }

  async function saveQuickSaleEdit(saleId: string) {
    if (!companyId) return;
    setManualSaleStatus("Guardando edición rápida...");
    const result = await apiJson<{ sale: Partial<RecentSale> }>("/api/sales", {
      method: "PATCH",
      body: JSON.stringify({ companyId, saleId, ...editingSale })
    });
    if (!result.ok) {
      setManualSaleStatus(`No se pudo editar la venta: ${result.error}`);
      return;
    }
    setRecentSales((current) => current.map((sale) => sale.id === saleId ? { ...sale, ...result.data.sale } : sale));
    setEditingSaleId("");
    setManualSaleStatus("Venta actualizada. KPIs y datos de IA recalculados.");
    await loadDashboardData(companyId);
    await loadSalesData(companyId);
    await loadActivity(companyId);
  }

  async function submitManualSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setManualSaleStatus("Inicia sesión en una empresa para guardar ventas en PostgreSQL.");
      return;
    }
    triggerMicroInteraction("sync", "Guardando venta...");
    setManualSaleStatus("Guardando venta manual...");
    const result = await apiJson<{ sale: RecentSale }>("/api/sales", {
      method: "POST",
      body: JSON.stringify({ companyId, ...manualSaleForm })
    });
    if (!result.ok) {
      setManualSaleStatus(`No se pudo registrar la venta: ${result.error}`);
      return;
    }
    setRecentSales((current) => [result.data.sale, ...current].slice(0, 8));
    setManualSaleForm((current) => ({
      ...initialManualSaleForm(),
      channelName: current.channelName,
      salesRepName: current.salesRepName,
      paymentMethodName: current.paymentMethodName
    }));
    setManualSaleStatus("Venta registrada. El dashboard y la IA ya pueden usar este dato.");
    setPersistenceStatus("Venta manual guardada en PostgreSQL.");
    setRecommendation("Nueva venta registrada. Revisa tendencia, caja y productos para detectar oportunidades.");
    await loadDashboardData(companyId);
    await loadSalesData(companyId);
    await loadActivity(companyId);
  }

  async function submitQuickSale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setQuickSaleStatus("Inicia sesión en una empresa para guardar ventas rápidas.");
      return;
    }
    if (!quickSaleForm.productName.trim() || !quickSaleForm.unitPrice) {
      setQuickSaleStatus("Producto y valor son obligatorios.");
      return;
    }
    triggerMicroInteraction("sync", "Guardando venta rápida...");
    setQuickSaleStatus("Guardando y preparando el siguiente registro...");
    const result = await apiJson<{ sale: RecentSale }>("/api/sales", {
      method: "POST",
      body: JSON.stringify({
        companyId,
        saleDate: toInputDate(new Date()),
        customerName: "Venta rápida",
        productName: quickSaleForm.productName,
        quantity: "1",
        unitPrice: quickSaleForm.unitPrice,
        discount: "0",
        channelName: salesCatalogs.channels[0]?.name || "Mostrador",
        salesRepName: salesCatalogs.reps[0]?.name || authUser?.name || "Vendedor",
        paymentMethodName: quickSaleForm.paymentMethodName || "Efectivo",
        status: "pagada",
        notes: "Captura rápida"
      })
    });
    if (!result.ok) {
      setQuickSaleStatus(`No se pudo guardar: ${result.error}`);
      return;
    }
    setRecentSales((current) => [result.data.sale, ...current].slice(0, 100));
    setQuickSaleForm((current) => ({ ...initialQuickSaleForm(), paymentMethodName: current.paymentMethodName }));
    setQuickSaleStatus("Venta guardada. Sigue registrando la siguiente.");
    setPersistenceStatus("Venta rápida guardada en PostgreSQL.");
    setRecommendation("Nueva venta rápida registrada. Copiloto actualizará KPIs y señales comerciales.");
    await loadDashboardData(companyId);
    await loadSalesData(companyId);
    await loadActivity(companyId);
  }

  async function markNotificationsRead() {
    if (!companyId) return;
    const result = await apiJson<{ updated: number }>("/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({ companyId, markAll: true })
    });
    if (!result.ok) {
      setNotificationsStatus(`No se pudieron marcar como leídas: ${result.error}`);
      return;
    }
    setNotifications((current) => current.map((notification) => ({ ...notification, readAt: notification.readAt || new Date().toISOString() })));
    setNotificationsUnreadCount(0);
    setNotificationsStatus(`${result.data.updated} notificación(es) marcadas como leídas.`);
  }

  async function refreshMetrics() {
    if (companyId) {
      await loadDashboardData(companyId);
      setRecommendation("KPIs actualizados desde imported_data_rows.");
      return;
    }
    const multiplier = 0.94 + Math.random() * 0.14;
    updateMetrics({
      sales: 84.2 * multiplier,
      cash: 27.6 * (0.96 + Math.random() * 0.1),
      margin: 31.8 + (Math.random() * 1.6 - 0.8),
      criticalStock: Math.round(5 + Math.random() * 5)
    });
  }

  async function ensureCompany() {
    if (companyId) return companyId;

    const result = await apiJson<CompanyCreateResponse>("/api/companies", {
      method: "POST",
      body: JSON.stringify({
        companyName: customer.companyName,
        ownerName: customer.ownerName || "Propietario",
        ownerEmail: customer.ownerEmail || `demo-${Date.now()}@copilotopyme.local`,
        country: customer.country,
        businessType: customer.businessType,
        currency: customer.currency.split(" - ")[0],
        plan: customer.plan,
        monthlyGoal: customer.monthlyGoal,
        minimumStock: customer.minimumStock,
        dataSource: customer.dataSource
      })
    });

    if (!result.ok) {
      setPersistenceStatus(`Modo demo local: ${result.error}`);
      return "";
    }

    const nextCompanyId = result.data.company.id;
    setCompanyId(nextCompanyId);
    setPersistenceStatus("Empresa y usuario guardados en PostgreSQL.");
    return nextCompanyId;
  }

  async function completeSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await apiJson<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({
        companyName: customer.companyName,
        ownerName: customer.ownerName,
        ownerEmail: customer.ownerEmail,
        password: authForm.password,
        country: customer.country,
        businessType: customer.businessType,
        currency: customer.currency.split(" - ")[0],
        plan: customer.plan,
        monthlyGoal: customer.monthlyGoal,
        minimumStock: customer.minimumStock,
        dataSource: customer.dataSource
      })
    });
    if (!result.ok) {
      setAuthStatus(`No se pudo crear la cuenta: ${result.error}`);
      return;
    }
    applyAuthSession(result.data);
    await loadTeam(result.data.company.id);
    setPaid(false);
    setAuthStatus(`Cuenta creada. Rol: ${roleLabel(result.data.user.role)}.`);
    setRecommendation("Usuario creado. Ya puedes pagar la suscripcion y continuar el onboarding.");
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await apiJson<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: authForm.loginEmail,
        password: authForm.loginPassword
      })
    });
    if (!result.ok) {
      setAuthStatus(`Login fallido: ${result.error}`);
      return;
    }
    applyAuthSession(result.data);
    await loadTeam(result.data.company.id);
    setAuthStatus(`Bienvenido ${result.data.user.name}. Rol: ${roleLabel(result.data.user.role)}.`);
  }

  async function recoverPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await apiJson<RecoveryResponse>("/api/auth/recover", {
      method: "POST",
      body: JSON.stringify({ email: authForm.recoverEmail })
    });
    if (!result.ok) {
      setAuthStatus(`No se pudo iniciar recuperacion: ${result.error}`);
      return;
    }
    setResetToken(result.data.resetToken || "");
    setAuthStatus(`${result.data.message} Token demo vigente por ${result.data.expiresIn}.`);
  }

  async function inviteTeamMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!companyId) {
      setAuthStatus("Primero inicia sesion o crea una empresa para invitar equipo.");
      return;
    }
    if (!canManageTeam(authUser?.role)) {
      setAuthStatus("Tu rol no permite invitar usuarios. Pide acceso al propietario o administrador.");
      return;
    }
    const result = await apiJson<InviteResponse>("/api/auth/invite", {
      method: "POST",
      body: JSON.stringify({
        companyId,
        email: inviteForm.email,
        role: inviteForm.role,
        invitedBy: authUser?.id
      })
    });
    if (!result.ok) {
      setAuthStatus(`No se pudo enviar invitacion: ${result.error}`);
      return;
    }
    setInviteLink(result.data.inviteUrl);
    setInviteForm({ email: "", role: "viewer" });
    setAuthStatus(`Invitacion creada para ${result.data.invitation.email}.`);
    await loadTeam(companyId);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setAuthUser(null);
    setCompanyId("");
    setTeamMembers([]);
    setInvitations([]);
    setInviteLink("");
    window.localStorage.removeItem("copiloto-pyme-user");
    window.localStorage.removeItem("copiloto-pyme-company-id");
    window.localStorage.removeItem("copiloto-pyme-session");
    window.localStorage.removeItem("copiloto-pyme-subscription");
    window.localStorage.removeItem("copiloto-pyme-onboarding");
    setAuthStatus("Sesion cerrada.");
    window.location.href = "/";
  }

  async function completeOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const activeCompanyId = await ensureCompany();
    if (activeCompanyId) {
      const result = await apiJson<{ company: { id: string } }>("/api/companies", {
        method: "PATCH",
        body: JSON.stringify({
          companyId: activeCompanyId,
          companyName: customer.companyName,
          country: customer.country,
          businessType: customer.businessType,
          currency: customer.currency.split(" - ")[0],
          plan: customer.plan,
          monthlyGoal: customer.monthlyGoal,
          minimumStock: customer.minimumStock,
          dataSource: customer.dataSource
        })
      });
      setPersistenceStatus(result.ok ? "Onboarding guardado en PostgreSQL." : `Modo demo local: ${result.error}`);
    }
    setRecommendation(`Bienvenido ${customer.ownerName || "equipo"}. Siguiente paso: cargar datos desde ${customer.dataSource}.`);
    setOnboardingReady(true);
  }

  async function connectIntegration(id: string) {
    const selected = integrations.find((integration) => integration.id === id);
    if (!selected) return;
    if (id === "banking") {
      setActiveIntegrationId(id);
      triggerMicroInteraction("integration", "Conexión bancaria marcada como integración futura.");
      setRecommendation("La conexión bancaria queda en cola de producto. Servirá para proyectar caja con movimientos reales.");
      return;
    }
    setActiveIntegrationId(id);
    triggerMicroInteraction("integration", `Conectando ${selected.name}...`);
    setIntegrations((current) => current.map((integration) => (integration.id === id ? { ...integration, status: "Conectado", sync: "Sincronizado ahora" } : integration)));
    setCustomer((current) => ({ ...current, dataSource: selected.name }));
    updateMetrics({ sales: metrics.sales * 1.04, cash: metrics.cash * 1.02, margin: metrics.margin + 0.4, criticalStock: Math.max(0, metrics.criticalStock - 1) });
    if (companyId) {
      const result = await apiJson<EntityResponse<unknown>>("/api/integrations", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          provider: selected.name,
          category: selected.category,
          status: "Conectado",
          syncLabel: "Sincronizado ahora"
        })
      });
      setPersistenceStatus(result.ok ? `${selected.name} guardado en PostgreSQL.` : `Modo demo local: ${result.error}`);
    }
    triggerMicroInteraction("integration", `${selected.name} conectado y sincronizado.`);
    setRecommendation(`${selected.name} conectado. Datos sincronizados y panel actualizado con una muestra demo.`);
  }

  async function syncIntegrations() {
    const connected = integrations.filter((integration) => integration.status === "Conectado");
    if (!connected.length) {
      setRecommendation("Conecta al menos una fuente antes de sincronizar integraciones.");
      return;
    }
    triggerMicroInteraction("sync", "Sincronizando fuentes conectadas...");
    setIntegrations((current) => current.map((integration) => (integration.status === "Conectado" ? { ...integration, sync: "Sincronizado ahora" } : integration)));
    updateMetrics({ ...metrics, sales: metrics.sales * 1.02, cash: metrics.cash * 1.01 });
    if (companyId) {
      await Promise.all(connected.map((integration) => apiJson<EntityResponse<unknown>>("/api/integrations", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          provider: integration.name,
          category: integration.category,
          status: "Conectado",
          syncLabel: "Sincronizado ahora"
        })
      })));
      setPersistenceStatus("Integraciones sincronizadas en PostgreSQL.");
    }
    triggerMicroInteraction("sync", `${connected.length} fuente(s) actualizadas.`);
    setRecommendation(`${connected.length} integracion(es) sincronizadas. Revisa alertas y decisiones sugeridas.`);
  }

  function dismissSmartSuggestion() {
    setShowAutomationStrip(false);
    triggerMicroInteraction("decision", "Sugerencia cerrada. Puedes seguir trabajando en el dashboard.");
    setRecommendation("Barra de acciones inteligentes cerrada. SIIGO y banco siguen disponibles en Integraciones.");
  }

  async function addDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("decision") || "").trim();
    if (!text) return;
    const nextDecision: Decision = {
      id: Date.now(),
      text,
      owner: String(form.get("owner")),
      impact: String(form.get("impact")),
      status: "Pendiente",
      date: new Date().toISOString().slice(0, 10)
    };
    setActiveDecisionId(nextDecision.id);
    triggerMicroInteraction("decision", "Registrando decision...");
    setDecisions((current) => [
      nextDecision,
      ...current
    ]);
    if (companyId) {
      const result = await apiJson<{ decision: { id: string } }>("/api/decisions", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          text: nextDecision.text,
          owner: nextDecision.owner,
          impact: nextDecision.impact,
          status: nextDecision.status,
          date: nextDecision.date
        })
      });
      if (result.ok) {
        setDecisions((current) => current.map((decision) => decision.id === nextDecision.id ? { ...decision, id: result.data.decision.id } : decision));
        setPersistenceStatus("Decision guardada en PostgreSQL.");
      } else {
        setPersistenceStatus(`Modo demo local: ${result.error}`);
      }
    }
    event.currentTarget.reset();
    triggerMicroInteraction("decision", "Decision registrada en el historial.");
    setRecommendation("Decision registrada. Dale seguimiento desde el historial para medir si genera resultado.");
  }

  async function updateDecisionStatus(decisionId: Decision["id"], status: Decision["status"]) {
    setActiveDecisionId(decisionId);
    setDecisions((current) => current.map((decision) => decision.id === decisionId ? { ...decision, status } : decision));
    if (!companyId || typeof decisionId !== "string") {
      triggerMicroInteraction("decision", "Estado actualizado en modo local.");
      return;
    }

    const result = await apiJson<{ decision: Decision }>("/api/decisions", {
      method: "PATCH",
      body: JSON.stringify({ companyId, decisionId, status })
    });

    if (result.ok) {
      setDecisions((current) => current.map((decision) => decision.id === decisionId ? result.data.decision : decision));
      setPersistenceStatus("Estado de decisión actualizado en PostgreSQL.");
      triggerMicroInteraction("decision", "Estado de decisión actualizado.");
    } else {
      setPersistenceStatus(`No se pudo actualizar decisión: ${result.error}`);
    }
  }

  async function generateReport() {
    triggerMicroInteraction("report", `Generando reporte ${reportSettings.frequency.toLowerCase()}...`);
    const dashboardSnapshot = {
      range: dateRangeLabel,
      metrics,
      salesPercent,
      cashDays: cashDays(metrics.cash),
      connectedIntegrations,
      openDecisions,
      alerts: alerts.map((alert) => ({ title: alert.title, text: alert.text, level: alert.level })),
      topProducts: products.slice(0, 4),
      salesReports: salesReportHighlights.map((group) => ({
        type: group.type,
        rows: group.rows.map((row) => ({ name: row.name, total: row.total, orders: row.orders, quantity: row.quantity }))
      })),
      weeklyTotal,
      weeklyVariation,
      bestDay,
      recommendation: recommendedAction()
    };
    const text = `Reporte ${reportSettings.frequency} - ${customer.companyName}
Canal: ${reportSettings.channel}
Destinatario: ${reportSettings.recipient}
Rango: ${dateRangeLabel}

Resumen ejecutivo
- Ventas: ${formatMoney(metrics.sales)} (${salesPercent}% de la meta ${formatGoal(customer.monthlyGoal)})
- Caja: ${formatMoney(metrics.cash)} (${cashDays(metrics.cash)} dias estimados)
- Margen: ${metrics.margin.toFixed(1)}%
- Inventario critico: ${metrics.criticalStock} SKU
- Variacion ventas: ${weeklyVariation >= 0 ? "+" : ""}${weeklyVariation}% vs periodo anterior
- Mejor dia: ${bestDay.day} con ${formatMoney(bestDay.value)}
- Integraciones conectadas: ${connectedIntegrations}
- Decisiones abiertas: ${openDecisions}

Productos principales
${products.slice(0, 4).map((product) => `- ${product.name}: ${product.sales} · stock ${product.stock}`).join("\n")}

Reportes de ventas
${salesReportHighlights.map((group) => {
  const rows = group.rows.length ? group.rows.map((row) => `  - ${row.name}: ${formatCop(row.total)} · ${row.orders} ventas${row.quantity ? ` · ${Number(row.quantity).toFixed(0)} unidades` : ""}`).join("\n") : "  - Sin datos en el rango";
  return `- ${group.label}\n${rows}`;
}).join("\n")}

Alertas
${alerts.map((alert) => `- ${alert.title}: ${alert.text}`).join("\n")}

Accion recomendada
${recommendedAction()}`;
    setReport(text);
    if (companyId) {
      const result = await apiJson<EntityResponse<unknown>>("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          companyId,
          frequency: reportSettings.frequency,
          channel: reportSettings.channel,
          recipient: reportSettings.recipient,
          content: text,
          dashboardSnapshot,
          status: "draft"
        })
      });
      setPersistenceStatus(result.ok ? "Reporte guardado en PostgreSQL." : `Modo demo local: ${result.error}`);
    }
    triggerMicroInteraction("report", `Reporte listo para ${reportSettings.recipient}.`);
    setRecommendation(`Reporte ${reportSettings.frequency.toLowerCase()} listo para ${reportSettings.recipient}.`);
  }

  async function applyRules() {
    triggerMicroInteraction("rules", "Aplicando reglas de riesgo...");
    setRecommendation("Reglas de alerta actualizadas.");
    await persistCurrentAlerts();
    triggerMicroInteraction("rules", "Reglas aplicadas y alertas recalculadas.");
  }

  async function persistCurrentAlerts() {
    if (!companyId) {
      setPersistenceStatus("Modo demo local: crea o recupera una empresa antes de guardar alertas.");
      return;
    }
    const result = await apiJson<EntityResponse<unknown>>("/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        companyId,
        engine: "basic",
        metrics: {
          salesProgressPercent: salesPercent,
          cashDays: cashDays(metrics.cash),
          marginPercent: metrics.margin,
          criticalStockCount: metrics.criticalStock
        },
        rules
      })
    });
    setPersistenceStatus(result.ok ? "Motor básico ejecutado y alertas guardadas en PostgreSQL." : `Modo demo local: ${result.error}`);
  }

  function downloadReport() {
    const text = report || `Reporte Copiloto Pyme\n\n${recommendedAction()}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-copiloto-pyme-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const rows = [
      "fecha,cliente,producto,ventas,cantidad,precio,descuento,stock,caja,gastos,margen,canal,vendedor,metodo_pago,estado_pago",
      "2026-04-23,Cafe Oriente,Cafe Premium 500g,18400000,20,920000,0,8,27600000,2200000,32,Mostrador,Andres Velez,Transferencia,pagada",
      "2026-04-24,Dulce Hogar,Chocolate Familiar,12700000,10,1270000,0,24,28900000,1800000,29,WhatsApp,Equipo comercial,Efectivo,pagada",
      "2026-04-25,Marketu,Panela Organica,9800000,14,700000,0,3,27100000,1600000,35,Instagram,Equipo comercial,Credito cliente,pendiente"
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-copiloto-pyme.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function toggleTheme() {
    setTheme((currentTheme) => currentTheme === "light" ? "dark" : "light");
  }

  function answerQuestion() {
    const normalized = question.toLowerCase();
    if (!normalized) {
      setAnswer("Escribe una pregunta sobre ventas, caja, inventario, decisiones, integraciones o reportes.");
      return;
    }
    if (normalized.includes("caja")) setAnswer(`Caja disponible: ${formatMoney(metrics.cash)}, cobertura estimada ${cashDays(metrics.cash)} dias.`);
    else if (normalized.includes("decision")) setAnswer(`Hay ${openDecisions} decisiones abiertas. La mas reciente es: ${decisions[0]?.text ?? "sin decisiones registradas"}.`);
    else if (normalized.includes("integracion")) setAnswer(`Hay ${connectedIntegrations} integraciones conectadas. Prioriza Google Sheets, Siigo/Alegra y Mercado Pago.`);
    else if (normalized.includes("reporte")) setAnswer(`El reporte ${reportSettings.frequency.toLowerCase()} esta preparado para ${reportSettings.channel} a ${reportSettings.recipient}.`);
    else if (normalized.includes("meta") || normalized.includes("venta")) setAnswer(`La meta mensual va en ${salesPercent}%. Ventas acumuladas: ${formatMoney(metrics.sales)} contra ${formatGoal(customer.monthlyGoal)}.`);
    else setAnswer(`Mi recomendacion: ${recommendedAction()}`);
  }

  async function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus(`${file.name} listo para mapear`);
    const text = await file.text();
    const headerLine = text.trim().split(/\r?\n/)[0] || "";
    const headers = headerLine.split(",").map((header) => header.trim().toLowerCase()).filter(Boolean);
    const rows = parseCsv(text);
    setCsvHeaders(headers);
    setCsvRows(rows);
    setCsvFileName(file.name);
    setCsvMapping(inferCsvMapping(headers));
    setImportValidation(null);
    setImportPreview(`${rows.length} fila(s) detectadas. Revisa el mapeo antes de aplicar la importacion.`);
    setRecommendation(`Archivo ${file.name} cargado. Confirma el mapeo de columnas para validar duplicados y errores.`);
  }

  async function applyCsvImport() {
    if (!companyId) {
      setPersistenceStatus("Crea o inicia sesion en una empresa para guardar importaciones en PostgreSQL.");
      return;
    }
    if (!csvRows.length) {
      setImportStatus("Sin archivo listo para importar");
      return;
    }
    const result = await apiJson<{ batch: ImportBatch; validation: ImportValidation }>("/api/imports", {
      method: "POST",
      body: JSON.stringify({
        companyId,
        source: "CSV",
        fileName: csvFileName,
        columnMapping: csvMapping,
        rows: csvRows
      })
    });
    if (!result.ok) {
      setPersistenceStatus(`Modo demo local: ${result.error}`);
      return;
    }
    setImportValidation(result.data.validation);
    setImportStatus(`${result.data.batch.validCount}/${result.data.batch.rowCount} fila(s) importadas`);
    setImportPreview(`${result.data.batch.errorCount} error(es), ${result.data.batch.duplicateCount} duplicado(s).`);
    setPersistenceStatus("Importacion avanzada guardada en PostgreSQL y conectada al modulo Ventas.");
    await loadImportHistory(companyId);
    await loadDashboardData(companyId);
    await loadSalesData(companyId);
  }

  async function reverseImport(batchId: string) {
    if (!companyId) return;
    const result = await apiJson<{ batch: ImportBatch }>("/api/imports", {
      method: "DELETE",
      body: JSON.stringify({ companyId, batchId })
    });
    setPersistenceStatus(result.ok ? "Importacion reversada y filas eliminadas." : `No se pudo reversar: ${result.error}`);
    await loadImportHistory(companyId);
    await loadDashboardData(companyId);
    await loadSalesData(companyId);
  }

  function navigateModule(moduleId: DashboardModule) {
    setActiveModule(moduleId);
    window.requestAnimationFrame(() => {
      document.querySelector(".main-panel")?.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <div id="appView" className={`app-shell theme-${theme} ${sidebarCollapsed ? "app-shell--sidebar-collapsed" : ""}`}>
      <header className="mobile-app-bar">
        <div className="brand"><div className="brand-mark">CP</div><div><strong>Copiloto Pyme</strong><span>{customer.companyName}</span></div></div>
        <div className="mobile-app-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}<span>{theme === "dark" ? "Claro" : "Oscuro"}</span></button>
          <button className="secondary-button topbar-logout" type="button" onClick={() => { void logout(); }}><LogOut aria-hidden="true" />Cerrar sesión</button>
        </div>
      </header>

      <aside className={`sidebar ${sidebarCollapsed ? "sidebar--collapsed" : ""}`}>
        <div className="sidebar-brand-panel">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">CP</div>
            <div><strong>Copiloto Pyme</strong><span>AI Command Center</span></div>
          </div>
          <button
            className="sidebar-collapse-button"
            type="button"
            aria-expanded={!sidebarCollapsed}
            aria-label={sidebarCollapsed ? "Maximizar menú lateral" : "Minimizar menú lateral"}
            onClick={() => setSidebarCollapsed((current) => !current)}
          >
            {sidebarCollapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
            <span>{sidebarCollapsed ? "Maximizar" : "Minimizar"}</span>
          </button>
        </div>

        <div className="company-switcher" aria-label="Empresa activa">
          <label>Empresa activa</label>
          <div>
            <Building2 aria-hidden="true" />
            <strong className="company-switcher-name">{customer.companyName}</strong>
          </div>
          <small>{customer.businessType} · {customer.country} · Plan {customer.plan.toUpperCase()}</small>
        </div>

        <span className="sidebar-section-label">Módulos</span>
        <nav className="nav-list" aria-label="Principal">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                aria-current={activeModule === item.id ? "page" : undefined}
                className={`nav-item ${activeModule === item.id ? "active" : ""}`}
                onClick={() => navigateModule(item.id)}
                type="button"
                title={item.label}
                key={item.id}
              >
                <Icon aria-hidden="true" /><span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="tenant-card">
          <span>Sesión empresarial</span>
          <strong>{userDisplayName || "Usuario demo"}</strong>
          <small>{activeRoleLabel} · Tenant {tenantShortId}</small>
          <div className="tenant-card-metrics">
            <span>{connectedIntegrations}/{integrations.length} fuentes</span>
            <span>{openDecisions} pendientes</span>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className={`topbar ${topbarCollapsed ? "topbar--collapsed" : ""}`}>
          <div className="topbar-greeting">
            <h1>¡Hola, {userFirstName}! <Sparkles aria-hidden="true" /></h1>
            <p>{currentDateLabel}</p>
            <span className="active-module-pill">Módulo: {activeNavItem.label}</span>
          </div>
          <div className="topbar-actions" aria-hidden={topbarCollapsed}>
            <label className="topbar-range-control">
              <CalendarDays aria-hidden="true" />
              <select value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRangeMode)} aria-label="Rango de fechas">
                <option value="today">Hoy</option>
                <option value="7d">Últimos 7 días</option>
                <option value="30d">Últimos 30 días</option>
                <option value="month">Mes actual</option>
                <option value="custom">Personalizado</option>
              </select>
              <ChevronDown aria-hidden="true" />
            </label>
            {dateRange === "custom" && (
              <div className="custom-date-range" aria-label="Rango personalizado">
                <input
                  aria-label="Fecha inicial"
                  type="date"
                  value={customRange.start}
                  onChange={(event) => setCustomRange((current) => ({ ...current, start: event.target.value }))}
                />
                <input
                  aria-label="Fecha final"
                  type="date"
                  value={customRange.end}
                  onChange={(event) => setCustomRange((current) => ({ ...current, end: event.target.value }))}
                />
              </div>
            )}
            <div className="notification-menu">
              <button
                className="notification-button"
                type="button"
                aria-expanded={notificationsOpen}
                aria-label={`${notificationCount} notificaciones`}
                onClick={() => setNotificationsOpen((current) => !current)}
              >
                <Bell aria-hidden="true" />
                {notificationCount ? <span>{notificationCount}</span> : null}
              </button>
              {notificationsOpen && (
                <div className="notification-popover" role="dialog" aria-label="Notificaciones recientes">
                  <div className="notification-popover-header">
                    <div>
                      <strong>Notificaciones</strong>
                      <small>{notificationsStatus}</small>
                    </div>
                    <button type="button" onClick={() => { void markNotificationsRead(); }} disabled={!notificationCount}>Marcar leídas</button>
                  </div>
                  <div className="notification-list">
                    {visibleNotifications.length ? visibleNotifications.map((notification) => {
                      const Icon = notificationIcon(notification.type, notification.severity);
                      const href = notification.actionUrl || (notification.entityType === "ai_suggestions" && notification.entityId ? `/dashboard/suggestions/${notification.entityId}` : "");
                      return (
                        <div className="notification-item" data-tone={notificationTone(notification.severity)} data-unread={!notification.readAt} key={notification.id}>
                          <span><Icon aria-hidden="true" /></span>
                          <div>
                            <strong>{notification.title}</strong>
                            <small>{notification.body || "Actividad registrada en Copiloto Pyme."}</small>
                            {href ? <a href={href}>Abrir</a> : null}
                          </div>
                          <time>{formatActivityTime(notification.createdAt)}</time>
                        </div>
                      );
                    }) : (
                      <div className="notification-empty">
                        <Bell aria-hidden="true" />
                        <strong>Sin notificaciones pendientes</strong>
                        <small>Cuando la IA detecte algo importante, aparecerá aquí.</small>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="topbar-profile" type="button" aria-label="Perfil de usuario">
              <span>{userInitials}</span>
              <div><strong>{userDisplayName}</strong><small>{activeRoleLabel}</small></div>
              <UserCircle aria-hidden="true" />
            </button>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}<span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span></button>
            <button className="secondary-button topbar-logout" type="button" onClick={() => { void logout(); }}><LogOut aria-hidden="true" />Cerrar sesión</button>
          </div>
          <button
            className="topbar-collapse-button"
            type="button"
            aria-expanded={!topbarCollapsed}
            aria-label={topbarCollapsed ? "Maximizar barra superior" : "Minimizar barra superior"}
            onClick={() => setTopbarCollapsed((current) => !current)}
          >
            {topbarCollapsed ? <ChevronDown aria-hidden="true" /> : <ChevronUp aria-hidden="true" />}
            <span>{topbarCollapsed ? "Maximizar" : "Minimizar"}</span>
          </button>
        </header>

        <div className="dashboard-module-content" aria-live="polite">
          <DashboardHome
          isActive={moduleVisibility.inicio}
          overallStatusTone={overallStatusTone}
          dateRangeLabel={dateRangeLabel}
          overallStatus={overallStatus}
          kpiSourceStatus={kpiSourceStatus}
          aiSuggestionsStatus={aiSuggestionsStatus}
          aiSuggestions={aiSuggestions}
          aiHomeKpis={aiHomeKpis}
          aiImpactSummaryCards={aiImpactSummaryCards}
          aiImpactLift={aiImpactLift}
          hasRealAiSuggestions={aiSuggestionRows.length > 0}
          aiImpactData={aiImpactData}
          aiImpactCategories={aiImpactCategories}
          aiCategoryMaxImpact={aiCategoryMaxImpact}
          aiActivity={aiActivity}
          activityStatus={activityStatus}
          showAutomationStrip={showAutomationStrip}
          automationActions={automationActions}
          integrations={integrations}
          activeIntegrationId={activeIntegrationId}
          canManageIntegrations={permissions.canManageIntegrations}
          companyId={companyId}
          tenantShortId={tenantShortId}
          activeRoleLabel={activeRoleLabel}
          currencyLabel={customer.currency.split(" - ")[0]}
          monthlyGoalLabel={formatGoal(customer.monthlyGoal)}
          persistenceStatus={persistenceStatus}
          microFeedback={microFeedback}
          microAction={microAction}
          onRefreshSuggestions={() => {
            void loadAiSuggestions();
            setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`);
          }}
          onShowAllCategories={() => setAnswer(`Sugerencias por categoria: ${aiImpactCategories.map((category) => `${category.label} ${category.count}`).join(", ")}.`)}
          onRefreshActivity={() => { void loadActivity(); }}
          onConnectIntegration={(id) => { void connectIntegration(id); }}
          onDismissSmartSuggestion={dismissSmartSuggestion}
          onCloseAutomationStrip={() => setShowAutomationStrip(false)}
          formatCopCompact={formatCopCompact}
          formatMoney={formatMoney}
          />

        <ClientsModule
          isActive={moduleVisibility.clientes}
          companyName={customer.companyName}
          tenantShortId={tenantShortId}
          authUser={authUser}
          activeRoleLabel={activeRoleLabel}
          permissions={permissions}
          inviteForm={inviteForm}
          inviteLink={inviteLink}
          teamMembers={teamMembers}
          invitations={invitations}
          onRefreshTeam={() => { void loadTeam(); }}
          onLogout={() => { void logout(); }}
          onInviteFormChange={setInviteForm}
          onInviteTeamMember={inviteTeamMember}
        />

        <SettingsModule
          isActive={moduleVisibility.configuracion}
          focus={focus}
          visible={visible}
          onFocusChange={setFocus}
          onVisibleChange={setVisible}
        />

        <InventoryModule
          isActive={moduleVisibility.inventario}
          showIntegrations={visible.integrations}
          showImporter={visible.importer}
          integrations={integrations}
          connectedIntegrations={connectedIntegrations}
          activeIntegrationId={activeIntegrationId}
          canManageIntegrations={permissions.canManageIntegrations}
          canImportData={permissions.canImportData}
          microAction={microAction}
          importStatus={importStatus}
          importPreview={importPreview}
          csvMapping={csvMapping}
          csvHeaders={csvHeaders}
          csvRows={csvRows}
          importValidation={importValidation}
          importHistory={importHistory}
          onSyncIntegrations={() => { void syncIntegrations(); }}
          onConnectIntegration={(id) => { void connectIntegration(id); }}
          onCsvMappingChange={(field, value) => setCsvMapping((current) => ({ ...current, [field]: value }))}
          onApplyCsvImport={() => { void applyCsvImport(); }}
          onDownloadTemplate={downloadTemplate}
          onRefreshImportHistory={() => { void loadImportHistory(); }}
          onReverseImport={(batchId) => { void reverseImport(batchId); }}
        />

        <ReportsModule
          isActive={moduleVisibility.reportes}
          showReports={visible.reports}
          reportSettings={reportSettings}
          report={report}
          dateRangeLabel={dateRangeLabel}
          salesReportHighlights={salesReportHighlights}
          microAction={microAction}
          canGenerateReports={permissions.canGenerateReports}
          onReportSettingsChange={setReportSettings}
          onGenerateReport={() => { void generateReport(); }}
          onDownloadReport={downloadReport}
          formatCop={formatCop}
        />

        <CashModule
          isActive={moduleVisibility.caja}
          metrics={metrics}
          monthlyGoal={customer.monthlyGoal}
          salesPercent={salesPercent}
          marginRule={rules.margin}
          stockRule={rules.stock}
          showMargin={visible.margin}
          showStock={visible.stock}
          formatMoney={formatMoney}
          formatGoal={formatGoal}
          cashDays={cashDays}
        />

        <section className="content-grid dashboard-module-section" data-active={isCommercialModule}>
          <AlertsModule
            isActive={moduleVisibility.alertas}
            alerts={alerts}
            rules={rules}
            microAction={microAction}
            canManageRules={permissions.canManageRules}
            onRulesChange={setRules}
            onApplyRules={() => { void applyRules(); }}
          />
          <SalesModule
            isActive={moduleVisibility.ventas}
            visibleProducts={visible.products}
            visibleDecisions={visible.decisions}
            visibleCopilot={visible.copilot}
            canRegisterSales={permissions.canRegisterSales}
            canRegisterDecisions={permissions.canRegisterDecisions}
            salesInsightCards={salesInsightCards}
            quickSaleForm={quickSaleForm}
            quickSaleStatus={quickSaleStatus}
            manualSaleForm={manualSaleForm}
            manualSaleStatus={manualSaleStatus}
            salesCatalogs={salesCatalogs}
            salesSummaryCards={salesSummaryCards}
            filteredSales={filteredSales}
            filteredSalesTotal={filteredSalesTotal}
            salesFilters={salesFilters}
            editingSaleId={editingSaleId}
            editingSale={editingSale}
            chartData={chartData}
            trendCards={trendCards}
            weeklyVariation={weeklyVariation}
            weeklyTotal={weeklyTotal}
            bestDay={bestDay}
            selectedSalesCount={selectedSales.length}
            salesPercent={salesPercent}
            salesRule={rules.sales}
            products={products}
            decisions={decisions}
            activeDecisionId={activeDecisionId}
            microAction={microAction}
            customerCompanyName={customer.companyName}
            openDecisions={openDecisions}
            question={question}
            answer={answer}
            onSubmitQuickSale={submitQuickSale}
            onQuickProductChange={selectProductForQuickSale}
            onQuickFieldChange={updateQuickSaleField}
            onSubmitManualSale={submitManualSale}
            onManualProductChange={selectProductForManualSale}
            onManualFieldChange={updateManualSaleField}
            onFilterChange={updateSalesFilter}
            onClearFilters={() => setSalesFilters({ startDate: "", endDate: "", customer: "", product: "", channel: "", salesRep: "", status: "", search: "" })}
            onRefreshSalesData={() => { void loadSalesData(); }}
            onStartEditingSale={startEditingSale}
            onEditingSaleChange={(patch) => setEditingSale((current) => ({ ...current, ...patch }))}
            onSaveQuickSaleEdit={(saleId) => { void saveQuickSaleEdit(saleId); }}
            onCancelEdit={() => setEditingSaleId("")}
            onAddDecision={addDecision}
            onUpdateDecisionStatus={(decisionId, status) => { void updateDecisionStatus(decisionId, status); }}
            onGenerateSalesReading={() => setAnswer(`Ventas: ${formatMoney(weeklyTotal)} en ${dateRangeLabel}. Mejor dia: ${bestDay.day}. ${recommendedAction()}`)}
            onGenerateBrief={() => setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`)}
            onQuestionChange={setQuestion}
            onAnswerQuestion={answerQuestion}
            onPromptSelect={(prompt) => {
              setQuestion(prompt);
              setAnswer(`Mi recomendacion: ${recommendedAction()}`);
            }}
            recommendedAction={recommendedAction}
            formatMoney={formatMoney}
            formatShortDate={formatShortDate}
          />
        </section>

        </div>

      </main>

      <nav className="mobile-quick-nav" aria-label="Módulos principales móviles">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button aria-current={activeModule === item.id ? "page" : undefined} type="button" onClick={() => navigateModule(item.id)} key={item.id}>
              <Icon aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
