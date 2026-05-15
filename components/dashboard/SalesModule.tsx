"use client";

import type { FormEvent, ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Bot, ClipboardCheck, PackageCheck, Sparkles, TrendingUp, WalletCards } from "lucide-react";
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
type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: Array<{ name?: string; value?: number; color?: string; payload?: { variation?: number } }>;
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

function SalesTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const variation = payload[0]?.payload?.variation;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((item) => (
        <span key={item.name} style={{ color: item.color }}>{item.name}: {Number(item.value ?? 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
      ))}
      {typeof variation === "number" && <em>Variacion diaria: {variation >= 0 ? "+" : ""}{variation}%</em>}
    </div>
  );
}

export function SalesModule({
  isActive,
  visibleProducts,
  visibleDecisions,
  visibleCopilot,
  canRegisterSales,
  canRegisterDecisions,
  salesInsightCards,
  quickSaleForm,
  quickSaleStatus,
  manualSaleForm,
  manualSaleStatus,
  salesCatalogs,
  salesSummaryCards,
  filteredSales,
  filteredSalesTotal,
  salesFilters,
  editingSaleId,
  editingSale,
  chartData,
  trendCards,
  weeklyVariation,
  weeklyTotal,
  bestDay,
  selectedSalesCount,
  salesPercent,
  salesRule,
  products,
  decisions,
  activeDecisionId,
  microAction,
  customerCompanyName,
  openDecisions,
  question,
  answer,
  onSubmitQuickSale,
  onQuickProductChange,
  onQuickFieldChange,
  onSubmitManualSale,
  onManualProductChange,
  onManualFieldChange,
  onFilterChange,
  onClearFilters,
  onRefreshSalesData,
  onStartEditingSale,
  onEditingSaleChange,
  onSaveQuickSaleEdit,
  onCancelEdit,
  onAddDecision,
  onUpdateDecisionStatus,
  onGenerateSalesReading,
  onGenerateBrief,
  onQuestionChange,
  onAnswerQuestion,
  onPromptSelect,
  recommendedAction,
  formatMoney,
  formatShortDate
}: SalesModuleProps) {
  return (
    <>
      <article className="panel chart-panel dashboard-module-section" data-active={isActive}>
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
        <form className="quick-sale-panel" onSubmit={onSubmitQuickSale} aria-label="Carga manual rápida de venta">
          <div className="quick-sale-copy">
            <span><WalletCards aria-hidden="true" />Carga manual rápida</span>
            <h3>Venta simple</h3>
            <p>Para registrar ventas de mostrador sin llenar todo el formulario. Guardas y sigues capturando.</p>
          </div>
          <label>
            <span>Producto</span>
            <input list="quick-sales-products-list" value={quickSaleForm.productName} onChange={(event) => onQuickProductChange(event.target.value)} placeholder="Ej. Café Premium" disabled={!canRegisterSales} required />
            <datalist id="quick-sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist>
          </label>
          <label>
            <span>Valor</span>
            <input type="number" min="0" step="100" value={quickSaleForm.unitPrice} onChange={(event) => onQuickFieldChange("unitPrice", event.target.value)} placeholder="25000" disabled={!canRegisterSales} required />
          </label>
          <label>
            <span>Forma de pago</span>
            <input list="quick-sales-payment-list" value={quickSaleForm.paymentMethodName} onChange={(event) => onQuickFieldChange("paymentMethodName", event.target.value)} placeholder="Efectivo" disabled={!canRegisterSales} required />
            <datalist id="quick-sales-payment-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist>
          </label>
          <div className="quick-sale-action">
            <strong>{Number(quickSaleForm.unitPrice || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</strong>
            <button className="primary-button micro-button" type="submit" disabled={!canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar y seguir</button>
            <small>{quickSaleStatus}</small>
          </div>
        </form>
        <form className="manual-sale-form" onSubmit={onSubmitManualSale}>
          <div className="manual-sale-heading">
            <div>
              <span><ClipboardCheck aria-hidden="true" />Registro manual</span>
              <h3>Registrar una venta</h3>
              <p>Captura ventas del día cuando no vienen de CSV o integración. Copiloto las usa para métricas, alertas y recomendaciones.</p>
            </div>
            <strong>{manualSaleStatus}</strong>
          </div>
          <div className="manual-sale-grid">
            <label><span>Fecha</span><input type="date" value={manualSaleForm.saleDate} onChange={(event) => onManualFieldChange("saleDate", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Cliente</span><input list="sales-customers-list" value={manualSaleForm.customerName} onChange={(event) => onManualFieldChange("customerName", event.target.value)} placeholder="Ej. Café Oriente" disabled={!canRegisterSales} required /><datalist id="sales-customers-list">{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Producto o servicio</span><input list="sales-products-list" value={manualSaleForm.productName} onChange={(event) => onManualProductChange(event.target.value)} placeholder="Ej. Panela Orgánica" disabled={!canRegisterSales} required /><datalist id="sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Cantidad</span><input type="number" min="0.01" step="0.01" value={manualSaleForm.quantity} onChange={(event) => onManualFieldChange("quantity", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Precio</span><input type="number" min="0" step="100" value={manualSaleForm.unitPrice} onChange={(event) => onManualFieldChange("unitPrice", event.target.value)} placeholder="50000" disabled={!canRegisterSales} required /></label>
            <label><span>Descuento</span><input type="number" min="0" step="100" value={manualSaleForm.discount} onChange={(event) => onManualFieldChange("discount", event.target.value)} disabled={!canRegisterSales} /></label>
            <label><span>Canal</span><input list="sales-channels-list" value={manualSaleForm.channelName} onChange={(event) => onManualFieldChange("channelName", event.target.value)} placeholder="Mostrador" disabled={!canRegisterSales} required /><datalist id="sales-channels-list">{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Vendedor</span><input list="sales-reps-list" value={manualSaleForm.salesRepName} onChange={(event) => onManualFieldChange("salesRepName", event.target.value)} placeholder="Responsable" disabled={!canRegisterSales} required /><datalist id="sales-reps-list">{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Método de pago</span><input list="sales-payment-methods-list" value={manualSaleForm.paymentMethodName} onChange={(event) => onManualFieldChange("paymentMethodName", event.target.value)} placeholder="Efectivo" disabled={!canRegisterSales} required /><datalist id="sales-payment-methods-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Estado de pago</span><select value={manualSaleForm.status} onChange={(event) => onManualFieldChange("status", event.target.value as ManualSaleForm["status"])} disabled={!canRegisterSales}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
            <label className="manual-sale-notes"><span>Notas</span><textarea value={manualSaleForm.notes} onChange={(event) => onManualFieldChange("notes", event.target.value)} placeholder="Observaciones, entrega, condiciones o próximos pasos." disabled={!canRegisterSales} /></label>
          </div>
          <div className="manual-sale-footer">
            <div><span>Total estimado</span><strong>{Number.isFinite(Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice) - Number(manualSaleForm.discount || 0)) ? new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Math.max((Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice)) - Number(manualSaleForm.discount || 0), 0)) : "$0"}</strong></div>
            <button className="primary-button micro-button" type="submit" disabled={!canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar venta</button>
          </div>
        </form>
        <div className="sales-summary-panel" aria-label="Resumen de ventas">
          <div className="sales-list-heading"><div><span><TrendingUp aria-hidden="true" />Resumen de ventas</span><h3>KPIs comerciales</h3><p>Lectura rápida del módulo: ventas del día, mes, ticket promedio, producto, cliente, canal y cartera pendiente.</p></div></div>
          <div className="sales-summary-grid">{salesSummaryCards.map((card) => { const Icon = card.icon; return <article className="sales-summary-card" data-tone={card.tone} key={card.label}><span><Icon aria-hidden="true" />{card.label}</span><strong>{card.value}</strong><small>{card.helper}</small></article>; })}</div>
        </div>
        <div className="sales-list-panel" aria-label="Listado de ventas">
          <div className="sales-list-heading"><div><span><BarChart3 aria-hidden="true" />Listado de ventas</span><h3>Ventas registradas</h3><p>Filtra por fecha, cliente, producto, canal, vendedor, estado o búsqueda libre. Usa edición rápida para corregir datos sin salir del dashboard.</p></div><div><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(filteredSalesTotal)}</strong><span>{filteredSales.length} venta(s)</span></div></div>
          <div className="sales-filter-grid">
            <label><span>Desde</span><input type="date" value={salesFilters.startDate} onChange={(event) => onFilterChange("startDate", event.target.value)} /></label>
            <label><span>Hasta</span><input type="date" value={salesFilters.endDate} onChange={(event) => onFilterChange("endDate", event.target.value)} /></label>
            <label><span>Cliente</span><select value={salesFilters.customer} onChange={(event) => onFilterChange("customer", event.target.value)}><option value="">Todos</option>{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
            <label><span>Producto</span><select value={salesFilters.product} onChange={(event) => onFilterChange("product", event.target.value)}><option value="">Todos</option>{salesCatalogs.products.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
            <label><span>Canal</span><select value={salesFilters.channel} onChange={(event) => onFilterChange("channel", event.target.value)}><option value="">Todos</option>{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
            <label><span>Vendedor</span><select value={salesFilters.salesRep} onChange={(event) => onFilterChange("salesRep", event.target.value)}><option value="">Todos</option>{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
            <label><span>Estado</span><select value={salesFilters.status} onChange={(event) => onFilterChange("status", event.target.value)}><option value="">Todos</option><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
            <label className="sales-search-field"><span>Búsqueda</span><input value={salesFilters.search} onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Buscar cliente, producto, canal o nota" /></label>
            <button className="secondary-button" type="button" onClick={onClearFilters}>Limpiar filtros</button>
            <button className="secondary-button" type="button" onClick={onRefreshSalesData}>Actualizar</button>
          </div>
          {filteredSales.length ? (
            <div className="sales-table-wrap">
              <table className="sales-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Canal</th><th>Vendedor</th><th>Estado</th><th>Total</th><th>Edición rápida</th></tr></thead>
                <tbody>{filteredSales.map((sale) => {
                  const isEditing = editingSaleId === sale.id;
                  return (
                    <tr data-status={sale.status} key={sale.id}>
                      <td>{isEditing ? <input type="date" value={editingSale.saleDate} onChange={(event) => onEditingSaleChange({ saleDate: event.target.value })} /> : formatShortDate(sale.saleDate)}</td>
                      <td><strong>{sale.customerName}</strong><small>{sale.paymentMethodName}</small></td>
                      <td><strong>{sale.productName}</strong><small>{Number(sale.quantity || 0)} x {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.unitPrice || 0))}</small></td>
                      <td>{sale.channelName}</td>
                      <td>{sale.salesRepName}</td>
                      <td>{isEditing ? <select value={editingSale.status} onChange={(event) => onEditingSaleChange({ status: event.target.value as RecentSale["status"] })}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select> : <span className="sale-status-pill">{sale.status}</span>}</td>
                      <td><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.total || 0))}</strong>{isEditing ? <input type="number" min="0" step="100" value={editingSale.discount} onChange={(event) => onEditingSaleChange({ discount: event.target.value })} aria-label="Descuento" /> : <small>Desc. {new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(Number(sale.discount || 0))}</small>}</td>
                      <td>{isEditing ? <div className="quick-edit-controls"><input value={editingSale.notes} onChange={(event) => onEditingSaleChange({ notes: event.target.value })} placeholder="Notas" /><button className="primary-button" type="button" onClick={() => onSaveQuickSaleEdit(sale.id)}>Guardar</button><button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button></div> : <button className="secondary-button" type="button" onClick={() => onStartEditingSale(sale)}>Editar</button>}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          ) : <EmptyState icon={ClipboardCheck} title="No hay ventas con esos filtros" text="Ajusta la búsqueda o registra una venta manual para construir historial comercial y alimentar las sugerencias de IA." />}
        </div>
        <div className="trend-metrics"><div><span>Total semana</span><strong>{formatMoney(weeklyTotal)}</strong></div><div><span>Mejor dia</span><strong>{bestDay.day}</strong></div><div><span>Promedio diario</span><strong>{formatMoney(weeklyTotal / Math.max(selectedSalesCount, 1))}</strong></div></div>
        <div className="trend-chart" aria-label="Grafica de tendencia semanal de ventas">
          <ResponsiveContainer width="100%" height="100%"><LineChart data={chartData} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}><CartesianGrid stroke="var(--line)" strokeDasharray="4 6" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12, fontWeight: 700 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 12 }} tickFormatter={(value) => `$${value}M`} width={48} /><Tooltip content={<SalesTooltip />} /><Legend iconType="circle" wrapperStyle={{ color: "var(--muted)", fontSize: 12, fontWeight: 700 }} /><Area type="monotone" dataKey="actual" name="Actual" stroke="none" fill="rgba(37, 99, 235, 0.12)" activeDot={false} /><Line type="monotone" dataKey="target" name="Meta diaria" stroke="var(--amber)" strokeDasharray="6 6" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="previous" name="Semana anterior" stroke="var(--muted)" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="actual" name="Actual" stroke="var(--brand-blue)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer>
        </div>
        <div className="real-trend-grid" aria-label="Tendencias reales por indicador">
          {trendCards.map((trend) => (
            <article className="real-trend-card" key={trend.id}>
              <div><span>{trend.title}</span><strong>{trend.value}</strong><small>{trend.helper}</small></div>
              <ResponsiveContainer width="100%" height={112}><LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><XAxis dataKey="day" hide /><YAxis hide domain={["dataMin", "dataMax"]} /><Tooltip formatter={(value) => [`${Number(value).toFixed(trend.id === "margin" ? 1 : 0)}${trend.suffix}`, trend.title]} labelStyle={{ color: "var(--ink)", fontWeight: 900 }} contentStyle={{ border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow)" }} /><Line type="monotone" dataKey={trend.dataKey} stroke={trend.color} strokeWidth={3} dot={false} activeDot={{ r: 5 }} /></LineChart></ResponsiveContainer>
            </article>
          ))}
        </div>
        <div className="sales-action-row"><span><Sparkles aria-hidden="true" />Acción recomendada</span><strong>{salesPercent < salesRule ? `Impulsar ${products[0]?.name ?? "producto líder"} hoy para recuperar la meta.` : "Mantener seguimiento y preparar campaña sobre el producto líder."}</strong><button className="secondary-button" type="button" onClick={onGenerateSalesReading}>Generar lectura</button></div>
      </article>

      {isActive && visibleProducts && <article className="panel"><div className="panel-heading"><div><span><PackageCheck aria-hidden="true" />Productos</span><h2>Mas vendidos</h2></div></div><div className="table-list">{products.map((product) => <div className="table-row" key={product.name}><div><strong>{product.name}</strong><span>Stock: {product.stock}</span></div><strong>{product.sales}</strong></div>)}</div></article>}
      {isActive && visibleDecisions && (
        <article className="panel decisions-panel">
          <div className="panel-heading"><div><span><ClipboardCheck aria-hidden="true" />Historial</span><h2>Decisiones tomadas</h2></div></div>
          <form className="decision-form" data-motion={microAction === "decision" ? "active" : undefined} onSubmit={onAddDecision}>
            <input name="decision" required disabled={!canRegisterDecisions} placeholder="Ej. Reponer Panela Organica esta semana" />
            <select name="owner" disabled={!canRegisterDecisions}><option>Propietario</option><option>Administrador</option><option>Contador</option><option>Ventas</option></select>
            <select name="impact" disabled={!canRegisterDecisions}><option>Inventario</option><option>Caja</option><option>Ventas</option><option>Margen</option></select>
            <button className="primary-button micro-button" data-motion={microAction === "decision" ? "active" : undefined} type="submit" disabled={!canRegisterDecisions}><ClipboardCheck aria-hidden="true" />Registrar</button>
          </form>
          <div className="decisions-list">
            {decisions.length ? decisions.map((decision) => (
              <div className="decision-item" data-motion={activeDecisionId === decision.id ? "active" : undefined} data-status={decision.status} key={decision.id}>
                <div><strong>{decision.text}</strong><span>{decision.impact} · {decision.owner} · {decision.date}</span></div>
                <select value={decision.status} onChange={(event) => onUpdateDecisionStatus(decision.id, event.target.value as Decision["status"])}><option>Pendiente</option><option>En curso</option><option>Completada</option></select>
              </div>
            )) : <EmptyState icon={ClipboardCheck} title="No hay decisiones registradas" text="Registra la primera accion para que el equipo tenga seguimiento, responsable e impacto esperado." />}
          </div>
        </article>
      )}
      {isActive && visibleCopilot && <article className="panel copilot-panel"><div className="panel-heading"><div><span><Bot aria-hidden="true" />Copiloto IA</span><h2>Resumen ejecutivo</h2></div><button className="secondary-button" type="button" onClick={onGenerateBrief}><Bot aria-hidden="true" />Generar brief</button></div><div className="ai-summary"><div className="summary-card"><strong>Lectura de hoy</strong><p>{customerCompanyName} va en {salesPercent}% de la meta mensual. El mejor dia reciente fue {bestDay.day} con {formatMoney(bestDay.value)}.</p></div><div className="summary-card"><strong>Accion sugerida</strong><p>{recommendedAction()} Hay {openDecisions} decisiones abiertas.</p></div></div><div className="quick-prompts">{["Que debo revisar hoy?", "Como va la meta mensual?", "Que productos necesitan atencion?", "Que riesgo tiene la caja?"].map((prompt) => <button type="button" key={prompt} onClick={() => onPromptSelect(prompt)}>{prompt.replace("?", "")}</button>)}</div><div className="prompt-box"><input value={question} onChange={(event) => onQuestionChange(event.target.value)} placeholder="Pregunta: que debo revisar hoy?" /><button type="button" onClick={onAnswerQuestion}><Bot aria-hidden="true" />Preguntar</button></div><p className="answer-box">{answer}</p></article>}
    </>
  );
}
