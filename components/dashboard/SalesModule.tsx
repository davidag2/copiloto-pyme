"use client";

import type { CSSProperties, FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bot,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  DollarSign,
  FileText,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  TrendingUp,
  Users
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

const money = (value: string | number) => Number(value || 0).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

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

export function SalesModule({
  isActive,
  visibleProducts,
  visibleDecisions,
  visibleCopilot,
  canRegisterSales,
  canRegisterDecisions,
  salesInsightCards,
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
  const todayTotal = Number(salesSummaryCards.find((card) => card.label.toLowerCase().includes("día"))?.value.replace(/[^\d-]/g, "") || 0);
  const monthTotal = Number(salesSummaryCards.find((card) => card.label.toLowerCase().includes("mes"))?.value.replace(/[^\d-]/g, "") || 0) || weeklyTotal;
  const pendingTotal = sumSales(filteredSales, (sale) => sale.status === "pendiente");
  const averageTicket = filteredSales.length ? filteredSalesTotal / filteredSales.length : 0;
  const recentSales = filteredSales.slice(0, 3);
  const receivables = filteredSales.filter((sale) => sale.status === "pendiente").slice(0, 3);
  const topProducts = topBy(filteredSales, (sale) => sale.productName).slice(0, 3);
  const channels = topBy(filteredSales, (sale) => sale.channelName).slice(0, 5);
  const channelTotal = Math.max(channels.reduce((total, channel) => total + channel.amount, 0), 1);
  const aiSuggestion = salesPercent < salesRule
    ? `Contactar clientes que compraron ${products[0]?.name ?? "tu producto líder"} hace más de 15 días.`
    : recommendedAction();
  const estimatedTotal = Math.max((Number(manualSaleForm.quantity) * Number(manualSaleForm.unitPrice)) - Number(manualSaleForm.discount || 0), 0);

  return (
    <section className="sales-command-center dashboard-module-section" data-active={isActive}>
      <header className="sales-page-heading">
        <div>
          <h2>Ventas</h2>
          <p>Registra, consulta y analiza las ventas de tu negocio en un solo lugar.</p>
        </div>
      </header>

      <div className="sales-kpi-row">
        {[
          { label: "Ventas de hoy", value: todayTotal || weeklyTotal, helper: `${weeklyVariation >= 0 ? "+" : ""}${weeklyVariation}% vs ayer`, icon: BarChart3, tone: "purple" },
          { label: "Ventas del mes", value: monthTotal, helper: "+12% vs mes anterior", icon: CalendarDays, tone: "blue" },
          { label: "Facturas pendientes", value: pendingTotal, helper: `${receivables.length} clientes por cobrar`, icon: FileText, tone: "amber" },
          { label: "Ticket promedio", value: averageTicket, helper: "+7% vs semana anterior", icon: DollarSign, tone: "green" }
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
          <span>Copiloto de ventas</span>
          <h3>Tu IA encontró una oportunidad para vender más hoy.</h3>
          <p><b>Sugerencia:</b> {aiSuggestion}</p>
        </div>
        <aside>
          <span>Impacto estimado</span>
          <strong>{formatMoney(Math.max(pendingTotal * 0.2, 1_250_000))}</strong>
          <small>Posible ingreso</small>
          <button className="primary-button micro-button" type="button" onClick={onGenerateSalesReading}>Ver sugerencia</button>
        </aside>
      </article>

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
        <form className="sales-register-card" onSubmit={onSubmitManualSale}>
          <div className="sales-form-heading">
            <h3>Registrar una venta</h3>
            <p>Agrega una venta cuando no venga de integración, CSV o facturación electrónica.</p>
            <small>{manualSaleStatus}</small>
          </div>

          <div className="sales-form-grid">
            <label><span>Fecha</span><input type="date" value={manualSaleForm.saleDate} onChange={(event) => onManualFieldChange("saleDate", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Cliente</span><input list="sales-customers-list" value={manualSaleForm.customerName} onChange={(event) => onManualFieldChange("customerName", event.target.value)} placeholder="Buscar cliente" disabled={!canRegisterSales} required /><datalist id="sales-customers-list">{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Producto o servicio</span><input list="sales-products-list" value={manualSaleForm.productName} onChange={(event) => onManualProductChange(event.target.value)} placeholder="Buscar producto" disabled={!canRegisterSales} required /><datalist id="sales-products-list">{salesCatalogs.products.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Cantidad</span><input type="number" min="0.01" step="0.01" value={manualSaleForm.quantity} onChange={(event) => onManualFieldChange("quantity", event.target.value)} disabled={!canRegisterSales} required /></label>
            <label><span>Precio unitario</span><input type="number" min="0" step="100" value={manualSaleForm.unitPrice} onChange={(event) => onManualFieldChange("unitPrice", event.target.value)} placeholder="50000" disabled={!canRegisterSales} required /></label>
            <label><span>Descuento</span><input type="number" min="0" step="100" value={manualSaleForm.discount} onChange={(event) => onManualFieldChange("discount", event.target.value)} disabled={!canRegisterSales} /></label>
            <label><span>Canal</span><input list="sales-channels-list" value={manualSaleForm.channelName} onChange={(event) => onManualFieldChange("channelName", event.target.value)} placeholder="Instagram" disabled={!canRegisterSales} required /><datalist id="sales-channels-list">{salesCatalogs.channels.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Vendedor</span><input list="sales-reps-list" value={manualSaleForm.salesRepName} onChange={(event) => onManualFieldChange("salesRepName", event.target.value)} placeholder="Responsable" disabled={!canRegisterSales} required /><datalist id="sales-reps-list">{salesCatalogs.reps.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Método de pago</span><input list="sales-payment-methods-list" value={manualSaleForm.paymentMethodName} onChange={(event) => onManualFieldChange("paymentMethodName", event.target.value)} placeholder="Crédito cliente" disabled={!canRegisterSales} required /><datalist id="sales-payment-methods-list">{salesCatalogs.paymentMethods.map((item) => <option value={item.name} key={item.id} />)}</datalist></label>
            <label><span>Estado de pago</span><select value={manualSaleForm.status} onChange={(event) => onManualFieldChange("status", event.target.value as ManualSaleForm["status"])} disabled={!canRegisterSales}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select></label>
            <label className="sales-notes-field"><span>Notas</span><textarea value={manualSaleForm.notes} onChange={(event) => onManualFieldChange("notes", event.target.value)} placeholder="Observaciones, entrega, condiciones..." disabled={!canRegisterSales} /></label>
          </div>

          <footer className="sales-register-footer">
            <div><span>Total estimado</span><strong>{money(estimatedTotal)}</strong></div>
            <button className="primary-button" type="submit" disabled={!canRegisterSales}><ClipboardCheck aria-hidden="true" />Guardar venta</button>
          </footer>
        </form>

        <aside className="sales-side-panels">
          <article className="sales-side-card sales-recent-card">
            <header><strong>Ventas recientes</strong><button type="button" onClick={onRefreshSalesData}>Ver todas</button></header>
            <table><tbody>{recentSales.map((sale) => <tr key={sale.id}><td>{formatShortDate(sale.saleDate)}</td><td>{sale.customerName}</td><td>{money(sale.total)}</td><td><span data-status={sale.status}>{sale.status}</span></td><td><button type="button" onClick={() => onStartEditingSale(sale)}>Ver</button></td></tr>)}</tbody></table>
          </article>

          <div className="sales-mini-grid">
            <article className="sales-side-card">
              <header><strong>Por cobrar</strong><button type="button" onClick={() => onFilterChange("status", "pendiente")}>Ver todas</button></header>
              <div className="sales-receivable-list">
                {receivables.map((sale) => <p key={sale.id}><span>{sale.customerName}</span><b>{money(sale.total)}</b><small>15 días</small></p>)}
              </div>
              <footer><span>Total por cobrar</span><strong>{money(pendingTotal)}</strong></footer>
            </article>

            <article className="sales-side-card">
              <header><strong>Ventas por canal</strong></header>
              <div className="sales-channel-card">
                <div className="sales-donut" style={{ "--p1": "35%", "--p2": "65%", "--p3": "82%" } as CSSProperties} />
                <div>{channels.map((channel, index) => <p key={channel.label}><i data-index={index} /><span>{channel.label}</span><b>{Math.round((channel.amount / channelTotal) * 100)}%</b></p>)}</div>
              </div>
              <footer><span>Total</span><strong>{money(filteredSalesTotal)}</strong></footer>
            </article>
          </div>

          <article className="sales-side-card">
            <header><strong>Productos más vendidos</strong><button type="button">Ver todas</button></header>
            <div className="sales-product-list">
              {(topProducts.length ? topProducts : products.slice(0, 3).map((product) => ({ label: product.name, amount: Number(product.sales.replace(/[^\d-]/g, "")), count: 0 }))).map((product, index) => (
                <p key={product.label}><span>{product.label}</span><small>{product.count || 0} uds</small><b>{money(product.amount)}</b><em className={index === 2 ? "danger" : "positive"}>{index === 2 ? "-5%" : `+${18 - index * 6}%`}</em></p>
              ))}
            </div>
          </article>
        </aside>
      </div>

      <details className="sales-advanced-panel" data-active={isActive}>
        <summary>Filtros, edición rápida y herramientas avanzadas</summary>
        <div className="sales-filter-grid">
          <label><span>Desde</span><input type="date" value={salesFilters.startDate} onChange={(event) => onFilterChange("startDate", event.target.value)} /></label>
          <label><span>Hasta</span><input type="date" value={salesFilters.endDate} onChange={(event) => onFilterChange("endDate", event.target.value)} /></label>
          <label><span>Cliente</span><select value={salesFilters.customer} onChange={(event) => onFilterChange("customer", event.target.value)}><option value="">Todos</option>{salesCatalogs.customers.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Producto</span><select value={salesFilters.product} onChange={(event) => onFilterChange("product", event.target.value)}><option value="">Todos</option>{salesCatalogs.products.map((item) => <option value={item.name} key={item.id}>{item.name}</option>)}</select></label>
          <label><span>Búsqueda</span><input value={salesFilters.search} onChange={(event) => onFilterChange("search", event.target.value)} placeholder="Buscar venta" /></label>
          <button className="secondary-button" type="button" onClick={onClearFilters}>Limpiar</button>
        </div>

        <div className="sales-table-wrap">
          <table className="sales-table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Producto</th><th>Estado</th><th>Total</th><th>Edición</th></tr></thead>
            <tbody>{filteredSales.map((sale) => {
              const isEditing = editingSaleId === sale.id;
              return (
                <tr data-status={sale.status} key={sale.id}>
                  <td>{isEditing ? <input type="date" value={editingSale.saleDate} onChange={(event) => onEditingSaleChange({ saleDate: event.target.value })} /> : formatShortDate(sale.saleDate)}</td>
                  <td>{sale.customerName}</td>
                  <td>{sale.productName}</td>
                  <td>{isEditing ? <select value={editingSale.status} onChange={(event) => onEditingSaleChange({ status: event.target.value as RecentSale["status"] })}><option value="pagada">Pagada</option><option value="pendiente">Pendiente</option><option value="anulada">Anulada</option></select> : <span className="sale-status-pill">{sale.status}</span>}</td>
                  <td>{money(sale.total)}</td>
                  <td>{isEditing ? <div className="quick-edit-controls"><input value={editingSale.notes} onChange={(event) => onEditingSaleChange({ notes: event.target.value })} placeholder="Notas" /><button className="primary-button" type="button" onClick={() => onSaveQuickSaleEdit(sale.id)}>Guardar</button><button className="secondary-button" type="button" onClick={onCancelEdit}>Cancelar</button></div> : <button className="secondary-button" type="button" onClick={() => onStartEditingSale(sale)}>Editar</button>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </details>

      {isActive && visibleProducts && <article className="panel"><div className="panel-heading"><div><span><PackageCheck aria-hidden="true" />Productos</span><h2>Más vendidos</h2></div></div><div className="table-list">{products.map((product) => <div className="table-row" key={product.name}><div><strong>{product.name}</strong><span>Stock: {product.stock}</span></div><strong>{product.sales}</strong></div>)}</div></article>}
      {isActive && visibleDecisions && (
        <article className="panel decisions-panel">
          <div className="panel-heading"><div><span><ClipboardCheck aria-hidden="true" />Historial</span><h2>Decisiones tomadas</h2></div></div>
          <form className="decision-form" data-motion={microAction === "decision" ? "active" : undefined} onSubmit={onAddDecision}>
            <input name="decision" required disabled={!canRegisterDecisions} placeholder="Ej. Reponer Panela Orgánica esta semana" />
            <select name="owner" disabled={!canRegisterDecisions}><option>Propietario</option><option>Administrador</option><option>Contador</option><option>Ventas</option></select>
            <select name="impact" disabled={!canRegisterDecisions}><option>Inventario</option><option>Caja</option><option>Ventas</option><option>Margen</option></select>
            <button className="primary-button micro-button" data-motion={microAction === "decision" ? "active" : undefined} type="submit" disabled={!canRegisterDecisions}><ClipboardCheck aria-hidden="true" />Registrar</button>
          </form>
          <div className="decisions-list">
            {decisions.map((decision) => (
              <div className="decision-item" data-motion={activeDecisionId === decision.id ? "active" : undefined} data-status={decision.status} key={decision.id}>
                <div><strong>{decision.text}</strong><span>{decision.impact} · {decision.owner} · {decision.date}</span></div>
                <select value={decision.status} onChange={(event) => onUpdateDecisionStatus(decision.id, event.target.value as Decision["status"])}><option>Pendiente</option><option>En curso</option><option>Completada</option></select>
              </div>
            ))}
          </div>
        </article>
      )}
      {isActive && visibleCopilot && <article className="panel copilot-panel"><div className="panel-heading"><div><span><Bot aria-hidden="true" />Copiloto IA</span><h2>Resumen ejecutivo</h2></div><button className="secondary-button" type="button" onClick={onGenerateBrief}><Bot aria-hidden="true" />Generar brief</button></div><div className="ai-summary"><div className="summary-card"><strong>Lectura de hoy</strong><p>{customerCompanyName} va en {salesPercent}% de la meta mensual. El mejor día reciente fue {bestDay.day} con {formatMoney(bestDay.value)}.</p></div><div className="summary-card"><strong>Acción sugerida</strong><p>{recommendedAction()} Hay {openDecisions} decisiones abiertas.</p></div></div><div className="quick-prompts">{["Qué debo revisar hoy?", "Cómo va la meta mensual?", "Qué productos necesitan atención?", "Qué riesgo tiene la caja?"].map((prompt) => <button type="button" key={prompt} onClick={() => onPromptSelect(prompt)}>{prompt.replace("?", "")}</button>)}</div><div className="prompt-box"><input value={question} onChange={(event) => onQuestionChange(event.target.value)} placeholder="Pregunta: qué debo revisar hoy?" /><button type="button" onClick={onAnswerQuestion}><Bot aria-hidden="true" />Preguntar</button></div><p className="answer-box">{answer}</p></article>}
    </section>
  );
}
