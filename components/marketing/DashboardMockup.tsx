import { ArrowUpRight, CheckCircle2, ClipboardCheck, PackageCheck, WalletCards } from "lucide-react";

export function DashboardMockup() {
  return (
    <div className="mkt-app-mockup" aria-label="Resumen ejecutivo de Copiloto Pyme">
      <div className="mkt-app-top">
        <div>
          <span>Inicio</span>
          <strong>Resumen ejecutivo de hoy</strong>
        </div>
        <span className="mkt-status-pill">
          <CheckCircle2 aria-hidden="true" />
          IA lista
        </span>
      </div>

      <div className="mkt-decision-box">
        <div className="mkt-decision-copy">
          <span>Decisión recomendada</span>
          <strong>Reponer Panela Orgánica hoy</strong>
          <p>
            El inventario está bajo, las ventas subieron y la caja permite hacer la compra sin
            afectar la operación.
          </p>
        </div>
        <div className="mkt-decision-impact">
          <ArrowUpRight aria-hidden="true" />
          <span>Impacto estimado</span>
          <strong>Caja estable por 12 días</strong>
          <small>Evita pérdida de ventas</small>
        </div>
      </div>

      <div className="mkt-kpi-grid">
        <article className="mkt-kpi-card">
          <WalletCards aria-hidden="true" />
          <span>Datos conectados</span>
          <strong>Ventas y caja</strong>
          <small>Inventario y clientes en contexto</small>
        </article>
        <article className="mkt-kpi-card">
          <PackageCheck aria-hidden="true" />
          <span>Acción sugerida</span>
          <strong>Orden a compras</strong>
          <small>Asignar seguimiento a operaciones</small>
        </article>
        <article className="mkt-kpi-card featured">
          <ClipboardCheck aria-hidden="true" />
          <span>Siguiente paso</span>
          <strong>Aprobar reposición</strong>
          <small>Prioridad alta para hoy</small>
        </article>
      </div>
    </div>
  );
}
