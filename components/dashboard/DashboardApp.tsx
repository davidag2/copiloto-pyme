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
  ClipboardCheck,
  Clock3,
  Database,
  FileText,
  Link2,
  LockKeyhole,
  Moon,
  PackageCheck,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Settings2,
  Sun,
  Target,
  TrendingUp,
  Upload,
  UserCircle,
  Users,
  WalletCards,
  X
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Button } from "@/components/ui/button";
import { evaluateBasicRules, thresholdsFromRules } from "@/lib/rule-engine";
import type { CompanyAlertRule } from "@/lib/rule-engine";
import { canManageTeam, companyRoles, roleCapabilities, roleLabel } from "@/lib/roles";

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
type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: { variation?: number } }>;
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

function SalesTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const variation = payload[0]?.payload?.variation;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.name} style={{ color: item.color }}>{item.name}: {formatMoney(Number(item.value ?? 0))}</span>
      ))}
      {typeof variation === "number" && <em>Variacion diaria: {variation >= 0 ? "+" : ""}{variation}%</em>}
    </div>
  );
}

function MiniSparkline({ data, tone }: { data: number[]; tone: string }) {
  const width = 112;
  const height = 42;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className="mini-sparkline" data-tone={tone} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendencia del indicador">
      <polyline points={points} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <circle cx={points.split(" ").at(-1)?.split(",")[0] ?? width} cy={points.split(" ").at(-1)?.split(",")[1] ?? height / 2} r="3.5" fill="currentColor" />
    </svg>
  );
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

