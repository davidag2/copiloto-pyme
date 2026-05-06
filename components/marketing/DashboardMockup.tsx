import { Bell, Box, ChartNoAxesCombined, FileText, Home, Settings, ShoppingCart, WalletCards } from "lucide-react";

const navItems = [
  { label: "Resumen", icon: Home, active: true },
  { label: "Ventas", icon: ShoppingCart },
  { label: "Caja", icon: WalletCards },
  { label: "Inventario", icon: Box },
  { label: "Alertas", icon: Bell },
  { label: "Reportes", icon: FileText },
  { label: "Configuración", icon: Settings }
];

export function DashboardMockup() {
  return (
    <div className="mkt-app-mockup" aria-label="Resumen de hoy">
      <aside className="mkt-app-sidebar" aria-hidden="true">
        <div className="mkt-app-brand"><span>✦</span><strong>Copiloto Pyme</strong></div>
        <nav>
          {navItems.map((item) => {
            const Icon = item.icon;
            return <span className={item.active ? "active" : ""} key={item.label}><Icon />{item.label}</span>;
          })}
        </nav>
      </aside>
      <div className="mkt-app-panel">
        <div className="mkt-app-top">
          <strong>Resumen de hoy</strong>
          <span>Hoy, 20 de mayo · AC</span>
        </div>
        <div className="mkt-decision-box">
          <div>
            <span>Decisión recomendada</span>
            <strong>Reponer Panela Orgánica hoy</strong>
          </div>
          <div className="mkt-box-illustration"><Box aria-hidden="true" /></div>
          <div><span>Por qué</span><p>Quedan pocas unidades y las ventas subieron.</p></div>
          <div><span>Impacto</span><p>Caja +12 días</p></div>
          <div><span>Acción</span><p>Enviar orden a compras</p></div>
        </div>
        <div className="mkt-kpi-grid">
          <article>
            <span>Ventas</span>
            <strong>$2.850.000</strong>
            <small>↑ 10% vs ayer</small>
            <i className="line green" />
          </article>
          <article>
            <span>Caja</span>
            <strong>18 días</strong>
            <small>Suficiente</small>
            <i className="line green" />
          </article>
          <article>
            <span>Alertas</span>
            <strong>2</strong>
            <small>productos críticos</small>
            <i className="bars red" />
          </article>
        </div>
      </div>
      <div className="mkt-floating-insight">
        <ChartNoAxesCombined aria-hidden="true" />
        <span>IA lista para decidir</span>
      </div>
    </div>
  );
}
