export function DashboardMockup() {
  return (
    <div className="mkt-dashboard-mockup" aria-label="Resumen de hoy">
      <div className="mkt-dashboard-top">
        <span>Resumen de hoy</span>
        <strong>COP</strong>
      </div>
      <div className="mkt-dashboard-decision">
        <span>Decisión</span>
        <strong>Reponer Panela Orgánica hoy</strong>
        <p>Quedan pocas unidades y las ventas subieron.</p>
      </div>
      <div className="mkt-dashboard-row">
        <div>
          <span>Impacto</span>
          <strong>Caja +12 días</strong>
        </div>
        <div>
          <span>Acción</span>
          <strong>Enviar orden a compras</strong>
        </div>
      </div>
      <div className="mkt-dashboard-data">
        <div><span>Ventas</span><strong>$2.850.000</strong></div>
        <div><span>Caja</span><strong>18 días</strong></div>
        <div><span>Alertas</span><strong>2 críticos</strong></div>
      </div>
    </div>
  );
}