function statusForSales(sales: number, goal: number) {
  const percent = goal ? (sales / (goal / 1_000_000)) * 100 : 0;
  return percent >= 80 ? "green" : percent >= 55 ? "yellow" : "red";
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
  const userDisplayName = authUser?.name || customer.ownerName || "Andrés Vélez";
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

  function navigateModule(item: NavItem) {
    setActiveModule(item.id);
  }

  return (
    <div id="appView" className={`app-shell theme-${theme}`}>
      <header className="mobile-app-bar">
        <div className="brand"><div className="brand-mark">CP</div><div><strong>Copiloto Pyme</strong><span>{customer.companyName}</span></div></div>
        <div className="mobile-app-actions">
          <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}<span>{theme === "dark" ? "Claro" : "Oscuro"}</span></button>
          <a className="secondary-button" href="/">Portal</a>
        </div>
      </header>

      <aside className="sidebar">
        <div className="sidebar-brand-panel">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">CP</div>
            <div><strong>Copiloto Pyme</strong><span>AI Command Center</span></div>
          </div>
          <div className="sidebar-product-status">
            <span data-status={overallStatusTone} />
            <strong>{overallStatusTone === "red" ? "Atención alta" : overallStatusTone === "yellow" ? "Revisión activa" : "Operación estable"}</strong>
          </div>
        </div>

        <div className="company-switcher" aria-label="Empresa activa">
          <label htmlFor="companySwitcher">Empresa activa</label>
          <div>
            <Building2 aria-hidden="true" />
            <select id="companySwitcher" value={customer.companyName} onChange={(event) => setCustomer((current) => ({ ...current, companyName: event.target.value }))}>
              <option value={customer.companyName}>{customer.companyName}</option>
            </select>
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
                onClick={() => navigateModule(item)}
                type="button"
                key={item.id}
              >
                <Icon aria-hidden="true" />{item.label}
              </button>
            );
          })}
        </nav>
        <div className="tenant-card">
          <span>Sesión empresarial</span>
          <strong>{authUser?.name || "Usuario demo"}</strong>
          <small>{activeRoleLabel} · Tenant {tenantShortId}</small>
          <div className="tenant-card-metrics">
            <span>{connectedIntegrations}/{integrations.length} fuentes</span>
            <span>{openDecisions} pendientes</span>
          </div>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div className="topbar-greeting">
            <h1>¡Hola, {userFirstName}! <Sparkles aria-hidden="true" /></h1>
            <p>{currentDateLabel}</p>
          </div>
          <div className="topbar-actions">
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
            <label className="upload-button" aria-disabled={!permissions.canImportData}><input type="file" accept=".csv" disabled={!permissions.canImportData} onChange={handleCsvUpload} /><Upload aria-hidden="true" />Importar CSV</label>
            <button className="secondary-button" type="button" onClick={downloadTemplate}><FileText aria-hidden="true" />Plantilla CSV</button>
            <button className="primary-button" type="button" onClick={() => { void refreshMetrics(); }} disabled={!permissions.canImportData}><RefreshCw aria-hidden="true" />Actualizar datos</button>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}<span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span></button>
            <a className="secondary-button" href="/">Portal</a>
          </div>
        </header>

        <section id="dashboardInicio" className="ai-home-hero dashboard-module-section" data-status={overallStatusTone} aria-label="Inicio Copiloto AI">
          <div className="ai-home-copy">
            <span className="ai-home-eyebrow"><Sparkles aria-hidden="true" />Copiloto AI</span>
            <h2>Tu negocio, mejor cada día.</h2>
            <strong>Sugerencias inteligentes para hoy</strong>
            <p>Analizamos ventas, caja e inventario para mostrarte la prioridad del día, el impacto esperado y la acción exacta que debe ejecutar tu equipo.</p>
            <div className="ai-home-meta">
              <span><Clock3 aria-hidden="true" />{dateRangeLabel}</span>
              <span data-status={overallStatusTone}>{overallStatus}</span>
              <span><Database aria-hidden="true" />{kpiSourceStatus}</span>
              <span><Database aria-hidden="true" />{aiSuggestionsStatus}</span>
            </div>
            <button className="primary-button ai-home-action" type="button" onClick={() => { void loadAiSuggestions(); setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`); }}>
              <Sparkles aria-hidden="true" />Actualizar sugerencias <ArrowRight aria-hidden="true" />
            </button>
          </div>
          <div className="ai-suggestion-grid">
            {aiSuggestions.map((suggestion) => {
              const Icon = suggestion.icon;
              return (
                <article className="ai-suggestion-card" data-tone={suggestion.tone} key={suggestion.title}>
                  <div className="ai-suggestion-top">
                    <span className="ai-suggestion-icon"><Icon aria-hidden="true" /></span>
                    <span className="ai-suggestion-label">{suggestion.label}</span>
                    <ArrowRight aria-hidden="true" />
                  </div>
                  <strong>{suggestion.title}</strong>
                  <p>{suggestion.text}</p>
                  <small>Impacto estimado</small>
                  <b>{suggestion.impact}</b>
                  {suggestion.id ? <a className="ai-suggestion-detail-link" href={`/dashboard/suggestions/${suggestion.id}`}>Ver detalle</a> : null}
                </article>
              );
            })}
          </div>
          <div className="ai-home-kpi-row" aria-label="Datos rápidos de Inicio">
            {aiHomeKpis.map((item) => {
              const Icon = item.icon;
              return (
                <article className="ai-home-kpi-card" data-tone={item.tone} key={item.label}>
                  <div>
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <small>{item.helper}</small>
                    <em>{item.delta}</em>
                  </div>
                  <Icon aria-hidden="true" />
                  <MiniSparkline data={item.trend} tone={item.tone} />
                </article>
              );
            })}
          </div>
        </section>

        <section className="ai-impact-section" aria-label="Impacto de las sugerencias AI">
          <article className="ai-impact-chart-card">
            <div className="panel-heading">
              <div>
                <span><Sparkles aria-hidden="true" />Impacto de las sugerencias AI</span>
                <h2>Si aplicas las sugerencias de alta prioridad, podrías lograr:</h2>
              </div>
            </div>
            <div className="ai-impact-summary">
              {aiImpactSummaryCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div data-tone={item.tone} key={item.type}>
                    <Icon aria-hidden="true" />
                    <strong>{item.value ? formatCopCompact(item.value) : "$0"}</strong>
                    <span>{item.label}</span>
                    <small>{item.helper}</small>
                  </div>
                );
              })}
            </div>
            <div className="ai-impact-total">
              <span>Impacto total estimado</span>
              <strong>{formatCopCompact(aiImpactLift)}</strong>
              <small>{aiSuggestionRows.length ? "Calculado desde PostgreSQL" : "Estimado demo hasta conectar datos"}</small>
            </div>
            <div className="ai-impact-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiImpactData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}M`} />
                  <Tooltip content={<SalesTooltip />} />
                  <Line type="monotone" dataKey="actual" name="Ventas actuales" stroke="#6d5dfc" strokeWidth={3} dot={false} />
                  <Line type="monotone" dataKey="withAi" name="Con sugerencias AI" stroke="#22c55e" strokeWidth={3} strokeDasharray="6 6" dot={false} />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className="ai-impact-side-card">
            <div className="panel-heading">
              <div><span><Target aria-hidden="true" />Sugerencias por categoría</span><h2>Prioriza dónde actuar</h2></div>
              <button className="ghost-button" type="button" onClick={() => setAnswer(`Sugerencias por categoria: ${aiImpactCategories.map((category) => `${category.label} ${category.count}`).join(", ")}.`)}>Ver todas</button>
            </div>
            <div className="ai-category-panel-summary">
              <strong>{aiImpactCategories.reduce((total, item) => total + item.count, 0)}</strong>
              <span>categorías con sugerencias activas</span>
              <small>{aiSuggestionRows.length ? "Datos desde PostgreSQL" : "Vista demo sin datos cargados"}</small>
            </div>
            <div className="ai-category-list" aria-label="Sugerencias agrupadas por categoría">
              {aiImpactCategories.map((category) => {
                const Icon = category.icon;
                return (
                  <div className="ai-category-row" data-tone={category.tone} key={category.label}>
                    <div className="ai-category-main">
                      <span><Icon aria-hidden="true" />{category.label}</span>
                      <strong>{category.count} sugerencia(s)</strong>
                      <small>{category.tag}</small>
                    </div>
                    <div className="ai-category-impact">
                      <strong>{formatCopCompact(category.impactTotal)}</strong>
                      <em>impacto</em>
                    </div>
                    <div className="ai-category-progress" aria-hidden="true">
                      <span style={{ width: `${Math.max(8, (category.impactTotal / aiCategoryMaxImpact) * 100)}%` }} />
                    </div>
                    {category.firstSuggestionId ? <a href={`/dashboard/suggestions/${category.firstSuggestionId}`}>Abrir</a> : null}
                  </div>
                );
              })}
            </div>
            <div className="ai-impact-footnote">
              <Sparkles aria-hidden="true" />
              <span>{aiImpactCategories.reduce((total, item) => total + item.count, 0)} sugerencias activas</span>
              <small>Actualizadas hoy a las 8:30 a. m.</small>
            </div>
          </article>

          <article className="ai-impact-side-card">
            <div className="panel-heading">
              <div><span><Clock3 aria-hidden="true" />Actividad reciente de AI</span><h2>Últimas señales</h2></div>
              <button className="secondary-button compact-button" type="button" onClick={() => { void loadActivity(); }}>
                <RefreshCw aria-hidden="true" />Actualizar
              </button>
            </div>
            <div className="ai-activity-list">
              {aiActivity.map((activity) => {
                const Icon = activity.icon;
                return (
                  <div className="ai-activity-item" data-tone={activity.tone} key={activity.id}>
                    <span><Icon aria-hidden="true" /></span>
                    <div><strong>{activity.title}</strong><small>{activity.text}</small></div>
                    <div className="ai-activity-meta">
                      <time>{activity.time}</time>
                      {activity.href ? <a href={activity.href}>Ver</a> : null}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="ai-activity-status">{activityStatus}</p>
          </article>
        </section>

        {showAutomationStrip && (
          <section className="ai-automation-strip smart-actions-bar" aria-label="Acciones inteligentes del dashboard">
            <div className="ai-automation-intro">
              <span><Sparkles aria-hidden="true" /></span>
              <div>
                <strong>Acciones inteligentes</strong>
                <p>Conecta datos clave, mejora la lectura diaria y cierra esta sugerencia cuando ya no la necesites.</p>
              </div>
            </div>
            <div className="ai-automation-actions">
              {automationActions.map((action) => {
                const Icon = action.icon;
                const integration = integrations.find((item) => item.id === action.id);
                const isConnected = integration?.status === "Conectado";
                const isFuture = action.kind === "future";
                const isDismiss = action.kind === "dismiss";
                return (
                  <article className="ai-automation-card" data-connected={isConnected} data-featured={action.featured} data-future={isFuture} key={action.id}>
                    <Icon aria-hidden="true" />
                    <div><strong>{action.title}</strong><small>{isConnected ? "Conectado y sincronizado" : action.text}</small></div>
                    <button
                      className={action.featured ? "primary-button micro-button" : "secondary-button micro-button"}
                      data-motion={activeIntegrationId === action.id ? "active" : undefined}
                      type="button"
                      onClick={() => {
                        if (isDismiss) dismissSmartSuggestion();
                        else void connectIntegration(action.id);
                      }}
                      disabled={isFuture || (!isDismiss && !permissions.canManageIntegrations)}
                    >
                      {isConnected ? "Reconectar" : action.buttonLabel}
                    </button>
                  </article>
                );
              })}
            </div>
            <button className="ai-automation-close" type="button" onClick={() => setShowAutomationStrip(false)} aria-label="Ocultar sugerencia de integraciones">
              <X aria-hidden="true" />
            </button>
          </section>
        )}

        <section className="setup-summary">
          <div><span>Empresa / tenant</span><strong>{companyId ? `ID ${tenantShortId}` : "Demo local"}</strong></div>
          <div><span>Rol activo</span><strong>{activeRoleLabel}</strong></div>
          <div><span>Moneda</span><strong>{customer.currency.split(" - ")[0]}</strong></div>
          <div><span>Meta mensual</span><strong>{formatGoal(customer.monthlyGoal)}</strong></div>
        </section>
        <p className="persistence-note">{persistenceStatus}</p>
        {microFeedback && (
          <div className="micro-feedback" data-action={microAction ?? undefined}>
            <CheckCircle2 aria-hidden="true" />
            <span>{microFeedback}</span>
          </div>
        )}

        <section id="dashboardClientes" className="team-panel dashboard-module-section">
            <div className="panel-heading">
              <div><span><Link2 aria-hidden="true" />Autenticacion y equipo</span><h2>Roles por empresa</h2></div>
              <button className="secondary-button" type="button" onClick={() => { void loadTeam(); }}>Actualizar equipo</button>
            </div>
          <div className="tenant-scope-banner">
            <strong>{customer.companyName}</strong>
            <span>Todos los usuarios, invitaciones, reportes, decisiones, integraciones y datos importados quedan filtrados por <b>company_id</b>: {tenantShortId}.</span>
          </div>
          <div className="team-layout">
            <div className="session-card">
              <span>Sesion activa</span>
              <strong>{authUser ? authUser.name : "Demo sin login"}</strong>
              <small>{authUser ? `${authUser.email} · ${activeRoleLabel}` : "Crea una cuenta o inicia sesion para activar roles reales."}</small>
              <div className="permission-list">
                <span data-enabled={permissions.canManageTeam}>Equipo</span>
                <span data-enabled={permissions.canImportData}>Importar</span>
                <span data-enabled={permissions.canManageIntegrations}>Integraciones</span>
                <span data-enabled={permissions.canGenerateReports}>Reportes</span>
                <span data-enabled={permissions.canManageRules}>Reglas</span>
              </div>
              <button className="ghost-button" type="button" onClick={logout}>Cerrar sesion</button>
            </div>
            <form className="invite-form" onSubmit={inviteTeamMember}>
              <label>Email del invitado<input type="email" value={inviteForm.email} onChange={(event) => setInviteForm({ ...inviteForm, email: event.target.value })} required /></label>
              <label>Rol<select value={inviteForm.role} onChange={(event) => setInviteForm({ ...inviteForm, role: event.target.value })}>{companyRoles.filter((role) => role.value !== "propietario").map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}</select></label>
              <button className="primary-button" type="submit" disabled={!permissions.canManageTeam}>Invitar</button>
              {inviteLink && <small>Link demo: {inviteLink}</small>}
            </form>
          </div>
          <div className="role-matrix" aria-label="Permisos por rol">
            {companyRoles.map((role) => {
              const capability = roleCapabilities(role.value);
              return (
                <article key={role.value}>
                  <strong>{role.label}</strong>
                  <span>{role.description}</span>
                  <small>{[
                    capability.canManageTeam && "equipo",
                    capability.canImportData && "datos",
                    capability.canManageIntegrations && "integraciones",
                    capability.canGenerateReports && "reportes",
                    capability.canRegisterDecisions && "decisiones"
                  ].filter(Boolean).join(" · ")}</small>
                </article>
              );
            })}
          </div>
          <div className="team-grid">
            {teamMembers.map((member) => (
              <article className="team-member-card" data-status={member.status} key={member.id}>
                <strong>{member.name}</strong>
                <span>{member.email}</span>
                <small>{roleLabel(member.role)} · {member.status}</small>
              </article>
            ))}
            {invitations.map((invitation) => (
              <article className="team-member-card" data-status={invitation.status} key={invitation.id}>
                <strong>Invitacion pendiente</strong>
                <span>{invitation.email}</span>
                <small>{roleLabel(invitation.role)} · expira {new Date(invitation.expiresAt).toLocaleDateString("es-CO")}</small>
              </article>
            ))}
          </div>
        </section>

        <section id="dashboardConfiguracion" className="customizer-panel dashboard-module-section">
          <div className="panel-heading"><div><span><Settings2 aria-hidden="true" />Dashboard personalizable</span><h2>Elige que ve cada usuario</h2></div>
            <select value={focus} onChange={(event) => setFocus(event.target.value)}><option value="owner">Propietario / Gerencia</option><option value="admin">Administrador</option><option value="finance">Contador</option><option value="sales">Ventas</option></select>
          </div>
          <div className="customizer-grid">
            {Object.keys(visible).map((key) => (
              <label key={key}><input type="checkbox" checked={visible[key as keyof typeof visible]} onChange={(event) => setVisible({ ...visible, [key]: event.target.checked })} /> {key}</label>
            ))}
          </div>
        </section>

        {visible.integrations && (
          <section id="mobileIntegrationsAnchor" className="integrations-panel">
            <div className="panel-heading"><div><span><Link2 aria-hidden="true" />Integraciones latinoamericanas</span><h2>Conecta tus fuentes de datos</h2></div><button className="primary-button micro-button" data-motion={microAction === "sync" ? "active" : undefined} type="button" onClick={syncIntegrations} disabled={!permissions.canManageIntegrations}><RefreshCw aria-hidden="true" />Sincronizar</button></div>
            {connectedIntegrations === 0 && (
              <EmptyState
                icon={Link2}
                title="Aun no hay integraciones conectadas"
                text="Conecta tu primera fuente para que ventas, caja e inventario empiecen a actualizarse con menos trabajo manual."
                action={<button className="primary-button" type="button" onClick={() => connectIntegration("sheets")} disabled={!permissions.canManageIntegrations}>Conectar Google Sheets</button>}
              />
            )}
            <div className="integrations-grid">
              {integrations.map((integration) => (
                <article className="integration-card" data-future={integration.id === "banking"} data-motion={activeIntegrationId === integration.id ? "active" : undefined} data-status={integration.status} key={integration.id}>
                  <div><span><Database aria-hidden="true" />{integration.category}</span><strong>{integration.name}</strong><small>{integration.sync}</small></div>
                  <button className="secondary-button micro-button" data-motion={activeIntegrationId === integration.id ? "active" : undefined} type="button" onClick={() => connectIntegration(integration.id)} disabled={integration.id === "banking" || !permissions.canManageIntegrations}>{integration.id === "banking" ? "Próximamente" : integration.status === "Conectado" ? "Reconectar" : "Conectar"}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.reports && (
          <section id="dashboardReportes" className="reports-panel dashboard-module-section">
            <div className="panel-heading"><div><span><FileText aria-hidden="true" />Reportes automáticos</span><h2>Envíos para gerencia</h2></div><button className="primary-button micro-button" data-motion={microAction === "report" ? "active" : undefined} type="button" onClick={generateReport} disabled={!permissions.canGenerateReports}><FileText aria-hidden="true" />Generar reporte</button></div>
            <div className="reports-layout">
              <div className="reports-sidebar">
                <form className="report-settings">
                  <label>Frecuencia<select value={reportSettings.frequency} onChange={(event) => setReportSettings({ ...reportSettings, frequency: event.target.value })}><option>Diario</option><option>Semanal</option><option>Mensual</option></select></label>
                  <label>Canal<select value={reportSettings.channel} onChange={(event) => setReportSettings({ ...reportSettings, channel: event.target.value })}><option>Email</option><option>WhatsApp</option><option>Email y WhatsApp</option></select></label>
                  <label>Destinatario<input value={reportSettings.recipient} onChange={(event) => setReportSettings({ ...reportSettings, recipient: event.target.value })} /></label>
                  <button className="secondary-button" type="button" onClick={downloadReport}><FileText aria-hidden="true" />Descargar TXT</button>
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
                    action={<button className="primary-button" type="button" onClick={generateReport} disabled={!permissions.canGenerateReports}>Generar primer reporte</button>}
                  />
                )}
              </div>
            </div>
          </section>
        )}

        <section id="dashboardCaja" className="goals-panel dashboard-module-section">
          <div className="panel-heading"><div><span><Target aria-hidden="true" />Metas y semaforos</span><h2>Avance contra objetivos</h2></div><button className="secondary-button" type="button"><RefreshCw aria-hidden="true" />Recalcular</button></div>
          <div className="goals-grid">
            {[
              ["sales", "Meta mensual de ventas", `${formatMoney(metrics.sales)} de ${formatGoal(customer.monthlyGoal)}`, salesPercent],
              ["cash", "Caja disponible", `${cashDays(metrics.cash)} dias de cobertura`, Math.min((cashDays(metrics.cash) / 25) * 100, 100)],
              ["margin", "Margen minimo", `${metrics.margin.toFixed(1)}% contra meta de ${rules.margin}%`, Math.min((metrics.margin / 35) * 100, 100)],
              ["stock", "Inventario critico", `${metrics.criticalStock} SKU requieren atencion`, Math.max(0, 100 - metrics.criticalStock * 12)]
            ].map(([key, title, text, percent]) => (
              <article className="goal-card" data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} key={String(key)}>
                <div className="goal-topline"><span className="traffic-light" data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} /><strong>{title}</strong></div>
                <p>{text}</p><div className="progress-track"><span data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} style={{ width: `${percent}%` }} /></div>
              </article>
            ))}
          </div>
        </section>

        <section id="dashboardAlertas" className="rules-panel dashboard-module-section">
          <div className="panel-heading"><div><span><AlertTriangle aria-hidden="true" />Alertas configurables</span><h2>Reglas de riesgo del negocio</h2></div><button className="primary-button micro-button" data-motion={microAction === "rules" ? "active" : undefined} type="button" onClick={() => { void applyRules(); }} disabled={!permissions.canManageRules}><Settings2 aria-hidden="true" />Aplicar reglas</button></div>
          <div className="rules-grid" data-motion={microAction === "rules" ? "active" : undefined}>
            <label><span>Ventas bajo meta</span><input type="number" value={rules.sales} onChange={(event) => setRules({ ...rules, sales: Number(event.target.value) })} /><small>% minimo de avance mensual</small></label>
            <label><span>Caja insuficiente</span><input type="number" value={rules.cash} onChange={(event) => setRules({ ...rules, cash: Number(event.target.value) })} /><small>Dias minimos de cobertura</small></label>
            <label><span>Margen bajo</span><input type="number" value={rules.margin} onChange={(event) => setRules({ ...rules, margin: Number(event.target.value) })} /><small>% minimo de margen bruto</small></label>
            <label><span>Inventario critico</span><input type="number" value={rules.stock} onChange={(event) => setRules({ ...rules, stock: Number(event.target.value) })} /><small>SKU maximos en riesgo</small></label>
          </div>
        </section>

        {visible.importer && (
          <section id="dashboardInventario" className="importer-panel dashboard-module-section">
            <div className="panel-heading"><div><span><Upload aria-hidden="true" />Importador real CSV</span><h2>Ventas, caja, gastos e inventario</h2></div><strong>{importStatus}</strong></div>
            <div className="importer-grid">
              <div>
                <p>Mapea las columnas del archivo para detectar errores, duplicados y guardar solo filas validas.</p>
                <div className="mapping-grid">
                  {(Object.keys(csvMapping) as Array<keyof CsvColumnMapping>).map((field) => (
                    <label key={field}>{field}<select value={csvMapping[field]} onChange={(event) => setCsvMapping({ ...csvMapping, [field]: event.target.value })}><option value="">No mapear</option>{csvHeaders.map((header) => <option value={header} key={header}>{header}</option>)}</select></label>
                  ))}
                </div>
                <div className={`import-validation ${importValidation?.errors.length ? "has-errors" : ""}`}>{importPreview}</div>
              </div>
              <div className="preview-box">
                <div className="preview-heading"><span>Vista previa y validacion</span><button className="primary-button" type="button" onClick={applyCsvImport} disabled={!permissions.canImportData || !csvRows.length}><Database aria-hidden="true" />Aplicar importacion</button></div>
                <div className="preview-table">
                  {csvRows.length ? (
                    <table><thead><tr>{csvHeaders.slice(0, 5).map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{csvRows.slice(0, 4).map((row, index) => <tr key={`${row[csvHeaders[0]]}-${index}`}>{csvHeaders.slice(0, 5).map((header) => <td key={header}>{row[header]}</td>)}</tr>)}</tbody></table>
                  ) : (
                    <EmptyState
                      icon={Upload}
                      title="Carga tu primer archivo"
                      text="Importa un CSV para mapear columnas, detectar errores por fila y guardar datos reales en esta empresa."
                      action={<button className="secondary-button" type="button" onClick={downloadTemplate}>Descargar plantilla CSV</button>}
                    />
                  )}
                </div>
                {importValidation?.errors.length ? <div className="row-errors">{importValidation.errors.slice(0, 5).map((error) => <span key={error.rowNumber}>Fila {error.rowNumber}: {error.errors.join(", ")}</span>)}</div> : null}
              </div>
            </div>
            <div className="import-history">
              <div className="preview-heading"><span>Historial de cargas</span><button className="secondary-button" type="button" onClick={() => { void loadImportHistory(); }}>Actualizar historial</button></div>
              <div className="history-list">
                {importHistory.length ? importHistory.map((batch) => (
                  <article key={batch.id} data-status={batch.status}>
                    <div><strong>{batch.fileName || "CSV sin nombre"}</strong><span>{batch.validCount}/{batch.rowCount} validas · {batch.errorCount} errores · {batch.duplicateCount} duplicados</span></div>
                    <small>{new Date(batch.createdAt).toLocaleString("es-CO")} · {batch.status}</small>
                    <button className="secondary-button" type="button" disabled={batch.status === "reversed"} onClick={() => { void reverseImport(batch.id); }}>Reversar</button>
                  </article>
                )) : (
                  <EmptyState
                    icon={Database}
                    title="Sin historial de cargas"
                    text="Cuando apliques una importacion, aqui veras filas validas, errores, duplicados y la opcion de reversar."
                  />
                )}
              </div>
            </div>
          </section>
        )}

        <section className="kpi-grid secondary-kpi-grid">
          {visible.margin && <article className="metric-card" data-status={metrics.margin >= rules.margin ? "green" : "yellow"}><span><Banknote aria-hidden="true" />Margen bruto</span><strong>{metrics.margin.toFixed(1)}%</strong><small className="positive">{(metrics.margin - rules.margin).toFixed(1)} pts vs meta</small></article>}
          {visible.stock && <article className="metric-card" data-status={metrics.criticalStock > rules.stock ? "red" : "green"}><span><Boxes aria-hidden="true" />Inventario critico</span><strong>{metrics.criticalStock} SKU</strong><small className="danger">Requiere atencion hoy</small></article>}
        </section>

        <section className="content-grid">
          <article id="mobileAlertsAnchor" className="panel alerts-panel priority-panel"><div className="panel-heading"><div><span><AlertTriangle aria-hidden="true" />Atencion requerida</span><h2>Alertas inteligentes</h2></div></div><div className="alerts-list">{alerts.map((alert) => <div className="alert-item" data-level={alert.level} key={alert.title}><strong className={alert.level}>{alert.title}</strong><p>{alert.text}</p></div>)}</div></article>
          <article id="dashboardVentas" className="panel chart-panel dashboard-module-section">
            <div className="sales-command-header">
              <div>
                <span><BarChart3 aria-hidden="true" />Ventas recientes</span>
                <h2>Tendencia, meta y oportunidad comercial</h2>
                <p>Copiloto compara el periodo seleccionado contra la semana anterior y marca dónde actuar para cerrar más ventas.</p>
              </div>
              <div className="chart-summary"><strong className={weeklyVariation >= 0 ? "positive" : "danger"}>{weeklyVariation >= 0 ? "+" : ""}{weeklyVariation}%</strong><span>vs semana anterior</span></div>
            </div>
            <div className="sales-insight-grid">
              {salesInsightCards.map((card) => {
                const Icon = card.icon;
                return (
                  <article className="sales-insight-card" data-tone={card.tone} key={card.label}>
                    <span><Icon aria-hidden="true" />{card.label}</span>
                    <strong>{card.value}</strong>
                    <small>{card.text}</small>
                  </article>
                );
              })}
            </div>
            <form className="quick-sale-panel" onSubmit={submitQuickSale} aria-label="Carga manual rápida de venta">
              <div className="quick-sale-copy">
                <span><WalletCards aria-hidden="true" />Carga manual rápida</span>
                <h3>Venta simple</h3>
                <p>Para registrar ventas de mostrador sin llenar todo el formulario. Guardas y sigues capturando.</p>
              </div>
              <label>
                <span>Producto</span>
                <input list="quick-sales-products-list" value={quickSaleForm.productName} onChange={(event) => selectProductForQuickSale(event.target.value)} placeholder="Ej. Café Premium" disabled={!permissions.canRegisterSales} required />
                <datalist id="quick-sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist>
              </label>
              <label>
                <span>Valor</span>
                <input type="number" min="0" step="100" value={quickSaleForm.unitPrice} onChange={(event) => updateQuickSaleField("unitPrice", event.target.value)} placeholder="25000" disabled={!permissions.canRegisterSales} required />
              </label>
              <label>
                <span>Forma de pago</span>
                <input list="quick-sales-payment-list" value={quickSaleForm.paymentMethodName} onChange={(event) => updateQuickSaleField("paymentMethodName", event.target.value)} placeholder="Efectivo" disabled={!permissions.canRegisterSales} required />
                <datalist id="quick-sales-payment-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist>
              </label>
              <div className="quick-sale-action">
                <strong>{Number(quickSaleForm.unitPrice || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</strong>
                <button className="primary-button micro-button" type="submit" disabled={!permissions.canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar y seguir</button>
                <small>{quickSaleStatus}</small>
              </div>
            </form>
            <form className="manual-sale-form" onSubmit={submitManualSale}>
              <div className="manual-sale-heading">
                <div>
                  <span><ClipboardCheck aria-hidden="true" />Registro manual</span>
                  <h3>Registrar una venta</h3>
                  <p>Captura ventas del día cuando no vienen de CSV o integración. Copiloto las usa para métricas, alertas y recomendaciones.</p>
                </div>
                <strong>{manualSaleStatus}</strong>
              </div>
              <div className="manual-sale-grid">
                <label>
                  <span>Fecha</span>
                  <input type="date" value={manualSaleForm.saleDate} onChange={(event) => updateManualSaleField("saleDate", event.target.value)} disabled={!permissions.canRegisterSales} required />
                </label>
                <label>
                  <span>Cliente</span>
                  <input list="sales-customers-list" value={manualSaleForm.customerName} onChange={(event) => updateManualSaleField("customerName", event.target.value)} placeholder="Ej. Café Oriente" disabled={!permissions.canRegisterSales} required />
                  <datalist id="sales-customers-list">{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id} />)}</datalist>
                </label>
                <label>
                  <span>Producto o servicio</span>
                  <input list="sales-products-list" value={manualSaleForm.productName} onChange={(event) => selectProductForManualSale(event.target.value)} placeholder="Ej. Panela Orgánica" disabled={!permissions.canRegisterSales} required />
                  <datalist id="sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist>
                </label>
                <label>
                  <span>Cantidad</span>
                  <input type="number" min="0.01" step="0.01" value={manualSaleForm.quantity} onChange={(event) => updateManualSaleField("quantity", event.target.value)} disabled={!permissions.canRegisterSales} required />
                </label>
                <label>
                  <span>Precio</span>
                  <input type="number" min="0" step="100" value={manualSaleForm.unitPrice} onChange={(event) => updateManualSaleField("unitPrice", event.target.value)} placeholder="50000" disabled={!permissions.canRegisterSales} required />
                </label>
                <label>
                  <span>Descuento</span>
                  <input type="number" min="0" step="100" value={manualSaleForm.discount} onChange={(event) => updateManualSaleField("discount", event.target.value)} disabled={!permissions.canRegisterSales} />
                </label>
                <label>
                  <span>Canal</span>
                  <input list="sales-channels-list" value={manualSaleForm.channelName} onChange={(event) => updateManualSaleField("channelName", event.target.value)} placeholder="Mostrador" disabled={!permissions.canRegisterSales} required />
                  <datalist id="sales-channels-list">{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id} />)}</datalist>
                </label>
                <label>
                  <span>Vendedor</span>
                  <input list="sales-reps-list" value={manualSaleForm.salesRepName} onChange={(event) => updateManualSaleField("salesRepName", event.target.value)} placeholder="Responsable" disabled={!permissions.canRegisterSales} required />
                  <datalist id="sales-reps-list">{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id} />)}</datalist>
                </label>
                <label>
                  <span>Método de pago</span>
                  <input list="sales-payment-methods-list" value={manualSaleForm.paymentMethodName} onChange={(event) => updateManualSaleField("paymentMethodName", event.target.value)} placeholder="Efectivo" disabled={!permissions.canRegisterSales} required />
                  <datalist id="sales-payment-methods-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist>
                </label>
                <label>
                  <span>Estado de pago</span>
                  <select value={manualSaleForm.status} onChange={(event) => updateManualSaleField("status", event.target.value as ManualSaleForm["status"])} disabled={!permissions.canRegisterSales}>
                    <option value="pagada">Pagada</option>
                    <option value="pendiente">Pendiente</option>
                    <option value="anulada">Anulada</option>
                  </select>
                </label>
                <label className="manual-sale-notes">
                  <span>Notas</span>
                  <textarea value={manualSaleForm.notes} onChange={(event) => updateManualSaleField("notes", event.target.value)} placeholder="Observaciones, entrega, condiciones o próximos pasos." disabled={!permissions.canRegisterSales} />
                </label>
              </div>
              <div className="manual-sale-footer">
                <div>
                  <span>Total estimado</span>
                  <strong>{Number.isFinite(Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice) - Number(manualSaleForm.discount || 0)) ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.max((Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice)) - Number(manualSaleForm.discount || 0), 0)) : "$0"}</strong>
                </div>
                <button className="primary-button micro-button" type="submit" disabled={!permissions.canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar venta</button>
              </div>
            </form>
            <div className="sales-summary-panel" aria-label="Resumen de ventas">
              <div className="sales-list-heading">
                <div>
                  <span><TrendingUp aria-hidden="true" />Resumen de ventas</span>
                  <h3>KPIs comerciales</h3>
                  <p>Lectura rápida del módulo: ventas del día, mes, ticket promedio, producto, cliente, canal y cartera pendiente.</p>
                </div>
              </div>
              <div className="sales-summary-grid">
                {salesSummaryCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article className="sales-summary-card" data-tone={card.tone} key={card.label}>
                      <span><Icon aria-hidden="true" />{card.label}</span>
                      <strong>{card.value}</strong>
                      <small>{card.helper}</small>
                    </article>
                  );
                })}
              </div>
            </div>
            <div className="sales-list-panel" aria-label="Listado de ventas">
              <div className="sales-list-heading">
                <div>
                  <span><BarChart3 aria-hidden="true" />Listado de ventas</span>
                  <h3>Ventas registradas</h3>
                  <p>Filtra por fecha, cliente, producto, canal, vendedor, estado o búsqueda libre. Usa edición rápida para corregir datos sin salir del dashboard.</p>
                </div>
                <div>
                  <strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(filteredSalesTotal)}</strong>
                  <span>{filteredSales.length} venta(s)</span>
                </div>
              </div>
              <div className="sales-filter-grid">
                <label><span>Desde</span><input type="date" value={salesFilters.startDate} onChange={(event) => updateSalesFilter("startDate", event.target.value)} /></label>
                <label><span>Hasta</span><input type="date" value={salesFilters.endDate} onChange={(event) => updateSalesFilter("endDate", event.target.value)} /></label>
                <label><span>Cliente</span><select value={salesFilters.customer} onChange={(event) => updateSalesFilter("customer", event.target.value)}><option value="">Todos</option>{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
                <label><span>Producto</span><select value={salesFilters.product} onChange={(event) => updateSalesFilter("product", event.target.value)}><option value="">Todos</option>{salesCatalogs.products.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
                <label><span>Canal</span><select value={salesFilters.channel} onChange={(event) => updateSalesFilter("channel", event.target.value)}><option value="">Todos</option>{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
                <label><span>Vendedor</span><select value={salesFilters.salesRep} onChange={(event) => updateSalesFilter("salesRep", event.target.value)}><option value="">Todos</option>{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
                <label><span>Estado</span><select value={salesFilters.status} onChange={(event) => updateSalesFilter("status", event.target.value)}><option value="">Todos</option><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
                <label className="sales-search-field"><span>Búsqueda</span><input value={salesFilters.search} onChange={(event) => updateSalesFilter("search", event.target.value)} placeholder="Buscar cliente, producto, canal o nota" /></label>
                <button className="secondary-button" type="button" onClick={() => setSalesFilters({ startDate: "", endDate: "", customer: "", product: "", channel: "", salesRep: "", status: "", search: "" })}>Limpiar filtros</button>
                <button className="secondary-button" type="button" onClick={() => { void loadSalesData(); }}>Actualizar</button>
              </div>
              {filteredSales.length ? (
                <div className="sales-table-wrap">
                  <table className="sales-table">
                    <thead>
                      <tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Canal</th><th>Vendedor</th><th>Estado</th><th>Total</th><th>Edición rápida</th></tr>
                    </thead>
                    <tbody>
                      {filteredSales.map((sale) => {
                        const isEditing = editingSaleId === sale.id;
                        return (
                          <tr data-status={sale.status} key={sale.id}>
                            <td>{isEditing ? <input type="date" value={editingSale.saleDate} onChange={(event) => setEditingSale((current) => ({ ...current, saleDate: event.target.value }))} /> : formatShortDate(sale.saleDate)}</td>
                            <td><strong>{sale.customerName}</strong><small>{sale.paymentMethodName}</small></td>
                            <td><strong>{sale.productName}</strong><small>{Number(sale.quantity || 0)} x {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.unitPrice || 0))}</small></td>
                            <td>{sale.channelName}</td>
                            <td>{sale.salesRepName}</td>
                            <td>{isEditing ? <select value={editingSale.status} onChange={(event) => setEditingSale((current) => ({ ...current, status: event.target.value as RecentSale["status"] }))}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select> : <span className="sale-status-pill">{sale.status}</span>}</td>
                            <td><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.total || 0))}</strong>{isEditing ? <input type="number" min="0" step="100" value={editingSale.discount} onChange={(event) => setEditingSale((current) => ({ ...current, discount: event.target.value }))} aria-label="Descuento" /> : <small>Desc. {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.discount || 0))}</small>}</td>
                            <td>{isEditing ? <div className="quick-edit-controls"><input value={editingSale.notes} onChange={(event) => setEditingSale((current) => ({ ...current, notes: event.target.value }))} placeholder="Notas" /><button className="primary-button" type="button" onClick={() => { void saveQuickSaleEdit(sale.id); }}>Guardar</button><button className="secondary-button" type="button" onClick={() => setEditingSaleId("")}>Cancelar</button></div> : <button className="secondary-button" type="button" onClick={() => startEditingSale(sale)}>Editar</button>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No hay ventas con esos filtros"
                  text="Ajusta la búsqueda o registra una venta manual para construir historial comercial y alimentar las sugerencias de IA."
                />
              )}
            </div>
            <div className="trend-metrics">
              <div><span>Total semana</span><strong>{formatMoney(weeklyTotal)}</strong></div>
              <div><span>Mejor dia</span><strong>{bestDay.day}</strong></div>
              <div><span>Promedio diario</span><strong>{formatMoney(weeklyTotal / Math.max(selectedSales.length, 1))}</strong></div>
            </div>
            <div className="trend-chart" aria-label="Grafica de tendencia semanal de ventas">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="var(--line)" strokeDasharray="4 6" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 700 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(value) => `$${value}M`} width={48} />
                  <Tooltip content={<SalesTooltip />} />
                  <Legend iconType="circle" wrapperStyle={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="actual" name="Actual" stroke="none" fill="rgba(37, 99, 235, 0.12)" activeDot={false} />
                  <Line type="monotone" dataKey="target" name="Meta diaria" stroke="var(--amber)" strokeDasharray="6 6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="previous" name="Semana anterior" stroke="var(--muted)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="actual" name="Actual" stroke="var(--brand-blue)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="real-trend-grid" aria-label="Tendencias reales por indicador">
              {trendCards.map((trend) => (
                <article className="real-trend-card" key={trend.id}>
                  <div>
                    <span>{trend.title}</span>
                    <strong>{trend.value}</strong>
                    <small>{trend.helper}</small>
                  </div>
                  <ResponsiveContainer width="100%" height={112}>
                    <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <XAxis dataKey="day" hide />
                      <YAxis hide domain={["dataMin", "dataMax"]} />
                      <Tooltip
                        formatter={(value) => [`${Number(value).toFixed(trend.id === "margin" ? 1 : 0)}${trend.suffix}`, trend.title]}
                        labelStyle={{ color: "var(--ink)", fontWeight: 900 }}
                        contentStyle={{ border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow)" }}
                      />
                      <Line type="monotone" dataKey={trend.dataKey} stroke={trend.color} strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </article>
              ))}
            </div>
            <div className="sales-action-row">
              <span><Sparkles aria-hidden="true" />Acción recomendada</span>
              <strong>{salesPercent < rules.sales ? `Impulsar ${products[0]?.name ?? "producto líder"} hoy para recuperar la meta.` : "Mantener seguimiento y preparar campaña sobre el producto líder."}</strong>
              <button className="secondary-button" type="button" onClick={() => setAnswer(`Ventas: ${formatMoney(weeklyTotal)} en ${dateRangeLabel}. Mejor dia: ${bestDay.day}. ${recommendedAction()}`)}>Generar lectura</button>
            </div>
          </article>
          {visible.products && <article className="panel"><div className="panel-heading"><div><span><PackageCheck aria-hidden="true" />Productos</span><h2>Mas vendidos</h2></div></div><div className="table-list">{products.map((product) => <div className="table-row" key={product.name}><div><strong>{product.name}</strong><span>Stock: {product.stock}</span></div><strong>{product.sales}</strong></div>)}</div></article>}
          {visible.decisions && (
            <article id="mobileDecisionsAnchor" className="panel decisions-panel">
              <div className="panel-heading"><div><span><ClipboardCheck aria-hidden="true" />Historial</span><h2>Decisiones tomadas</h2></div></div>
              <form className="decision-form" data-motion={microAction === "decision" ? "active" : undefined} onSubmit={addDecision}>
                <input name="decision" required disabled={!permissions.canRegisterDecisions} placeholder="Ej. Reponer Panela Organica esta semana" />
                <select name="owner" disabled={!permissions.canRegisterDecisions}><option>Propietario</option><option>Administrador</option><option>Contador</option><option>Ventas</option></select>
                <select name="impact" disabled={!permissions.canRegisterDecisions}><option>Inventario</option><option>Caja</option><option>Ventas</option><option>Margen</option></select>
                <button className="primary-button micro-button" data-motion={microAction === "decision" ? "active" : undefined} type="submit" disabled={!permissions.canRegisterDecisions}><ClipboardCheck aria-hidden="true" />Registrar</button>
              </form>
              <div className="decisions-list">
                {decisions.length ? decisions.map((decision) => (
                  <div className="decision-item" data-motion={activeDecisionId === decision.id ? "active" : undefined} data-status={decision.status} key={decision.id}>
                    <div><strong>{decision.text}</strong><span>{decision.impact} · {decision.owner} · {decision.date}</span></div>
                    <select value={decision.status} onChange={(event) => { void updateDecisionStatus(decision.id, event.target.value as Decision["status"]); }}><option>Pendiente</option><option>En curso</option><option>Completada</option></select>
                  </div>
                )) : (
                  <EmptyState
                    icon={ClipboardCheck}
                    title="No hay decisiones registradas"
                    text="Registra la primera accion para que el equipo tenga seguimiento, responsable e impacto esperado."
                  />
                )}
              </div>
            </article>
          )}
          {visible.copilot && <article id="mobileCopilotAnchor" className="panel copilot-panel"><div className="panel-heading"><div><span><Bot aria-hidden="true" />Copiloto IA</span><h2>Resumen ejecutivo</h2></div><button className="secondary-button" type="button" onClick={() => setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`)}><Bot aria-hidden="true" />Generar brief</button></div><div className="ai-summary"><div className="summary-card"><strong>Lectura de hoy</strong><p>{customer.companyName} va en {salesPercent}% de la meta mensual. El mejor dia reciente fue {bestDay.day} con {formatMoney(bestDay.value)}.</p></div><div className="summary-card"><strong>Accion sugerida</strong><p>{recommendedAction()} Hay {openDecisions} decisiones abiertas.</p></div></div><div className="quick-prompts">{["Que debo revisar hoy?", "Como va la meta mensual?", "Que productos necesitan atencion?", "Que riesgo tiene la caja?"].map((prompt) => <button type="button" key={prompt} onClick={() => { setQuestion(prompt); setAnswer(`Mi recomendacion: ${recommendedAction()}`); }}>{prompt.replace("?", "")}</button>)}</div><div className="prompt-box"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pregunta: que debo revisar hoy?" /><button type="button" onClick={answerQuestion}><Bot aria-hidden="true" />Preguntar</button></div><p className="answer-box">{answer}</p></article>}
        </section>

        <footer className="app-context-bar" aria-label="Acciones contextuales del dashboard">
          <div>
            <span>Copiloto activo</span>
            <strong>{criticalAlerts.length ? `${criticalAlerts.length} alerta(s) por revisar` : "Operación bajo control"}</strong>
          </div>
          <div>
            <span>Datos conectados</span>
            <strong>{connectedIntegrations}/{integrations.length} integraciones</strong>
          </div>
          <div>
            <span>Siguiente acción</span>
            <strong>{recommendedAction()}</strong>
          </div>
          <a className="secondary-button" href="/billing"><FileText aria-hidden="true" />Facturación</a>
          <button className="primary-button" type="button" onClick={() => setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`)}><Sparkles aria-hidden="true" />Generar brief</button>
        </footer>
      </main>

      <nav className="mobile-quick-nav">
        <button aria-current={activeModule === "inicio" ? "page" : undefined} type="button" onClick={() => setActiveModule("inicio")}><Target aria-hidden="true" /><span>Inicio</span></button>
        <button aria-current={activeModule === "ventas" ? "page" : undefined} type="button" onClick={() => setActiveModule("ventas")}><BarChart3 aria-hidden="true" /><span>Ventas</span></button>
        <button aria-current={activeModule === "inventario" ? "page" : undefined} type="button" onClick={() => setActiveModule("inventario")}><Database aria-hidden="true" /><span>Datos</span></button>
        <button aria-current={activeModule === "reportes" ? "page" : undefined} type="button" onClick={() => setActiveModule("reportes")}><FileText aria-hidden="true" /><span>Reportes</span></button>
      </nav>
    </div>
  );
}
