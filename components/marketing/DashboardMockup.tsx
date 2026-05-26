import { Box, CheckCircle2 } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="mkt-app-mockup" aria-label="Resumen de hoy">
      <div className="mkt-app-top">
        <strong>Inicio · Resumen de hoy</strong>
        <span><i /> <i /> <i /></span>
      </div>

      <div className="mkt-decision-box">
        <span>Decisión recomendada</span>
        <strong>Reponer Panela Orgánica hoy</strong>
        <small>El inventario está bajo, las ventas subieron y la caja permite hacer la compra.</small>
        <p>Impacto: evita pérdida de ventas · Caja estable por 12 días</p>
        <div className="mkt-box-illustration"><Box aria-hidden="true" /></div>
      </div>

      <div className="mkt-kpi-grid">
        <article>
          <span>Datos conectados</span>
          <strong>Ventas · Caja</strong>
          <small>Inventario · Clientes</small>
        </article>
        <article>
          <span>Acción sugerida</span>
          <strong>Orden a compras</strong>
          <small>Asignar seguimiento a operaciones</small>
        </article>
      </div>

      <div className="mkt-floating-insight">
        <CheckCircle2 aria-hidden="true" />
        <span>IA lista para decidir</span>
      </div>
    </div>
  );
}
