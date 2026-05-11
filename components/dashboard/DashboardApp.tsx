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
  WalletCards
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
import { canManageTeam, companyRoles, roleCapabilities, roleLabel } from "@/lib/roles";

type SalePoint = { day: string; value: number };
type Product = { name: string; sales: string; stock: "Bajo" | "Normal" | "Critico" };
type Alert = { level: "positive" | "warning" | "danger"; title: string; text: string };
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
type ThemeMode = "light" | "dark";
type DateRangeMode = "today" | "7d" | "30d" | "month" | "custom";
type MicroAction = "integration" | "sync" | "rules" | "report" | "decision" | null;
type DashboardModule = "inicio" | "ventas" | "caja" | "inventario" | "clientes" | "reportes" | "alertas" | "configuracion";
type NavItem = { id: DashboardModule; label: string; icon: LucideIcon; sectionId: string };
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
type CsvColumnMapping = { fecha: string; producto: string; ventas: string; stock: string; caja: string; gastos: string; margen: string };
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
type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: { variation?: number } }>;
};

const navItems: NavItem[] = [
  { id: "inicio", label: "Inicio", icon: Target, sectionId: "dashboardInicio" },
  { id: "ventas", label: "Ventas", icon: BarChart3, sectionId: "dashboardVentas" },
  { id: "caja", label: "Caja", icon: WalletCards, sectionId: "dashboardCaja" },
  { id: "inventario", label: "Inventario", icon: Boxes, sectionId: "dashboardInventario" },
  { id: "clientes", label: "Clientes", icon: Users, sectionId: "dashboardClientes" },
  { id: "reportes", label: "Reportes", icon: FileText, sectionId: "dashboardReportes" },
  { id: "alertas", label: "Alertas", icon: AlertTriangle, sectionId: "dashboardAlertas" },
  { id: "configuracion", label: "Configuración", icon: Settings2, sectionId: "dashboardConfiguracion" }
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
    producto: findColumn("producto", "product", "item", "sku"),
    ventas: findColumn("ventas", "venta", "sales", "ingreso"),
    stock: findColumn("stock", "inventario", "existencia"),
    caja: findColumn("caja", "cash"),
    gastos: findColumn("gastos", "expenses", "egresos"),
    margen: findColumn("margen", "margin")
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
  { id: "mercadopago", name: "Mercado Pago", category: "Pagos", status: "Disponible", sync: "Cada hora" },
  { id: "shopify", name: "Shopify", category: "Ecommerce", status: "Disponible", sync: "Cada hora" },
  { id: "woocommerce", name: "WooCommerce", category: "Ecommerce", status: "Disponible", sync: "Cada hora" }
];

