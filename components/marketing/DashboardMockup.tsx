import { Box, CheckCircle2 } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="mkt-app-mockup" aria-label="Resumen de hoy">
      <div className="mkt-app-top">
        <strong>Resumen de hoy</strong>
        <span><i /> <i /> <i /></span>
      </div>

      <div className="mkt-decision-box">
        <span>Decisión recomendada</span>
        <strong>Reponer Panela Orgánica hoy</strong>
        <small>Quedan pocas unidades y las ventas subieron.</small>
        <div className="mkt-box-illustration"><Box aria-hidden="true" /></div>
      </div>

      <div className="mkt-kpi-grid">
        <article>
          <span>Ventas</span>
          <strong>$2.850.000</strong>
          <small>+10% vs ayer</small>
        </article>
        <article>
          <span>Caja</span>
          <strong>18 días</strong>
          <small>Suficiente</small>
        </article>
      </div>

      <div className="mkt-floating-insight">
        <CheckCircle2 aria-hidden="true" />
        <span>IA lista para decidir</span>
      </div>
    </div>
  );
}
