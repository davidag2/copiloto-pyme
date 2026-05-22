import { Activity, AlertTriangle, CreditCard, FileText, LogIn, RefreshCw, Upload, UserPlus } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminActivity } from "@/lib/admin-activity";

export default async function AdminActivityPage() {
  const adminSession = await requireAdminPageSession("/admin/actividad");
  const { summary, timeline } = await getAdminActivity();

  return (
    <AdminShell
      active="actividad"
      description="Timeline interno de registros, pagos, login, importaciones CSV, errores, cambios de plan y facturas generadas."
      session={adminSession}
      title="Actividad"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de actividad">
        <article><small>Registros</small><strong>{summary.registrations}</strong><span>Últimos 30 días</span></article>
        <article><small>Pagos</small><strong>{summary.payments}</strong><span>{summary.planChanges} cambios de plan</span></article>
        <article><small>CSV / Logins</small><strong>{summary.imports}/{summary.logins}</strong><span>Importaciones y accesos</span></article>
        <article><small>Errores</small><strong>{summary.errors}</strong><span>{summary.invoices} facturas registradas</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><Activity size={18} /> Timeline interno</span>
            <h2>Eventos recientes</h2>
          </div>
          <a href="/admin/monitoreo">Ver monitoreo</a>
        </header>
        <div className="admin-activity-timeline">
          {timeline.length ? timeline.map((item) => (
            <article key={`${item.type}-${item.id}-${item.occurredAt}`}>
              <i>{iconForActivity(item.type)}</i>
              <div>
                <strong>{item.title}</strong>
                <small>{item.companyName || "Sistema"} · {item.description || "Sin detalle"}</small>
                <small>{item.typeLabel} · {item.occurredLabel}</small>
              </div>
              <span data-status={item.severityLabel}>{item.severityLabel}</span>
              {item.companyId ? <a href={`/admin/clientes/${item.companyId}`}>Ver cliente</a> : <b>Sistema</b>}
            </article>
          )) : (
            <p className="admin-empty-note">No hay actividad registrada en los últimos 90 días.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><UserPlus size={24} /><div><h2>Registros</h2><p>Empresas nuevas y usuarios creados dentro del ecosistema.</p></div></article>
        <article><CreditCard size={24} /><div><h2>Pagos y planes</h2><p>Transacciones, fallos de pago y cambios de plan operativos.</p></div></article>
        <article><Upload size={24} /><div><h2>CSV</h2><p>Cargas de datos, filas válidas, errores y reversión futura.</p></div></article>
        <article><FileText size={24} /><div><h2>Facturas</h2><p>Facturas SIIGO/DIAN generadas, rechazadas o fallidas.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar filtros por empresa, tipo de evento, severidad y rango de fechas para auditoría operativa.</p>
      </AdminNextStep>
    </AdminShell>
  );
}

function iconForActivity(type: string) {
  if (type === "register") return <UserPlus size={18} />;
  if (type === "payment") return <CreditCard size={18} />;
  if (type === "login") return <LogIn size={18} />;
  if (type === "csv_import") return <Upload size={18} />;
  if (type === "invoice") return <FileText size={18} />;
  if (type === "plan_change") return <RefreshCw size={18} />;
  if (type === "error") return <AlertTriangle size={18} />;
  return <Activity size={18} />;
}
