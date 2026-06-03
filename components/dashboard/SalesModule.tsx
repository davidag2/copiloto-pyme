"use client";

import { useMemo, useRef, useState } from "react";
import type { CSSProperties, FormEvent, PointerEvent, UIEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  Brain,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  FileText,
  PackageCheck,
  Percent,
  Search,
  ShoppingCart,
  TrendingUp,
  UserCheck,
  Users,
  X
} from "lucide-react";

type Product = { name: string; sales: string; stock: "Bajo" | "Normal" | "Critico" };
type Decision = {
  id: number | string;
  text: string;
  owner: string;
  impact: string;
  status: "Pendiente" | "En curso" | "Completada";
  date: string;
};
type SalesCatalogOption = { id: string; name: string; unitPrice?: string | number };
type RecentSale = {
  id: string;
  saleDate: string;
  customerName: string;
  productName: string;
  channelName: string;
  salesRepName: string;
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
type SalesInsightCard = {
  label: string;
  value: string;
  text: string;
  icon: LucideIcon;
  tone: string;
};
type SalesSummaryCard = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
};
type TrendCard = {
  id: string;
  title: string;
  value: string;
  helper: string;
  dataKey: string;
  color: string;
  suffix: string;
};
type ChartPoint = Record<string, string | number>;
type SalesAction = "sale" | "product" | "channel" | "seller" | "discount" | "receivable";
type SecondarySalesAction = Exclude<SalesAction, "sale">;

type SalesModuleProps = {
  isActive: boolean;
  visibleProducts: boolean;
  visibleDecisions: boolean;
  visibleCopilot: boolean;
  canRegisterSales: boolean;
  canRegisterDecisions: boolean;
  salesInsightCards: SalesInsightCard[];
  quickSaleForm: QuickSaleForm;
  quickSaleStatus: string;
  manualSaleForm: ManualSaleForm;
  manualSaleStatus: string;
  salesCatalogs: SalesCatalogs;
  salesSummaryCards: SalesSummaryCard[];
  filteredSales: RecentSale[];
  filteredSalesTotal: number;
  salesFilters: SalesFilters;
  editingSaleId: string;
  editingSale: EditingSale;
  chartData: ChartPoint[];
  trendCards: TrendCard[];
  weeklyVariation: number;
  weeklyTotal: number;
  bestDay: { day: string; value: number };
  selectedSalesCount: number;
  salesPercent: number;
  salesRule: number;
  products: Product[];
  decisions: Decision[];
  activeDecisionId: number | string;
  microAction: string | null;
  customerCompanyName: string;
  openDecisions: number;
  question: string;
  answer: string;
  onSubmitQuickSale: (event: FormEvent<HTMLFormElement>) => void;
  onQuickProductChange: (value: string) => void;
  onQuickFieldChange: (field: keyof QuickSaleForm, value: string) => void;
  onSubmitManualSale: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitSalesAction: (action: SecondarySalesAction, formData: FormData) => Promise<string | void>;
  onManualProductChange: (value: string) => void;
  onManualFieldChange: (field: keyof ManualSaleForm, value: ManualSaleForm[keyof ManualSaleForm]) => void;
  onFilterChange: (field: keyof SalesFilters, value: string) => void;
  onClearFilters: () => void;
  onRefreshSalesData: () => void;
  onStartEditingSale: (sale: RecentSale) => void;
  onEditingSaleChange: (patch: Partial<EditingSale>) => void;
  onSaveQuickSaleEdit: (saleId: string) => void;
  onCancelEdit: () => void;
  onAddDecision: (event: FormEvent<HTMLFormElement>) => void;
  onUpdateDecisionStatus: (decisionId: Decision["id"], status: Decision["status"]) => void;
  onGenerateSalesReading: () => void;
  onGenerateBrief: () => void;
  onQuestionChange: (value: string) => void;
  onAnswerQuestion: () => void;
  onPromptSelect: (prompt: string) => void;
  recommendedAction: () => string;
  formatMoney: (value: number) => string;
  formatShortDate: (date: string) => string;
};

const SALES_TABLE_ROW_HEIGHT = 58;
const SALES_TABLE_VIEWPORT_HEIGHT = 520;
const SALES_TABLE_OVERSCAN = 8;

