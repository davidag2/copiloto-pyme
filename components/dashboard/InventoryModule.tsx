"use client";

import {
  ArrowDownUp,
  Bell,
  Box,
  Brain,
  Building2,
  CalendarRange,
  CircleDollarSign,
  ClipboardList,
  Database,
  MoreVertical,
  PackageCheck,
  PackagePlus,
  Plus,
  RotateCw,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  Warehouse
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Product = { name: string; sales: string; stock: "Bajo" | "Normal" | "Critico" };
type Metrics = {
  sales: number;
  cash: number;
  margin: number;
  criticalStock: number;
};

type InventoryModuleProps = {
  isActive: boolean;
  metrics: Metrics;
  products: Product[];
  formatMoney: (value: number) => string;
};

const cop = (value: number) => value.toLocaleString("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0
});

export function InventoryModule({
  isActive,
  metrics,
  products,
  formatMoney
}: InventoryModuleProps) {
  const criticalProducts = Math.max(metrics.criticalStock || 0, 6);
  const inventoryValue = Math.max(metrics.sales * 1_025_000, 86_400_000);
  const activeProducts = Math.max(products.length * 62, 248);
  const lowStockProducts = Math.max(criticalProducts * 4, 24);
  const noMovementProducts = Math.max(activeProducts - 192, 56);
  const purchaseOrdersTotal = 6_350_000;
  const riskAvoided = Math.max(metrics.sales * 280_000, 2_400_000);

  const productRows = [
    ["Panela Orgánica 500g", "PAN500", "4 unidades", "20 unidades", "Crítico", "Reponer", "red"],
    ["Café Premium 500g", "CAF500", "12 unidades", "30 unidades", "Bajo", "Revisar", "amber"],
    ["Azúcar Integral 1kg", "AZU1K", "0 unidades", "15 unidades", "Sin stock", "Comprar", "red"]
  ] as const;

  const warehouses = [
    ["Bodega Principal", "Centro", 48_200_000, "128 productos", "purple"],
    ["Tienda Física", "Punto de venta", 21_600_000, "96 productos", "green"],
    ["Bodega Norte", "Barranquilla", 12_100_000, "82 productos", "amber"],
    ["En Tránsito", "En proveedores", 4_500_000, "24 productos", "blue"]
  ] as const;

  const movements = [
    ["Entrada de inventario", "Café Premium 500g - 24 unidades", "Hoy, 9:30 a.m.", "green"],
    ["Venta realizada", "Panela Orgánica 500g - 3 unidades", "Hoy, 8:20 a.m.", "gray"],
    ["Ajuste manual", "Azúcar Integral 1kg - 2 unidades", "Ayer, 4:15 p.m.", "red"],
    ["Transferencia", "Café Premium 500g - 10 unidades", "Ayer, 11:40 a.m.", "blue"],
    ["Compra recibida", "Proveedor Café SAS - Orden #1254", "16 may, 3:20 p.m.", "green"]
  ] as const;

  const orders = [
    ["Café SAS", "Pendiente", "22 may", 2_400_000],
    ["Distribuciones La 80", "Pendiente", "24 may", 1_750_000],
    ["Insumos del Valle", "En tránsito", "21 may", 980_000],
    ["Azúcares Colombia", "Recibida", "15 may", 1_220_000]
  ] as const;

  const suggestions = [
    ["Riesgo", "Panela Orgánica se agotará en 4 días si mantiene la venta actual.", "red", TriangleAlert],
    ["Oportunidad", "Café Premium subió 28%; conviene reforzar stock en tienda.", "green", TrendingUp],
    ["Optimización", "Reducir compras de productos sin movimiento protege la caja.", "blue", RotateCw]
  ] as const;

  const kpiCards: Array<{ label: string; value: string; helper: string; icon: LucideIcon; tone: string }> = [
    { label: "Productos activos", value: activeProducts.toString(), helper: "+12 este mes", icon: Box, tone: "purple" },
    { label: "Stock crítico", value: `${criticalProducts} productos`, helper: "Riesgo de quiebre", icon: TriangleAlert, tone: "amber" },
    { label: "Inventario valorizado", value: cop(inventoryValue), helper: "Costo estimado en COP", icon: CircleDollarSign, tone: "blue" },
    { label: "Rotación promedio", value: "18 días", helper: "Saludable", icon: RotateCw, tone: "green" }
  ];

  const aiSignals = [
    { label: "Stock mínimo", value: `${criticalProducts} SKU`, helper: "productos bajo punto de reposición", icon: TriangleAlert },
    { label: "Bodegas", value: warehouses.length.toString(), helper: "ubicación y disponibilidad", icon: Warehouse },
    { label: "Movimientos", value: movements.length.toString(), helper: "entradas, ventas y ajustes", icon: ArrowDownUp },
    { label: "Compras", value: cop(purchaseOrdersTotal), helper: "órdenes pendientes y recibidas", icon: ShoppingBag }
  ];

  return (
    <section className="inventory-command-center dashboard-module-section" data-active={isActive}>
      <header className="inventory-page-heading">
        <div>
          <h2>Inventario</h2>
          <p>Administra productos, stock, bodegas, movimientos, compras y riesgos de quiebre para que la IA recomiende qué reponer, mover o dejar de comprar.</p>
        </div>
        <div className="inventory-page-actions">
          <button className="inventory-date-button" type="button"><CalendarRange aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="inventory-icon-button" aria-label="Notificaciones" type="button"><Bell aria-hidden="true" /></button>
          <button className="primary-button inventory-add-button" type="button"><Plus aria-hidden="true" />Nuevo producto</button>
        </div>
      </header>

      <article className="inventory-ai-decision-banner">
        <div className="inventory-ai-orb"><Sparkles aria-hidden="true" /></div>
        <div>
          <span>Motor de sugerencias OpenAI para inventario</span>
          <h3>La IA detecta riesgo de quiebre y decide qué producto mover, comprar o pausar.</h3>
          <p>Copiloto Pyme cruza stock actual, stock mínimo, ventas recientes, bodegas, compras y movimientos para proteger ventas y caja.</p>
        </div>
        <aside>
          <small>Decisión recomendada</small>
          <strong>Reponer Panela Orgánica y mover Café Premium a tienda física.</strong>
          <p>Impacto estimado: evitar pérdidas por {formatMoney(riskAvoided)}.</p>
          <button className="secondary-button" type="button">Ver acciones recomendadas</button>
        </aside>
      </article>

      <section className="inventory-ai-signal-grid" aria-label="Datos de inventario que usa OpenAI">
        <article className="inventory-ai-signal-intro">
          <Brain aria-hidden="true" />
          <div>
            <small>Datos que alimentan las decisiones de inventario</small>
            <h3>Mientras más completo esté Inventario, mejores serán las sugerencias en Inicio.</h3>
            <p>La IA necesita conocer stock, bodegas, compras, ventas, movimientos y mínimos para anticipar quiebres y evitar compras innecesarias.</p>
          </div>
        </article>
        {aiSignals.map((signal) => {
          const Icon = signal.icon;
          return (
            <article className="inventory-ai-signal-card" key={signal.label}>
              <Icon aria-hidden="true" />
              <span>{signal.label}</span>
              <strong>{signal.value}</strong>
              <small>{signal.helper}</small>
            </article>
          );
        })}
      </section>

      <div className="inventory-kpi-row">
        {kpiCards.map(({ label, value, helper, icon: KpiIcon, tone }) => (
          <article className="inventory-kpi-card" data-tone={tone} key={label}>
            <span><KpiIcon aria-hidden="true" /></span>
            <div><small>{label}</small><strong>{value}</strong><em>{helper}</em></div>
          </article>
        ))}
      </div>

      <div className="inventory-layout">
        <main className="inventory-main-column">
          <section className="inventory-status-card">
            <header><strong>Productos por estado</strong><button type="button">Ver todos</button></header>
            <div>
              {[
                ["Saludable", 162, "65%", "green"],
                ["Bajo inventario", lowStockProducts, "10%", "amber"],
                ["Crítico", criticalProducts, "2%", "red"],
                ["Sin movimiento", noMovementProducts, "23%", "gray"]
              ].map(([label, value, percent, tone]) => (
                <article data-tone={tone} key={String(label)}><span>{label}</span><strong>{value}</strong><small>{percent}</small></article>
              ))}
            </div>
          </section>

          <section className="inventory-critical-card">
            <header><strong>Riesgos de quiebre</strong></header>
            <table>
              <thead><tr><th>Producto</th><th>SKU</th><th>Stock actual</th><th>Stock mínimo</th><th>Estado</th><th>Acción</th><th /></tr></thead>
              <tbody>
                {productRows.map(([name, sku, current, minimum, status, action, tone]) => (
                  <tr key={sku}>
                    <td><span className="inventory-product-thumb"><PackagePlus aria-hidden="true" /></span>{name}</td>
                    <td>{sku}</td>
                    <td>{current}</td>
                    <td>{minimum}</td>
                    <td><mark data-tone={tone}>{status}</mark></td>
                    <td><button type="button">{action}</button></td>
                    <td><MoreVertical aria-hidden="true" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="inventory-bottom-grid">
            <section className="inventory-panel">
              <header><strong>Bodegas y ubicaciones</strong><button type="button">Ver todas</button></header>
              <div className="inventory-warehouse-list">
                {warehouses.map(([name, place, value, count, tone]) => (
                  <article key={name}>
                    <span data-tone={tone}><Warehouse aria-hidden="true" /></span>
                    <div><strong>{name}</strong><small>{place}</small></div>
                    <b>{cop(value)}<small>{count}</small></b>
                  </article>
                ))}
              </div>
              <button className="inventory-full-button" type="button"><Plus aria-hidden="true" />Nueva bodega</button>
            </section>

            <section className="inventory-panel">
              <header><strong>Movimientos recientes</strong><button type="button">Ver todos</button></header>
              <div className="inventory-movement-list">
                {movements.map(([title, detail, time, tone]) => (
                  <article key={`${title}-${time}`}>
                    <span data-tone={tone}><ClipboardList aria-hidden="true" /></span>
                    <div><strong>{title}</strong><small>{detail}</small></div>
                    <time>{time}</time>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </main>

        <aside className="inventory-side-column">
          <section className="inventory-chart-card">
            <header><div><strong>Valor del inventario</strong><small>Últimos 30 días</small></div><button type="button">Ver reporte</button></header>
            <h3>{cop(inventoryValue)}</h3>
            <p>+8% vs mes anterior</p>
            <svg viewBox="0 0 520 250" aria-label="Valor del inventario">
              <defs><linearGradient id="inventoryArea" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#6d5dfc" stopOpacity="0.28" /><stop offset="100%" stopColor="#6d5dfc" stopOpacity="0" /></linearGradient></defs>
              <path d="M18 180 C62 150 84 156 126 134 C166 100 206 136 248 104 C292 82 326 128 360 82 C398 56 438 76 494 34 L494 224 L18 224 Z" fill="url(#inventoryArea)" />
              <path d="M18 180 C62 150 84 156 126 134 C166 100 206 136 248 104 C292 82 326 128 360 82 C398 56 438 76 494 34" fill="none" stroke="#4f46e5" strokeWidth="4" />
            </svg>
          </section>

          <section className="inventory-panel inventory-ai-list">
            <header><strong>Sugerencias de la IA</strong></header>
            {suggestions.map(([label, text, tone, Icon]) => {
              const SuggestionIcon = Icon;
              return (
                <article data-tone={tone} key={text}>
                  <span><SuggestionIcon aria-hidden="true" /></span>
                  <div><strong>{label}</strong><p>{text}</p><button type="button">Ver detalle</button></div>
                </article>
              );
            })}
            <button className="inventory-full-button" type="button"><Plus aria-hidden="true" />Ver todas las sugerencias</button>
          </section>

          <section className="inventory-panel">
            <header><strong>Órdenes de compra</strong><button type="button">Ver todas</button></header>
            <table className="inventory-orders-table">
              <tbody>
                {orders.map(([provider, status, date, total]) => (
                  <tr key={provider}><td>{provider}</td><td><mark>{status}</mark></td><td>{date}</td><td>{cop(total)}</td></tr>
                ))}
              </tbody>
            </table>
            <button className="inventory-full-button" type="button"><Plus aria-hidden="true" />Nueva orden de compra</button>
          </section>

          <section className="inventory-add-card">
            <header><strong>Agregar producto</strong><mark>Nuevo</mark></header>
            <p>Crea un nuevo producto con los datos necesarios para que la IA calcule rotación, margen, stock mínimo y riesgo.</p>
            {["Información básica", "Precios y márgenes", "Stock inicial y mínimo", "Bodega y ubicación"].map((item) => <span key={item}>{item}</span>)}
            <button className="primary-button" type="button"><Plus aria-hidden="true" />Agregar producto</button>
          </section>
        </aside>
      </div>
    </section>
  );
}