const formatMoney = (value: number) => `$${value.toFixed(1)}M`;
const formatGoal = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
const cashDays = (cash: number) => Math.round(cash / 1.55);

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
  const [csvMapping, setCsvMapping] = useState<CsvColumnMapping>({ fecha: "", producto: "", ventas: "", stock: "", caja: "", gastos: "", margen: "" });
  const [importValidation, setImportValidation] = useState<ImportValidation | null>(null);
  const [importHistory, setImportHistory] = useState<ImportBatch[]>([]);
  const [report, setReport] = useState("");
  const [reportSettings, setReportSettings] = useState({ frequency: "Semanal", channel: "Email", recipient: "gerencia@empresa.com" });
  const [microAction, setMicroAction] = useState<MicroAction>(null);
  const [microFeedback, setMicroFeedback] = useState("");
  const [activeIntegrationId, setActiveIntegrationId] = useState("");
  const [activeDecisionId, setActiveDecisionId] = useState<number | string>("");
  const [activeModule, setActiveModule] = useState<DashboardModule>("inicio");
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
    }
  }, [companyId, authUser]);

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
    const nextAlerts: Alert[] = [];
    if (salesPercent < rules.sales) {
      nextAlerts.push({ level: "danger", title: "Ventas bajo regla configurada", text: `Avance actual ${salesPercent}%. La regla exige minimo ${rules.sales}%.` });
    }
    if (cashDays(metrics.cash) < rules.cash) {
      nextAlerts.push({ level: "warning", title: "Caja por debajo del minimo", text: `Cobertura estimada ${cashDays(metrics.cash)} dias. La regla exige ${rules.cash} dias.` });
    }
    if (metrics.margin < rules.margin) {
      nextAlerts.push({ level: "warning", title: "Margen bruto bajo", text: `Margen actual ${metrics.margin.toFixed(1)}%. La regla exige ${rules.margin}%.` });
    }
    if (metrics.criticalStock > rules.stock) {
      nextAlerts.push({ level: "danger", title: "Inventario critico supera el limite", text: `${metrics.criticalStock} SKU en riesgo. La regla permite hasta ${rules.stock}.` });
    }
    return nextAlerts.length ? nextAlerts : [{ level: "positive", title: "Reglas dentro de rango", text: "No hay alertas activas segun los umbrales configurados." }];
  }, [metrics, rules, salesPercent]);
  const criticalAlerts = alerts.filter((alert) => alert.level === "danger" || alert.level === "warning");
  const overallStatus = criticalAlerts.some((alert) => alert.level === "danger")
    ? "Riesgo alto"
    : criticalAlerts.length
      ? "Atencion"
      : "Controlado";
  const overallStatusTone = overallStatus === "Riesgo alto" ? "red" : overallStatus === "Atencion" ? "yellow" : "green";
  const topAlert = criticalAlerts[0] ?? alerts[0];
  const currentDateLabel = new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const userDisplayName = authUser?.name || customer.ownerName || "Andrés Vélez";
  const userFirstName = userDisplayName.split(" ")[0] || "Equipo";
  const userInitials = userDisplayName.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "CP";
  const notificationCount = criticalAlerts.length + openDecisions;

  const selectedSales = useMemo(() => salesForRange(weeklySales, dateRange, customRange), [weeklySales, dateRange, customRange]);
  const dateRangeLabel = rangeLabel(dateRange, customRange);
  const bestDay = selectedSales.reduce((best, item) => (item.value > best.value ? item : best), selectedSales[0] ?? weeklySales[0]);
  const chartData = selectedSales.map((item, index) => {
    const previous = Math.max(4.8, Number((item.value * (0.86 + index * 0.025)).toFixed(1)));
    const target = Number(((customer.monthlyGoal / 1_000_000) / Math.max(selectedSales.length, 1)).toFixed(1));
    return {
      day: item.day,
      actual: Number(item.value.toFixed(1)),
      previous,
      target,
      variation: Number((((item.value - previous) / previous) * 100).toFixed(1))
    };
  });
  const weeklyTotal = selectedSales.reduce((total, item) => total + item.value, 0);
  const previousTotal = chartData.reduce((total, item) => total + item.previous, 0);
  const weeklyVariation = previousTotal ? Math.round(((weeklyTotal - previousTotal) / previousTotal) * 100) : 0;

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

  async function loadImportHistory(activeCompanyId = companyId) {
    if (!activeCompanyId) return;
    const result = await apiJson<{ batches: ImportBatch[] }>(`/api/imports?companyId=${activeCompanyId}`, { method: "GET" });
    if (result.ok) setImportHistory(result.data.batches);
  }

  function refreshMetrics() {
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

  async function generateReport() {
    triggerMicroInteraction("report", `Generando reporte ${reportSettings.frequency.toLowerCase()}...`);
    const text = `Reporte ${reportSettings.frequency} - ${customer.companyName}
Canal: ${reportSettings.channel}
Destinatario: ${reportSettings.recipient}

Resumen ejecutivo
- Ventas: ${formatMoney(metrics.sales)} (${salesPercent}% de la meta ${formatGoal(customer.monthlyGoal)})
- Caja: ${formatMoney(metrics.cash)} (${cashDays(metrics.cash)} dias estimados)
- Margen: ${metrics.margin.toFixed(1)}%
- Inventario critico: ${metrics.criticalStock} SKU
- Integraciones conectadas: ${connectedIntegrations}
- Decisiones abiertas: ${openDecisions}

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
    const results = await Promise.all(alerts.map((alert) => apiJson<EntityResponse<unknown>>("/api/alerts", {
      method: "POST",
      body: JSON.stringify({
        companyId,
        level: alert.level,
        title: alert.title,
        text: alert.text,
        status: alert.level === "positive" ? "resolved" : "open"
      })
    })));
    const failed = results.find((result) => !result.ok);
    setPersistenceStatus(failed && !failed.ok ? `Modo demo local: ${failed.error}` : "Alertas guardadas en PostgreSQL.");
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
      "fecha,producto,ventas,stock,caja,gastos,margen",
      "2026-04-23,Cafe Premium 500g,18400000,8,27600000,2200000,32",
      "2026-04-24,Chocolate Familiar,12700000,24,28900000,1800000,29",
      "2026-04-25,Panela Organica,9800000,3,27100000,1600000,35"
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
    setPersistenceStatus("Importacion avanzada guardada en PostgreSQL.");
    await loadImportHistory(companyId);
  }

  async function reverseImport(batchId: string) {
    if (!companyId) return;
    const result = await apiJson<{ batch: ImportBatch }>("/api/imports", {
      method: "DELETE",
      body: JSON.stringify({ companyId, batchId })
    });
    setPersistenceStatus(result.ok ? "Importacion reversada y filas eliminadas." : `No se pudo reversar: ${result.error}`);
    await loadImportHistory(companyId);
  }

  function navigateModule(item: NavItem) {
    setActiveModule(item.id);
    document.getElementById(item.sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
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
            <button className="notification-button" type="button" aria-label={`${notificationCount} notificaciones`}>
              <Bell aria-hidden="true" />
              {notificationCount ? <span>{notificationCount}</span> : null}
            </button>
            <button className="topbar-profile" type="button" aria-label="Perfil de usuario">
              <span>{userInitials}</span>
              <div><strong>{userDisplayName}</strong><small>{activeRoleLabel}</small></div>
              <UserCircle aria-hidden="true" />
            </button>
            <label className="upload-button" aria-disabled={!permissions.canImportData}><input type="file" accept=".csv" disabled={!permissions.canImportData} onChange={handleCsvUpload} /><Upload aria-hidden="true" />Importar CSV</label>
            <button className="secondary-button" type="button" onClick={downloadTemplate}><FileText aria-hidden="true" />Plantilla CSV</button>
            <button className="primary-button" type="button" onClick={refreshMetrics} disabled={!permissions.canImportData}><RefreshCw aria-hidden="true" />Actualizar datos</button>
            <button className="theme-toggle" type="button" onClick={toggleTheme} aria-pressed={theme === "dark"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>{theme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}<span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span></button>
            <a className="secondary-button" href="/">Portal</a>
          </div>
        </header>

        <section id="dashboardInicio" className="daily-summary dashboard-module-section" data-status={overallStatusTone} aria-label="Resumen ejecutivo del dia">
          <div className="summary-status">
            <span><Clock3 aria-hidden="true" />Resumen del dia</span>
            <strong>{overallStatus}</strong>
            <small>{dateRangeLabel}</small>
          </div>
          <div className="summary-main">
            <span><ClipboardCheck aria-hidden="true" />Decision en 10 segundos</span>
            <h2>{recommendation}</h2>
            <p>{topAlert ? topAlert.text : "No hay bloqueos criticos para revisar ahora."}</p>
          </div>
          <div className="summary-metrics">
            {visible.sales && <div><span><BarChart3 aria-hidden="true" />Ventas</span><strong>{formatMoney(metrics.sales)}</strong><small>{salesPercent}% meta</small></div>}
            {visible.cash && <div><span><WalletCards aria-hidden="true" />Caja</span><strong>{cashDays(metrics.cash)} dias</strong><small>{formatMoney(metrics.cash)}</small></div>}
            <div><span><AlertTriangle aria-hidden="true" />Alertas</span><strong>{criticalAlerts.length}</strong><small>{criticalAlerts.length ? "revisar" : "ok"}</small></div>
            {visible.decisions && <div><span><ClipboardCheck aria-hidden="true" />Pendientes</span><strong>{openDecisions}</strong><small>acciones</small></div>}
          </div>
          <button className="primary-button summary-action" type="button" onClick={() => setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`)}><Bot aria-hidden="true" />Brief</button>
        </section>

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
                <article className="integration-card" data-motion={activeIntegrationId === integration.id ? "active" : undefined} data-status={integration.status} key={integration.id}>
                  <div><span><Database aria-hidden="true" />{integration.category}</span><strong>{integration.name}</strong><small>{integration.sync}</small></div>
                  <button className="secondary-button micro-button" data-motion={activeIntegrationId === integration.id ? "active" : undefined} type="button" onClick={() => connectIntegration(integration.id)} disabled={!permissions.canManageIntegrations}>{integration.status === "Conectado" ? "Reconectar" : "Conectar"}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.reports && (
          <section id="dashboardReportes" className="reports-panel dashboard-module-section">
            <div className="panel-heading"><div><span><FileText aria-hidden="true" />Reportes automaticos</span><h2>Envios para gerencia</h2></div><button className="primary-button micro-button" data-motion={microAction === "report" ? "active" : undefined} type="button" onClick={generateReport} disabled={!permissions.canGenerateReports}><FileText aria-hidden="true" />Generar reporte</button></div>
            <div className="reports-layout">
              <form className="report-settings">
                <label>Frecuencia<select value={reportSettings.frequency} onChange={(event) => setReportSettings({ ...reportSettings, frequency: event.target.value })}><option>Diario</option><option>Semanal</option><option>Mensual</option></select></label>
                <label>Canal<select value={reportSettings.channel} onChange={(event) => setReportSettings({ ...reportSettings, channel: event.target.value })}><option>Email</option><option>WhatsApp</option><option>Email y WhatsApp</option></select></label>
                <label>Destinatario<input value={reportSettings.recipient} onChange={(event) => setReportSettings({ ...reportSettings, recipient: event.target.value })} /></label>
                <button className="secondary-button" type="button" onClick={downloadReport}><FileText aria-hidden="true" />Descargar TXT</button>
              </form>
              <div className="report-preview" data-motion={microAction === "report" ? "active" : undefined}>
                <div className="preview-heading"><span>Vista previa</span><strong>Programado {reportSettings.frequency.toLowerCase()}</strong></div>
                {report ? <pre>{report}</pre> : (
                  <EmptyState
                    icon={FileText}
                    title="Todavia no hay reportes"
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
            <div className="panel-heading">
              <div><span><BarChart3 aria-hidden="true" />Ventas recientes</span><h2>Tendencia y comparativo</h2></div>
              <div className="chart-summary"><strong className={weeklyVariation >= 0 ? "positive" : "danger"}>{weeklyVariation >= 0 ? "+" : ""}{weeklyVariation}%</strong><span>vs semana anterior</span></div>
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
                    <select value={decision.status} onChange={(event) => setDecisions((current) => current.map((item) => item.id === decision.id ? { ...item, status: event.target.value as Decision["status"] } : item))}><option>Pendiente</option><option>En curso</option><option>Completada</option></select>
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
        <a href="#dashboardInicio"><Target aria-hidden="true" /><span>Inicio</span></a>
        <a href="#dashboardVentas"><BarChart3 aria-hidden="true" /><span>Ventas</span></a>
        <a href="#dashboardInventario"><Database aria-hidden="true" /><span>Datos</span></a>
        <a href="#dashboardReportes"><FileText aria-hidden="true" /><span>Reportes</span></a>
      </nav>
    </div>
  );
}
