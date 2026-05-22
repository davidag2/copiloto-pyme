import { Activity, AlertTriangle, Building2, Clock3, Globe2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminAudit } from "@/lib/admin-audit";

export default async function AdminAuditPage() {
  const adminSession = await requireAdminPageSession("/admin/auditoria");
  const { events, setupRequired, summary } = await getAdminAudit();

  return (
    <AdminShell
      active="auditoria"
      description="Registro de toda acción administrativa: quién hizo qué, cuándo, desde qué IP y sobre qué cliente."
      session={adminSession}
      title="Auditoría y Seguridad"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de auditoría">
        <article><small>Acciones auditadas</small><strong>{summary.total}</strong><span>Historial administrativo</span></article>
        <article><small>Últimas 24h</small><strong>{summary.last24h}</strong><span>Actividad reciente</span></article>
        <article><small>Alto riesgo</small><strong>{summary.highRisk}</strong><span>Bloqueos, pagos, borrados e impersonación</span></article>
        <article><small>Admins activos</small><strong>{summary.uniqueAdmins}</strong><span>{summary.impersonations} impersonación(es)</span></article>
      </section>

      {setupRequired ? (
        <AdminNextStep>
          <strong>SQL pendiente en Supabase</strong>
          <p>Aplica la actualización de `admin_client_actions` para guardar IP, user-agent, ruta, método y objetivo. Sin esa migración, la vista queda protegida pero sin datos extendidos.</p>
        </AdminNextStep>
      ) : null}

      <section className="admin-table-card">
        <header>
          <div>
            <span><LockKeyhole size={18} /> Registro seguro</span>
            <h2>Acciones administrativas recientes</h2>
          </div>
          <a href="/admin/actividad">Ver actividad</a>
        </header>
        <div className="admin-activity-timeline">
          {events.length ? events.map((event) => (
            <article key={event.id}>
              <i>{iconForRisk(event.riskLabel)}</i>
              <div>
                <strong>{event.actionLabel}</strong>
                <small>
                  <UserRound size={13} /> {event.adminName || "Admin"} · {event.adminEmail || "Sin email"} · {event.createdLabel}
                </small>
                <small>
                  <Building2 size={13} /> {event.companyName} · {event.targetType || "company"}:{event.targetId || event.companyId}
                </small>
                <small>
                  <Globe2 size={13} /> IP {event.ipAddress || "No capturada"} · {event.requestMethod || "POST"} {event.requestPath || "/admin"}
                </small>
                <small>{event.userAgentLabel}</small>
                <small>{event.metadataSummary}</small>
              </div>
              <span data-status={event.riskLabel === "Alto" ? "Crítico" : event.riskLabel === "Medio" ? "Atención" : "Correcto"}>{event.riskLabel}</span>
              <a href={`/admin/clientes/${event.companyId}`}>Ver cliente</a>
            </article>
          )) : (
            <p className="admin-empty-note">No hay acciones administrativas registradas todavía.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><UserRound size={24} /><div><h2>Quién</h2><p>Admin, email y rol indirecto mediante sesión interna.</p></div></article>
        <article><Activity size={24} /><div><h2>Qué</h2><p>Acción ejecutada, canal, metadata y objetivo afectado.</p></div></article>
        <article><Clock3 size={24} /><div><h2>Cuándo</h2><p>Fecha y hora exacta de cada operación administrativa.</p></div></article>
        <article><Globe2 size={24} /><div><h2>Desde dónde</h2><p>IP, user-agent, método HTTP y ruta utilizada.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar filtros por admin, acción, riesgo, cliente y rango de fechas, además de exportación CSV para revisión legal o soporte.</p>
      </AdminNextStep>
    </AdminShell>
  );
}

function iconForRisk(risk: string) {
  if (risk === "Alto") return <AlertTriangle size={18} />;
  if (risk === "Medio") return <ShieldCheck size={18} />;
  return <Activity size={18} />;
}
