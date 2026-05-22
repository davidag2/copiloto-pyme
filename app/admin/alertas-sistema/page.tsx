import { AlertTriangle, BellRing, CreditCard, Database, FileWarning, Gauge, Server, Zap } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminSystemAlerts } from "@/lib/admin-system-alerts";

export default async function AdminSystemAlertsPage() {
  const adminSession = await requireAdminPageSession("/admin/alertas-sistema");
  const { alerts, health, summary } = await getAdminSystemAlerts();

  return (
    <AdminShell
      active="alertas-sistema"
      description="Alertas técnicas de API, base de datos, SIIGO, pagos, integraciones, lentitud y caídas."
      session={adminSession}
      title="Alertas del Sistema"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de alertas técnicas">
        <article><small>Alertas activas</small><strong>{summary.activeAlerts}</strong><span>Últimos 7 días</span></article>
        <article><small>Críticas</small><strong>{summary.criticalAlerts}</strong><span>BD, SIIGO y pagos</span></article>
        <article><small>SIIGO / Pagos</small><strong>{summary.siigoFailures}/{summary.paymentFailures}</strong><span>Fallos operativos</span></article>
        <article><small>Lentitud / API</small><strong>{summary.slowEvents}/{summary.apiFailures}</strong><span>Señales internas</span></article>
      </section>

      <section className="admin-module-grid">
        {health.map((item) => (
          <article key={item.label}>
            {iconForHealth(item.label)}
            <div>
              <h2>{item.label}</h2>
              <p><strong>{item.status}</strong> · {item.detail}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><BellRing size={18} /> Cola técnica</span>
            <h2>Alertas recientes</h2>
          </div>
          <a href="/admin/monitoreo">Ver monitoreo</a>
        </header>
        <div className="admin-activity-timeline">
          {alerts.length ? alerts.map((alert) => (
            <article key={`${alert.category}-${alert.id}-${alert.occurredAt}`}>
              <i>{iconForAlert(alert.category)}</i>
              <div>
                <strong>{alert.title}</strong>
                <small>{alert.companyName || "Sistema"} · {alert.description}</small>
                <small>{alert.categoryLabel} · Responsable: {alert.ownerLabel} · {alert.occurredLabel}</small>
              </div>
              <span data-status={alert.severityLabel}>{alert.severityLabel}</span>
              {alert.companyId ? <a href={`/admin/clientes/${alert.companyId}`}>Ver cliente</a> : <b>Sistema</b>}
            </article>
          )) : (
            <p className="admin-empty-note">No hay alertas técnicas recientes. El sistema se ve estable.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><Server size={24} /><div><h2>Errores API</h2><p>Eventos internos de endpoints, servidor y excepciones reportadas.</p></div></article>
        <article><Database size={24} /><div><h2>Base de datos</h2><p>Señales de Supabase/PostgreSQL, conexión, consultas y disponibilidad.</p></div></article>
        <article><FileWarning size={24} /><div><h2>SIIGO y DIAN</h2><p>Facturas fallidas, rechazadas, logs de integración y reintentos.</p></div></article>
        <article><CreditCard size={24} /><div><h2>Pagos</h2><p>Pagos fallidos, expirados o cancelados por proveedor.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar logs externos de Vercel y Supabase para crear alertas automáticas de caídas, latencia e incidentes de infraestructura.</p>
      </AdminNextStep>
    </AdminShell>
  );
}

function iconForAlert(category: string) {
  if (category === "payment") return <CreditCard size={18} />;
  if (category === "siigo") return <FileWarning size={18} />;
  if (category === "database") return <Database size={18} />;
  if (category === "performance") return <Gauge size={18} />;
  if (category === "integration") return <Zap size={18} />;
  return <AlertTriangle size={18} />;
}

function iconForHealth(label: string) {
  if (label === "Base de datos") return <Database size={24} />;
  if (label === "SIIGO / DIAN") return <FileWarning size={24} />;
  if (label === "Pagos") return <CreditCard size={24} />;
  return <Server size={24} />;
}
