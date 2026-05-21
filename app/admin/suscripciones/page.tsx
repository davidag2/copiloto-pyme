import { Building2, CreditCard, LockKeyhole, ShieldCheck, TimerReset, UnlockKeyhole } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminPayments } from "@/lib/admin-payments";
import { formatAdminMoney } from "@/lib/admin-summary";

export default async function AdminSubscriptionsPage() {
  const adminSession = await requireAdminPageSession("/admin/suscripciones");
  const { accessRows, subscriptions, summary } = await getAdminPayments();

  return (
    <AdminShell
      active="suscripciones"
      description="Controla planes Go, Basic y Pro, vencimientos, mes gratis, bloqueos por falta de pago y cambios de plan."
      session={adminSession}
      title="Suscripciones"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de suscripciones">
        <article><small>MRR activo</small><strong>{formatAdminMoney(summary.mrr)}</strong><span>{summary.active} activas</span></article>
        <article><small>Mes gratis</small><strong>{summary.trial}</strong><span>En prueba de 30 días</span></article>
        <article><small>Bloqueos</small><strong>{summary.pastDue}</strong><span>Acceso vencido por falta de pago</span></article>
        <article><small>Planes controlados</small><strong>Go / Basic / Pro</strong><span>Cambios de plan auditables</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><ShieldCheck size={18} /> Control de acceso por pago</span>
            <h2>Estado operativo de dashboards</h2>
          </div>
          <a href="/admin/pagos">Ver pagos</a>
        </header>
        <div className="admin-access-table">
          <div className="admin-access-header" aria-hidden="true">
            <span>Empresa</span>
            <span>Plan</span>
            <span>Estado de acceso</span>
            <span>Fin de prueba</span>
            <span>Último pago</span>
            <span>Dashboard</span>
            <span>Acción sugerida</span>
          </div>
          {accessRows.length ? accessRows.map((row) => (
            <article className="admin-access-row" data-blocked={row.dashboardBlocked} key={row.companyId}>
              <div className="admin-access-company" data-label="Empresa">
                <i><Building2 size={18} /></i>
                <div>
                  <strong>{row.companyName}</strong>
                  <small>ID {row.companyId.slice(0, 8)}</small>
                </div>
              </div>
              <div data-label="Plan">
                <strong>{row.planName}</strong>
                <small>{formatAdminMoney(row.priceCop)} / mes</small>
              </div>
              <span data-status={row.accessStatus}>{row.accessStatus}</span>
              <div data-label="Fin de prueba">
                <strong>{row.trialEndsLabel}</strong>
                <small>{row.statusLabel}</small>
              </div>
              <div data-label="Último pago">
                <strong>{row.lastPaymentLabel}</strong>
                <small>{row.lastPaymentAmount ? formatAdminMoney(row.lastPaymentAmount) : "Sin pago"}{row.lastPaymentProvider ? ` · ${row.lastPaymentProvider}` : ""}</small>
              </div>
              <span data-status={row.dashboardBlocked ? "Bloqueado" : "Habilitado"}>
                {row.dashboardBlocked ? <LockKeyhole size={14} /> : <UnlockKeyhole size={14} />}
                {row.dashboardBlocked ? "Bloqueado" : "Habilitado"}
              </span>
              <div data-label="Acción sugerida">
                <strong>{row.suggestedAction}</strong>
                <a href={`/admin/clientes/${row.companyId}`}>Ver ficha</a>
              </div>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay empresas registradas para controlar acceso.</p>
          )}
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><TimerReset size={18} /> Planes activos</span>
            <h2>Go, Basic y Pro</h2>
          </div>
          <a href="/admin/pagos">Ver pagos</a>
        </header>
        <div className="admin-client-list">
          {subscriptions.length ? subscriptions.map((subscription) => (
            <article key={subscription.id}>
              <i><CreditCard size={18} /></i>
              <div>
                <strong>{subscription.companyName}</strong>
                <small>{subscription.planName} · {formatAdminMoney(subscription.priceCop)} / mes</small>
                <small>Alta: {subscription.createdLabel} · Vence/prueba: {subscription.renewalLabel}</small>
              </div>
              <span data-status={subscription.statusLabel}>{subscription.statusLabel}</span>
              <a href={`/admin/clientes/${subscription.companyId}`}>Ver ficha</a>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay suscripciones registradas.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><ShieldCheck size={24} /><div><h2>Mes gratis</h2><p>Las empresas inician con 30 días de prueba antes del primer cobro.</p></div></article>
        <article><TimerReset size={24} /><div><h2>Vencimientos</h2><p>Revisa fechas de renovación y fin de prueba para prevenir cortes de acceso.</p></div></article>
        <article><CreditCard size={24} /><div><h2>Bloqueo por pago</h2><p>Una suscripción en pago pendiente o vencido debe bloquear el dashboard productivo.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar acciones de cambio de plan y auditoría de bloqueo/desbloqueo para soporte y finanzas.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