const money = (value: string | number) =>
  Number(value || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function sumSales(sales: RecentSale[], predicate: (sale: RecentSale) => boolean) {
  return sales.filter(predicate).reduce((total, sale) => total + Number(sale.total || 0), 0);
}

function topBy<T extends string>(sales: RecentSale[], selector: (sale: RecentSale) => T) {
  const totals = new Map<T, { label: T; amount: number; count: number }>();
  sales.forEach((sale) => {
    const label = selector(sale);
    const current = totals.get(label) || { label, amount: 0, count: 0 };
    current.amount += Number(sale.total || 0);
    current.count += Number(sale.quantity || 1);
    totals.set(label, current);
  });
  return Array.from(totals.values()).sort((a, b) => b.amount - a.amount);
}

function parseMoneyLabel(value: string) {
  return Number(value.replace(/[^\d-]/g, "") || 0);
}

export function SalesModule({
  isActive,
  canRegisterSales,
  manualSaleForm,
  manualSaleStatus,
  salesCatalogs,
  salesSummaryCards,
  filteredSales,
  filteredSalesTotal,
  salesFilters,
  editingSaleId,
  editingSale,
  weeklyVariation,
  weeklyTotal,
  salesPercent,
  salesRule,
  products,
  onSubmitManualSale,
  onSubmitSalesAction,
  onManualProductChange,
  onManualFieldChange,
  onFilterChange,
  onClearFilters,
  onRefreshSalesData,
  onStartEditingSale,
  onEditingSaleChange,
  onSaveQuickSaleEdit,
  onCancelEdit,
  onGenerateSalesReading,
  recommendedAction,
  formatMoney,
  formatShortDate
}: SalesModuleProps) {
  const hasSalesData = filteredSales.length > 0;
  const todayTotal = parseMoneyLabel(salesSummaryCards.find((card) => {
    const label = card.label.toLowerCase();
    return label.includes("día") || label.includes("dia");
  })?.value || "");
  const monthTotal = parseMoneyLabel(salesSummaryCards.find((card) => card.label.toLowerCase().includes("mes"))?.value || "");
  const pendingTotal = sumSales(filteredSales, (sale) => sale.status === "pendiente");
  const discountTotal = filteredSales.reduce((total, sale) => total + Number(sale.discount || 0), 0);
  const averageTicket = filteredSales.length ? filteredSalesTotal / filteredSales.length : 0;
  const recentSales = filteredSales.slice(0, 3);
  const receivables = filteredSales.filter((sale) => sale.status === "pendiente").slice(0, 3);
  const topProducts = topBy(filteredSales, (sale) => sale.productName).slice(0, 3);
  const channels = topBy(filteredSales, (sale) => sale.channelName || "Sin canal").slice(0, 5);
  const reps = topBy(filteredSales, (sale) => sale.salesRepName || "Sin vendedor").slice(0, 4);
  const paymentMethods = topBy(filteredSales, (sale) => sale.paymentMethodName || "Sin método").slice(0, 4);
  const channelTotal = Math.max(channels.reduce((total, channel) => total + channel.amount, 0), 1);
  const paidCount = filteredSales.filter((sale) => sale.status === "pagada").length;
  const pendingCount = filteredSales.filter((sale) => sale.status === "pendiente").length;
  const cancelledCount = filteredSales.filter((sale) => sale.status === "anulada").length;
  const [salesTableScrollTop, setSalesTableScrollTop] = useState(0);
  const [activeSalesAction, setActiveSalesAction] = useState<SalesAction | null>(null);
  const [salesActionStatus, setSalesActionStatus] = useState("");
  const [salesModalPosition, setSalesModalPosition] = useState<{ x: number; y: number } | null>(null);
  const salesModalDragOffset = useRef<{ x: number; y: number } | null>(null);

  const virtualSales = useMemo(() => {
    const totalRows = filteredSales.length;
    const visibleRows = Math.ceil(SALES_TABLE_VIEWPORT_HEIGHT / SALES_TABLE_ROW_HEIGHT) + SALES_TABLE_OVERSCAN * 2;
    const startIndex = Math.max(0, Math.floor(salesTableScrollTop / SALES_TABLE_ROW_HEIGHT) - SALES_TABLE_OVERSCAN);
    const endIndex = Math.min(totalRows, startIndex + visibleRows);
    return {
      bottomPadding: Math.max(0, (totalRows - endIndex) * SALES_TABLE_ROW_HEIGHT),
      endIndex,
      rows: filteredSales.slice(startIndex, endIndex),
      startIndex,
      topPadding: startIndex * SALES_TABLE_ROW_HEIGHT,
      totalRows
    };
  }, [filteredSales, salesTableScrollTop]);

  const handleSalesTableScroll = (event: UIEvent<HTMLDivElement>) => {
    setSalesTableScrollTop(event.currentTarget.scrollTop);
  };

  const aiSuggestion = !hasSalesData
    ? "Importa ventas desde Datos o registra tu primera venta manual para activar recomendaciones reales."
    : salesPercent < salesRule
    ? `Contactar clientes que compraron ${products[0]?.name ?? "tu producto líder"} hace más de 15 días.`
    : recommendedAction();
  const estimatedTotal = Math.max((Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice)) - Number(manualSaleForm.discount || 0), 0);
  const dataSignals = [
    { label: "Ventas registradas", value: filteredSales.length, helper: "base para tendencias" },
    { label: "Clientes", value: hasSalesData ? salesCatalogs.customers.length : 0, helper: "recompra y frecuencia" },
    { label: "Productos", value: hasSalesData ? salesCatalogs.products.length : 0, helper: "rotación y margen" },
    { label: "Canales", value: hasSalesData ? salesCatalogs.channels.length : 0, helper: "dónde vendes mejor" }
  ];
  const salesActionButtons = [
    { label: "Nueva venta", helper: "Registrar venta completa", icon: ShoppingCart, action: "sale" },
    { label: "Producto", helper: "Crear producto o servicio", icon: PackageCheck, action: "product" },
    { label: "Canal", helper: "Agregar canal de venta", icon: BarChart3, action: "channel" },
    { label: "Vendedor", helper: "Asignar responsable", icon: UserCheck, action: "seller" },
    { label: "Descuento", helper: "Registrar promoción", icon: Percent, action: "discount" },
    { label: "Pago pendiente", helper: "Crear cuenta por cobrar", icon: CreditCard, action: "receivable" }
  ] satisfies { label: string; helper: string; icon: LucideIcon; action: SalesAction }[];
  const activeSalesActionConfig = salesActionButtons.find((item) => item.action === activeSalesAction);

  const openSalesAction = (action: SalesAction) => {
    setSalesActionStatus("");
    setSalesModalPosition(null);
    setActiveSalesAction(action);
  };

  const closeSalesAction = () => {
    setSalesModalPosition(null);
    setActiveSalesAction(null);
  };

  const submitSecondarySalesAction = async (event: FormEvent<HTMLFormElement>, action: SecondarySalesAction, label: string) => {
    event.preventDefault();
    const form = event.currentTarget;
    setSalesActionStatus(`Guardando ${label.toLowerCase()}...`);
    const message = await onSubmitSalesAction(action, new FormData(form));
    setSalesActionStatus(message || `${label} guardado. La IA ya puede usar este dato en el analisis comercial.`);
    form.reset();
  };

  const startSalesModalDrag = (event: PointerEvent<HTMLElement>) => {
    const target = event.target as HTMLElement;
    if (target.closest("button, input, select, textarea, a")) return;

    const modal = event.currentTarget;

    const rect = modal.getBoundingClientRect();
    event.preventDefault();
    salesModalDragOffset.current = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
    setSalesModalPosition({ x: rect.left, y: rect.top });
    modal.setPointerCapture(event.pointerId);
  };

  const moveSalesModal = (event: PointerEvent<HTMLElement>) => {
    if (!salesModalDragOffset.current) return;

    const modal = event.currentTarget;

    const rect = modal.getBoundingClientRect();
    const margin = 12;
    const maxX = Math.max(margin, window.innerWidth - rect.width - margin);
    const maxY = Math.max(margin, window.innerHeight - rect.height - margin);
    const nextX = Math.min(Math.max(margin, event.clientX - salesModalDragOffset.current.x), maxX);
    const nextY = Math.min(Math.max(margin, event.clientY - salesModalDragOffset.current.y), maxY);
    setSalesModalPosition({ x: nextX, y: nextY });
  };

  const stopSalesModalDrag = (event: PointerEvent<HTMLElement>) => {
    salesModalDragOffset.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <section className="sales-command-center dashboard-module-section" data-active={isActive}>
      <header className="sales-page-heading">
        <div>
          <h2>Ventas</h2>
          <p>Registra ventas, productos, canales, vendedores, descuentos, pagos pendientes y comportamiento comercial para que la IA recomiende mejores decisiones.</p>
        </div>
        <div className="sales-page-actions">
          <button className="sales-date-button" type="button"><CalendarDays aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="sales-icon-button" type="button" onClick={onRefreshSalesData} aria-label="Actualizar ventas"><TrendingUp aria-hidden="true" /></button>
          <button className="primary-button" type="button" onClick={() => openSalesAction("sale")}><ShoppingCart aria-hidden="true" />Nueva venta</button>
        </div>
      </header>

      <section className="sales-action-launchpad" aria-label="Acciones operativas de ventas">
        <div>
          <span>Herramientas comerciales</span>
          <h3>Registra la operación que alimenta las decisiones de IA</h3>
        </div>
        <div className="sales-action-buttons">
          {salesActionButtons.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className="sales-action-button"
                data-action={item.action}
                key={item.action}
                onClick={() => openSalesAction(item.action)}
                type="button"
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                <small>{item.helper}</small>
              </button>
            );
          })}
        </div>
      </section>

      <div className="sales-kpi-row">
        {[
          { label: "Ventas de hoy", value: hasSalesData ? todayTotal : 0, helper: hasSalesData ? `${weeklyVariation >= 0 ? "+" : ""}${weeklyVariation}% vs ayer` : "Sin ventas registradas", icon: BarChart3, tone: "purple" },
          { label: "Ventas del mes", value: hasSalesData ? monthTotal : 0, helper: hasSalesData ? "Calculado con tus ventas" : "Importa o registra ventas", icon: CalendarDays, tone: "blue" },
          { label: "Pagos pendientes", value: pendingTotal, helper: `${pendingCount} cliente(s) por cobrar`, icon: FileText, tone: "amber" },
          { label: "Ticket promedio", value: averageTicket, helper: "promedio por venta", icon: DollarSign, tone: "green" }
        ].map((card) => {
          const Icon = card.icon;
          return (
            <article className="sales-kpi-card" data-tone={card.tone} key={card.label}>
              <span><Icon aria-hidden="true" /></span>
              <div>
                <small>{card.label}</small>
                <strong>{formatMoney(card.value)}</strong>
                <em>{card.helper}</em>
              </div>
            </article>
          );
        })}
      </div>

      <article className="sales-ai-banner">
        <div className="sales-ai-orb" aria-hidden="true"><Bot /></div>
        <div>
          <span>Motor de sugerencias OpenAI</span>
          <h3>{hasSalesData ? "Convierte cada venta en una decisión comercial y administrativa." : "Ventas empieza en cero: importa o registra datos para activar la IA."}</h3>
          <p><b>Lectura actual:</b> {aiSuggestion}</p>
          <ul className="sales-ai-signal-list">
            <li><Brain aria-hidden="true" /> Cruza cliente, producto, canal, vendedor, descuento y estado de pago.</li>
            <li><AlertTriangle aria-hidden="true" /> Detecta caída de ventas, cartera vencida, canales débiles y descuentos excesivos.</li>
            <li><ClipboardCheck aria-hidden="true" /> Propone acción, responsable e impacto esperado para Inicio.</li>
          </ul>
        </div>
        <aside>
          <span>Impacto estimado</span>
          <strong>{formatMoney(hasSalesData ? Math.max(pendingTotal * 0.2, 0) : 0)}</strong>
          <small>Posible ingreso o cartera recuperada</small>
          <button className="primary-button micro-button" type="button" onClick={onGenerateSalesReading}>Generar sugerencia</button>
        </aside>
      </article>

      <section className="sales-ai-data-grid" aria-label="Datos que alimentan OpenAI">
        <article className="sales-ai-data-card sales-ai-data-card-main">
          <span><Brain aria-hidden="true" /></span>
          <div>
            <small>Datos comerciales para mejores decisiones</small>
            <h3>{filteredSales.length ? "La IA ya tiene señales para recomendar acciones." : "Registra ventas para activar recomendaciones reales."}</h3>
            <p>Mientras más completos estén los campos de ventas, mejores serán las sugerencias sobre precios, cartera, productos, canales y vendedores.</p>
          </div>
        </article>
        {dataSignals.map((signal) => (
          <article className="sales-ai-data-card" key={signal.label}>
            <strong>{signal.value}</strong>
            <span>{signal.label}</span>
            <small>{signal.helper}</small>
          </article>
        ))}
      </section>

      <nav className="sales-work-tabs" aria-label="Herramientas de ventas">
        {[
          ["Registrar venta", ShoppingCart],
          ["Ventas recientes", CalendarDays],
          ["Por cobrar", CreditCard],
          ["Clientes", Users],
          ["Productos", PackageCheck],
          ["Canales", BarChart3]
        ].map(([label, Icon]) => {
          const TabIcon = Icon as LucideIcon;
          return <button className={label === "Registrar venta" ? "active" : ""} type="button" key={String(label)}><TabIcon aria-hidden="true" />{String(label)}</button>;
        })}
      </nav>

      <div className="sales-workspace">
        <article className="sales-register-card sales-compact-operations-card">
          <div className="sales-form-heading">
            <span>Centro operativo</span>
            <h3>Registra solo lo necesario, cuando lo necesites.</h3>
            <p>Usa los botones superiores para abrir cada popup. Así Ventas se mantiene limpio y la IA recibe datos completos sin llenar la pantalla de formularios.</p>
            <small>{manualSaleStatus || "Los datos registrados alimentan Inicio, alertas y sugerencias de OpenAI."}</small>
          </div>

          <div className="sales-form-grid">
            <label><span>Fecha</span><input type="date" value={manualSaleForm.saleDate} onChange={(event) => onManualFieldChange("saleDate", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Cliente</span><input list="sales-customers-list" value={manualSaleForm.customerName} onChange={(event) => onManualFieldChange("customerName", event.target.value)} placeholder="Buscar cliente" disabled={!canRegisterSales} required /><datalist id="sales-customers-list">{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Producto o servicio</span><input list="sales-products-list" value={manualSaleForm.productName} onChange={(event) => onManualProductChange(event.target.value)} placeholder="Buscar producto" disabled={!canRegisterSales} required /><datalist id="sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Cantidad</span><input type="number" min="0.01" step="0.01" value={manualSaleForm.quantity} onChange={(event) => onManualFieldChange("quantity", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Precio unitario</span><input type="number" min="0" step="100" value={manualSaleForm.unitPrice} onChange={(event) => onManualFieldChange("unitPrice", event.target.value)} placeholder="50000" disabled={!canRegisterSales} required /></label>
            <label><span>Descuento</span><input type="number" min="0" step="100" value={manualSaleForm.discount} onChange={(event) => onManualFieldChange("discount", event.target.value)} disabled={!canRegisterSales} /></label>
            <label><span>Canal</span><input list="sales-channels-list" value={manualSaleForm.channelName} onChange={(event) => onManualFieldChange("channelName", event.target.value)} placeholder="WhatsApp, tienda, web..." disabled={!canRegisterSales} required /><datalist id="sales-channels-list">{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Vendedor</span><input list="sales-reps-list" value={manualSaleForm.salesRepName} onChange={(event) => onManualFieldChange("salesRepName", event.target.value)} placeholder="Responsable" disabled={!canRegisterSales} required /><datalist id="sales-reps-list">{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Método de pago</span><input list="sales-payment-methods-list" value={manualSaleForm.paymentMethodName} onChange={(event) => onManualFieldChange("paymentMethodName", event.target.value)} placeholder="Efectivo, transferencia, crédito cliente" disabled={!canRegisterSales} required /><datalist id="sales-payment-methods-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Estado de pago</span><select value={manualSaleForm.status} onChange={(event) => onManualFieldChange("status", event.target.value as ManualSaleForm["status"])} disabled={!canRegisterSales}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
            <label className="sales-notes-field"><span>Notas</span><textarea value={manualSaleForm.notes} onChange={(event) => onManualFieldChange("notes", event.target.value)} placeholder="Observaciones, entrega, condiciones, promoción aplicada..." disabled={!canRegisterSales} /></label>
          </div>

          <footer className="sales-register-footer">
            <div><span>Total estimado</span><strong>{money(estimatedTotal)}</strong></div>
            <div><span>Señal para IA</span><strong>{manualSaleForm.status === "pendiente" ? "Cartera" : manualSaleForm.discount ? "Descuento" : "Demanda"}</strong></div>
            <button className="primary-button" type="button" onClick={() => openSalesAction("sale")} disabled={!canRegisterSales}><ClipboardCheck aria-hidden="true" />Nueva venta</button>
          </footer>
        </article>

        <aside className="sales-side-panels">
          <article className="sales-side-card sales-decision-card">
            <header><strong>Señales para decidir hoy</strong><button type="button" onClick={onGenerateSalesReading}>Analizar</button></header>
            <div className="sales-decision-list">
              <p><TrendingUp aria-hidden="true" /><span>Canal más fuerte</span><b>{channels[0]?.label || "Sin canal"}</b></p>
              <p><UserCheck aria-hidden="true" /><span>Vendedor destacado</span><b>{reps[0]?.label || "Sin vendedor"}</b></p>
              <p><CreditCard aria-hidden="true" /><span>Pagos pendientes</span><b>{pendingCount}</b></p>
              <p><Percent aria-hidden="true" /><span>Descuentos aplicados</span><b>{money(discountTotal)}</b></p>
            </div>
          </article>

          <article className="sales-side-card sales-recent-card">
            <header><strong>Ventas recientes</strong><button type="button" onClick={onRefreshSalesData}>Ver todas</button></header>
            {recentSales.length ? (
              <table><tbody>{recentSales.map((sale) => <tr key={sale.id}><td>{formatShortDate(sale.saleDate)}</td><td>{sale.customerName}</td><td>{money(sale.total)}</td><td><span data-status={sale.status}>{sale.status}</span></td><td><button type="button" onClick={() => onStartEditingSale(sale)}>Editar</button></td></tr>)}</tbody></table>
            ) : <p className="module-empty-note">Sin ventas registradas. Importa un archivo o guarda tu primera venta manual.</p>}
          </article>

          <div className="sales-mini-grid">
            <article className="sales-side-card">
              <header><strong>Por cobrar</strong><button type="button" onClick={() => onFilterChange("status", "pendiente")}>Ver todas</button></header>
              <div className="sales-receivable-list">
                {receivables.length ? receivables.map((sale) => <p key={sale.id}><span>{sale.customerName}</span><b>{money(sale.total)}</b><small>pendiente</small></p>) : <p className="module-empty-note">No hay cuentas por cobrar registradas.</p>}
              </div>
              <footer><span>Total por cobrar</span><strong>{money(pendingTotal)}</strong></footer>
            </article>

            <article className="sales-side-card">
              <header><strong>Ventas por canal</strong></header>
              <div className="sales-channel-card">
                <div className="sales-donut" data-empty={!channels.length} style={{ "--p1": "0%", "--p2": "0%", "--p3": "0%" } as CSSProperties} />
                <div>{channels.map((channel, index) => <p key={channel.label}><i data-index={index} /><span>{channel.label}</span><b>{Math.round((channel.amount / channelTotal) * 100)}%</b></p>)}</div>
              </div>
              <footer><span>Total</span><strong>{money(filteredSalesTotal)}</strong></footer>
            </article>
          </div>

          <article className="sales-side-card">
            <header><strong>Productos más vendidos</strong><button type="button">Ver todas</button></header>
            <div className="sales-product-list">
              {topProducts.length ? topProducts.map((product, index) => (
                <p key={product.label}><span>{product.label}</span><small>{product.count || 0} uds</small><b>{money(product.amount)}</b><em className={index === 2 ? "danger" : "positive"}>{index === 2 ? "-5%" : `+${18 - index * 6}%`}</em></p>
              )) : <p className="module-empty-note">Sin productos vendidos todavía.</p>}
            </div>
          </article>

          <article className="sales-side-card">
            <header><strong>Comportamiento comercial</strong><button type="button">Ver detalle</button></header>
            <div className="sales-behavior-grid">
              <p><span>Pagadas</span><b>{paidCount}</b></p>
              <p><span>Pendientes</span><b>{pendingCount}</b></p>
              <p><span>Anuladas</span><b>{cancelledCount}</b></p>
              <p><span>Métodos</span><b>{paymentMethods.length}</b></p>
            </div>
          </article>
        </aside>
      </div>

      <details className="sales-advanced-panel" data-active={isActive}>
        <summary><Search aria-hidden="true" /> Filtros, edición rápida y auditoría comercial</summary>
        <div className="sales-filter-grid">
          <label><span>Desde</span><input type="date" value={salesFilters.startDate} onChange={(event) => onFilterChange("startDate", event.target.value)} /></label>
          <label><span>Hasta</span><input type="date" value={salesFilters.endDate} onChange={(event) => onFilterChange("endDate", event.target.value)} /></label>
          <label><span>Cliente</span><select value={salesFilters.customer} onChange={(event) => onFilterChange("customer", event.target.value)}><option value="">Todos</option>{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Producto</span><select value={salesFilters.product} onChange={(event) => onFilterChange("product", event.target.value)}><option value="">Todos</option>{salesCatalogs.products.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Canal</span><select value={salesFilters.channel} onChange={(event) => onFilterChange("channel", event.target.value)}><option value="">Todos</option>{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Vendedor</span><select value={salesFilters.salesRep} onChange={(event) => onFilterChange("salesRep", event.target.value)}><option value="">Todos</option>{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Estado</span><select value={salesFilters.status} onChange={(event) => onFilterChange("status", event.target.value)}><option value="">Todos</option><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
          <label><span>Búsqueda</span><input value={salesFilters.search} onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Buscar venta, cliente o producto" /></label>
          <button className="secondary-button" type="button" onClick={onClearFilters}>Limpiar</button>
        </div>

        <div className="sales-table-meta">
          <span>Mostrando {virtualSales.totalRows ? virtualSales.startIndex + 1 : 0}-{virtualSales.endIndex} de {virtualSales.totalRows} ventas filtradas · Total {money(filteredSalesTotal)}</span>
        </div>
        <div className="sales-table-wrap sales-virtual-table-wrap" onScroll={handleSalesTableScroll}>
          <table className="sales-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Canal</th><th>Vendedor</th><th>Pago</th><th>Estado</th><th>Total</th><th>Edición</th></tr></thead>
            <tbody>
              {virtualSales.topPadding ? <tr className="sales-spacer-row" aria-hidden="true"><td colSpan={9} style={{ height: virtualSales.topPadding }} /></tr> : null}
              {virtualSales.rows.map((sale) => {
                const isEditing = editingSaleId === sale.id;
                return (
                  <tr data-status={sale.status} key={sale.id}>
                    <td>{isEditing ? <input type="date" value={editingSale.saleDate} onChange={(event) => onEditingSaleChange({ saleDate: event.target.value })} /> : formatShortDate(sale.saleDate)}</td>
                    <td>{sale.customerName}</td>
                    <td>{sale.productName}</td>
                    <td>{sale.channelName}</td>
                    <td>{sale.salesRepName}</td>
                    <td>{sale.paymentMethodName}</td>
                    <td>{isEditing ? <select value={editingSale.status} onChange={(event) => onEditingSaleChange({ status: event.target.value as RecentSale["status"] })}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select> : <span className="sale-status-pill">{sale.status}</span>}</td>
                    <td>{money(sale.total)}</td>
                    <td>{isEditing ? <div className="quick-edit-controls"><input value={editingSale.notes} onChange={(event) => onEditingSaleChange({ notes: event.target.value })} placeholder="Notas" /><button className="primary-button" type="button" onClick={() => onSaveQuickSaleEdit(sale.id)}>Guardar</button><button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button></div> : <button className="secondary-button" type="button" onClick={() => onStartEditingSale(sale)}>Editar</button>}</td>
                  </tr>
                );
              })}
              {!virtualSales.totalRows ? <tr><td colSpan={9}><p className="module-empty-note">No hay ventas para mostrar con estos filtros.</p></td></tr> : null}
              {virtualSales.bottomPadding ? <tr className="sales-spacer-row" aria-hidden="true"><td colSpan={9} style={{ height: virtualSales.bottomPadding }} /></tr> : null}
            </tbody>
          </table>
        </div>
      </details>

      {activeSalesAction && activeSalesActionConfig ? (
        <div className="sales-modal-backdrop" role="presentation" onClick={closeSalesAction}>
          <section
            className="sales-action-modal"
            data-dragged={salesModalPosition ? "true" : "false"}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sales-action-modal-title"
            onClick={(event) => event.stopPropagation()}
            onLostPointerCapture={stopSalesModalDrag}
            onPointerCancel={stopSalesModalDrag}
            onPointerDown={startSalesModalDrag}
            onPointerMove={moveSalesModal}
            onPointerUp={stopSalesModalDrag}
            style={salesModalPosition ? { left: salesModalPosition.x, position: "fixed", right: "auto", top: salesModalPosition.y } : undefined}
          >
            <header>
              <div className="sales-modal-icon">
                <activeSalesActionConfig.icon aria-hidden="true" />
              </div>
              <div>
                <span>Acción comercial</span>
                <h3 id="sales-action-modal-title">{activeSalesActionConfig.label}</h3>
                <p>{activeSalesActionConfig.helper}. Estos datos alimentan el análisis de ventas y las sugerencias de OpenAI.</p>
              </div>
              <button type="button" aria-label="Cerrar formulario" onClick={closeSalesAction}>
                <X aria-hidden="true" />
              </button>
            </header>

            {activeSalesAction === "sale" ? (
              <form
                className="sales-modal-form"
                onSubmit={(event) => {
                  onSubmitManualSale(event);
                  setSalesActionStatus("Venta enviada. Copiloto Pyme actualizará las señales comerciales.");
                }}
              >
                <div className="sales-modal-grid">
                  <label><span>Fecha</span><input type="date" value={manualSaleForm.saleDate} onChange={(event) => onManualFieldChange("saleDate", event.target.value)} disabled={!canRegisterSales} required /></label>
                  <label><span>Cliente</span><input list="sales-customers-list" value={manualSaleForm.customerName} onChange={(event) => onManualFieldChange("customerName", event.target.value)} placeholder="Buscar cliente" disabled={!canRegisterSales} required /></label>
                  <label><span>Producto o servicio</span><input list="sales-products-list" value={manualSaleForm.productName} onChange={(event) => onManualProductChange(event.target.value)} placeholder="Buscar producto" disabled={!canRegisterSales} required /></label>
                  <label><span>Cantidad</span><input type="number" min="0.01" step="0.01" value={manualSaleForm.quantity} onChange={(event) => onManualFieldChange("quantity", event.target.value)} disabled={!canRegisterSales} required /></label>
                  <label><span>Precio unitario</span><input type="number" min="0" step="100" value={manualSaleForm.unitPrice} onChange={(event) => onManualFieldChange("unitPrice", event.target.value)} placeholder="50000" disabled={!canRegisterSales} required /></label>
                  <label><span>Descuento</span><input type="number" min="0" step="100" value={manualSaleForm.discount} onChange={(event) => onManualFieldChange("discount", event.target.value)} disabled={!canRegisterSales} /></label>
                  <label><span>Canal</span><input list="sales-channels-list" value={manualSaleForm.channelName} onChange={(event) => onManualFieldChange("channelName", event.target.value)} placeholder="WhatsApp, tienda, web..." disabled={!canRegisterSales} required /></label>
                  <label><span>Vendedor</span><input list="sales-reps-list" value={manualSaleForm.salesRepName} onChange={(event) => onManualFieldChange("salesRepName", event.target.value)} placeholder="Responsable" disabled={!canRegisterSales} required /></label>
                  <label><span>Método de pago</span><input list="sales-payment-methods-list" value={manualSaleForm.paymentMethodName} onChange={(event) => onManualFieldChange("paymentMethodName", event.target.value)} placeholder="Efectivo, transferencia, crédito cliente" disabled={!canRegisterSales} required /></label>
                  <label><span>Estado de pago</span><select value={manualSaleForm.status} onChange={(event) => onManualFieldChange("status", event.target.value as ManualSaleForm["status"])} disabled={!canRegisterSales}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
                  <label className="sales-modal-wide"><span>Notas</span><textarea value={manualSaleForm.notes} onChange={(event) => onManualFieldChange("notes", event.target.value)} placeholder="Observaciones, entrega, condiciones, promoción aplicada..." disabled={!canRegisterSales} /></label>
                </div>
                <footer>
                  <div><span>Total estimado</span><strong>{money(estimatedTotal)}</strong></div>
                  <button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button>
                  <button className="primary-button" type="submit" disabled={!canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar venta</button>
                </footer>
              </form>
            ) : null}

            {activeSalesAction === "product" ? (
              <form className="sales-modal-form" onSubmit={(event) => { void submitSecondarySalesAction(event, "product", "Producto"); }}>
                <div className="sales-modal-grid">
                  <label><span>Nombre</span><input name="name" placeholder="Café Premium 500g" required /></label>
                  <label><span>Precio</span><input name="price" type="number" min="0" step="100" placeholder="50000" required /></label>
                  <label><span>Categoría</span><input name="category" placeholder="Alimentos, servicio, accesorio..." required /></label>
                  <label><span>Stock opcional</span><input name="stock" type="number" min="0" placeholder="0" /></label>
                </div>
                <footer><p>{salesActionStatus || "La IA usará producto, precio, categoría y stock para detectar rotación, margen y riesgo comercial."}</p><button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button><button className="primary-button" type="submit">Guardar producto</button></footer>
              </form>
            ) : null}

            {activeSalesAction === "channel" ? (
              <form className="sales-modal-form" onSubmit={(event) => { void submitSecondarySalesAction(event, "channel", "Canal"); }}>
                <div className="sales-modal-grid">
                  <label><span>Tipo de canal</span><select name="type" required><option value="">Seleccionar</option><option>Tienda física</option><option>WhatsApp</option><option>Página web</option><option>Instagram</option><option>Marketplace</option><option>Referidos</option></select></label>
                  <label><span>Nombre visible</span><input name="name" placeholder="WhatsApp principal" required /></label>
                  <label><span>Responsable</span><input name="owner" placeholder="Andrés Vélez" /></label>
                  <label><span>Meta mensual</span><input name="goal" type="number" min="0" step="1000" placeholder="5000000" /></label>
                </div>
                <footer><p>{salesActionStatus || "Copiloto comparará canales para saber dónde vendes más, dónde baja la conversión y qué canal merece más foco."}</p><button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button><button className="primary-button" type="submit">Guardar canal</button></footer>
              </form>
            ) : null}

            {activeSalesAction === "seller" ? (
              <form className="sales-modal-form" onSubmit={(event) => { void submitSecondarySalesAction(event, "seller", "Vendedor"); }}>
                <div className="sales-modal-grid">
                  <label><span>Nombre</span><input name="name" placeholder="María Gómez" required /></label>
                  <label><span>Email</span><input name="email" type="email" placeholder="maria@empresa.com" required /></label>
                  <label><span>Rol</span><select name="role" required><option value="">Seleccionar</option><option>Vendedor</option><option>Administrador comercial</option><option>Atención al cliente</option><option>Operaciones</option></select></label>
                  <label><span>Canal asignado</span><input name="channel" placeholder="Tienda, WhatsApp, web..." /></label>
                </div>
                <footer><p>{salesActionStatus || "Con vendedores asignados, la IA puede identificar desempeño, cartera pendiente y oportunidades por responsable."}</p><button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button><button className="primary-button" type="submit">Guardar vendedor</button></footer>
              </form>
            ) : null}

            {activeSalesAction === "discount" ? (
              <form className="sales-modal-form" onSubmit={(event) => { void submitSecondarySalesAction(event, "discount", "Descuento"); }}>
                <div className="sales-modal-grid">
                  <label><span>Producto</span><input list="sales-products-list" name="product" placeholder="Producto o servicio" required /></label>
                  <label><span>Porcentaje</span><input name="percent" type="number" min="0" max="100" step="0.1" placeholder="10" required /></label>
                  <label><span>Motivo</span><input name="reason" placeholder="Promoción, cliente frecuente, liquidación..." required /></label>
                  <label><span>Fecha</span><input name="date" type="date" required /></label>
                </div>
                <footer><p>{salesActionStatus || "La IA revisará descuentos excesivos, impacto en margen y promociones que sí generan recompra."}</p><button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button><button className="primary-button" type="submit">Guardar descuento</button></footer>
              </form>
            ) : null}

            {activeSalesAction === "receivable" ? (
              <form className="sales-modal-form" onSubmit={(event) => { void submitSecondarySalesAction(event, "receivable", "Pago pendiente"); }}>
                <div className="sales-modal-grid">
                  <label><span>Cliente</span><input list="sales-customers-list" name="customer" placeholder="Cliente por cobrar" required /></label>
                  <label><span>Valor</span><input name="amount" type="number" min="0" step="1000" placeholder="850000" required /></label>
                  <label><span>Vencimiento</span><input name="dueDate" type="date" required /></label>
                  <label><span>Estado</span><select name="status" required><option>Pendiente</option><option>Vence pronto</option><option>Vencido</option><option>En acuerdo</option></select></label>
                </div>
                <footer><p>{salesActionStatus || "Copiloto usará cartera, vencimiento y estado para alertar caja, riesgo y prioridad de cobro."}</p><button className="secondary-button" type="button" onClick={closeSalesAction}>Cancelar</button><button className="primary-button" type="submit">Guardar pago pendiente</button></footer>
              </form>
            ) : null}
          </section>
        </div>
      ) : null}
    </section>
  );
}
