import { Mail, MailCheck, MailWarning, PenLine } from "lucide-react";
import { AdminEmailComposer } from "@/components/admin/AdminEmailComposer";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { getAdminEmailCenter } from "@/lib/admin-email";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminEmailPage() {
  const adminSession = await requireAdminPageSession("/admin/correo");
  const { logs, recipients, summary, templates } = await getAdminEmailCenter();

  return (
    <AdminShell
      active="correo"
      description="Diseña, personaliza y envía correos electrónicos a clientes de Copiloto Pyme."
      session={adminSession}
      title="Correo"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de correos">
        <article><small>Correos 30 días</small><strong>{summary.total}</strong><span>Actividad reciente</span></article>
        <article><small>Enviados</small><strong>{summary.sent}</strong><span>Confirmados por proveedor</span></article>
        <article><small>Por configurar</small><strong>{summary.configPending}</strong><span>Requieren RESEND_API_KEY</span></article>
        <article><small>Fallidos</small><strong>{summary.failed}</strong><span>Revisar proveedor o dominio</span></article>
      </section>

      <AdminEmailComposer recipients={recipients} templates={templates} />

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header>
            <div>
              <span><MailCheck size={18} /> Historial</span>
              <h2>Últimos correos</h2>
            </div>
            <a href="/admin/clientes">Ver clientes</a>
          </header>
          <div className="admin-client-list">
            {logs.length ? logs.map((log) => (
              <article key={log.id}>
                <i><Mail size={18} /></i>
                <div>
                  <strong>{log.subject}</strong>
                  <small>{log.companyName || "Sin empresa"} · {log.recipientEmail}</small>
                  <small>{log.errorMessage || log.createdLabel}</small>
                </div>
                <span data-status={log.statusLabel}>{log.statusLabel}</span>
              </article>
            )) : (
              <p className="admin-empty-note">Aún no hay correos registrados. El historial aparecerá cuando envíes el primer mensaje o cuando se registre un cliente nuevo.</p>
            )}
          </div>
        </article>

        <article className="admin-table-card">
          <header>
            <div>
              <span><PenLine size={18} /> Plantillas</span>
              <h2>Mensajes base</h2>
            </div>
          </header>
          <div className="admin-client-list">
            {templates.map((template) => (
              <article key={template.templateKey}>
                <i><MailWarning size={18} /></i>
                <div>
                  <strong>{template.name}</strong>
                  <small>{template.subject}</small>
                  <small>{template.preheader}</small>
                </div>
                <span data-status="Activo">Activo</span>
              </article>
            ))}
          </div>
        </article>
      </section>

      <AdminNextStep>
        <strong>Configuración para envío real</strong>
        <p>Agrega `RESEND_API_KEY` y `EMAIL_FROM` en Vercel. Hasta entonces, los correos quedan registrados como “Configurar” y el registro de clientes no se bloquea.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
