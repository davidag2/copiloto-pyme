import { Building2, CheckCircle2, Clock3, FileCheck2, Globe2, ShieldCheck, UserRound, XCircle } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { getAdminLegalAudit } from "@/lib/admin-legal-audit";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminLegalPage() {
  const adminSession = await requireAdminPageSession("/admin/legal");
  const audit = await getAdminLegalAudit();

  return (
    <AdminShell
      active="legal"
      description="Auditoría de aceptación de términos, privacidad, tratamiento de datos y cookies por empresa, usuario, versión, IP y fecha."
      session={adminSession}
      title="Auditoría Legal"
    >
      <section className="admin-kpi-grid" aria-label="Resumen legal">
        <article><small>Versión vigente</small><strong>{audit.currentVersion}</strong><span>Documentos legales actuales</span></article>
        <article><small>Aceptaciones totales</small><strong>{audit.summary.total}</strong><span>{audit.summary.currentVersion} en versión vigente</span></article>
        <article><small>Registro / actualización</small><strong>{audit.summary.registration}/{audit.summary.loginUpdate}</strong><span>Origen de aceptación</span></article>
        <article><small>Últimas 24h</small><strong>{audit.summary.last24h}</strong><span>Nuevas aceptaciones legales</span></article>
      </section>

      {audit.setupRequired ? (
        <AdminNextStep>
          <strong>SQL pendiente en Supabase</strong>
          <p>Aplica la tabla `legal_acceptances` antes de usar esta vista en producción. Sin esa tabla, la auditoría legal no puede consultar aceptaciones.</p>
        </AdminNextStep>
      ) : null}

      <section className="admin-table-card">
        <header>
          <div>
            <span><FileCheck2 size={18} /> Aceptaciones legales</span>
            <h2>Historial reciente</h2>
          </div>
          <a href="/admin/auditoria">Ver auditoría general</a>
        </header>
        <div className="admin-legal-table">
          <div className="admin-legal-header" aria-hidden="true">
            <span>Empresa</span>
            <span>Usuario</span>
            <span>Versión</span>
            <span>Origen</span>
            <span>Fecha</span>
            <span>IP / navegador</span>
          </div>
          {audit.recentAcceptances.length ? audit.recentAcceptances.map((acceptance) => (
            <article className="admin-legal-row" key={acceptance.id}>
              <div>
                <strong><Building2 size={15} /> {acceptance.companyName}</strong>
                <small>{acceptance.companyId}</small>
              </div>
              <div>
                <strong><UserRound size={15} /> {acceptance.userName || "Usuario eliminado"}</strong>
                <small>{acceptance.userEmail || "Sin email"}</small>
              </div>
              <span data-status={acceptance.statusLabel}>{acceptance.legalVersion}</span>
              <div><strong>{acceptance.sourceLabel}</strong><small>{acceptance.statusLabel}</small></div>
              <div><strong><Clock3 size={15} /> {acceptance.acceptedLabel}</strong><small>Registro legal firmado</small></div>
              <div><strong><Globe2 size={15} /> {acceptance.ipAddress || "Sin IP"}</strong><small>{acceptance.userAgentLabel}</small></div>
            </article>
          )) : (
            <p className="admin-empty-note">No hay aceptaciones legales registradas todavía.</p>
          )}
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><ShieldCheck size={18} /> Estado por cliente</span>
            <h2>Empresas pendientes de versión vigente</h2>
          </div>
          <a href="/admin/clientes">Ver clientes</a>
        </header>
        <div className="admin-pending-legal-list">
          {audit.pendingCompanies.length ? audit.pendingCompanies.map((company) => (
            <article key={company.companyId}>
              <i><XCircle size={18} /></i>
              <div>
                <strong>{company.companyName}</strong>
                <small>{company.ownerName || "Sin propietario"} · {company.ownerEmail || "Sin email"} · Plan {company.plan.toUpperCase()}</small>
                <small>Alta: {company.createdLabel}</small>
              </div>
              <a href={`/admin/clientes/${company.companyId}`}>Abrir ficha</a>
            </article>
          )) : (
            <article>
              <i><CheckCircle2 size={18} /></i>
              <div>
                <strong>Todas las empresas activas tienen la versión vigente</strong>
                <small>No hay clientes pendientes de aceptación legal.</small>
              </div>
            </article>
          )}
        </div>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar filtros por versión, empresa, usuario, origen y rango de fechas, además de exportación CSV para revisión legal.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
