import { Banknote, CreditCard, Receipt, TimerReset } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { formatAdminMoney } from "@/lib/admin-summary";
import { getAdminPayments } from "@/lib/admin-payments";

export default async function AdminPaymentsPage() {
  const adminSession = await requireAdminPageSession("/admin/pagos");
  const { providers, subscriptions, summary, transactions } = await getAdminPayments();

  return (
    <AdminShell
      active="pagos"
      description="Revisa suscripciones, pagos pendientes, pruebas gratis, renovaciones y conciliación de pasarelas."
      session={adminSession}
      title="Pagos y suscripciones"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de pagos">
        <article><small>MRR estimado</small><strong>{formatAdminMoney(summary.mrr)}</strong><span>{summary.active} suscripción(es) activas</span></article>
        <article><small>En prueba gratis</small><strong>{summary.trial}</strong><span>30 días incluidos</span></article>
        <article><small>Pagos pendientes</small><strong>{formatAdminMoney(summary.pendingAmount)}</strong><span>{summary.pendingCount} transacción(es) por revisar</span></article>
        <article><small>Bloqueos activos</small><strong>{summary.pastDue}</strong><span>Sin pago vigente</span></article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header>
            <div>
              <span><CreditCard size={18} /> Transacciones</span>
              <h2>Pagos recientes</h2>
            </div>
            <a href="/admin/pagos">Actualizar</a>
          </header>
          <div className="admin-client-list">
            {transactions.length ? transactions.map((transaction) => (
              <article key={transaction.id}>
                <i><Banknote size={18} /></i>
                <div>
                  <strong>{transaction.companyName}</strong>
                  <small>{transaction.providerName} · {transaction.planName} · {transaction.externalReference}</small>
                  <small>Creado: {transaction.createdLabel} · Pagado: {transaction.paidLabel}</small>
                </div>
                <span data-status={transaction.statusLabel}>{transaction.statusLabel}</span>
                <strong>{formatAdminMoney(transaction.amountCop)}</strong>
              </article>
            )) : (
              <p className="admin-empty-note">Aún no hay transacciones registradas.</p>
            )}
          </div>
        </article>

        <article className="admin-health-card">
          <header>
            <span><Receipt size={18} /> Conciliación</span>
            <h2>Lectura rápida</h2>
          </header>
          <div>
            <p><strong>Pagado:</strong> {formatAdminMoney(summary.paidAmount)} en {summary.paidCount} transacción(es).</p>
            <p><strong>Pendiente:</strong> {formatAdminMoney(summary.pendingAmount)} por cobrar.</p>
            <p><strong>Fallidos:</strong> {summary.failedCount} pago(s) fallidos, vencidos o cancelados.</p>
            <p><strong>Bloqueos:</strong> {summary.pastDue} cliente(s) en pago vencido.</p>
          </div>
        </article>
      </section>

      <section className="admin-module-grid">
        <article><CreditCard size={24} /><div><h2>Pasarelas</h2><p>{providers.length} proveedor(es): {providers.map((provider) => provider.name).join(", ") || "sin configurar"}.</p></div></article>
        <article><TimerReset size={24} /><div><h2>Prueba gratis</h2><p>{summary.trial} empresa(s) en periodo de 30 días antes del primer pago.</p></div></article>
        <article><Banknote size={24} /><div><h2>Conciliación</h2><p>{summary.pendingCount} pagos pendientes y {summary.failedCount} con estado fallido o expirado.</p></div></article>
        <article><Receipt size={24} /><div><h2>Factura asociada</h2><p>La factura SIIGO se genera cuando el pago queda confirmado.</p></div></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><TimerReset size={18} /> Suscripciones</span>
            <h2>Planes recientes</h2>
          </div>
        </header>
        <div className="admin-client-list">
          {subscriptions.length ? subscriptions.map((subscription) => (
            <article key={subscription.id}>
              <i><CreditCard size={18} /></i>
              <div>
                <strong>{subscription.companyName}</strong>
                <small>{subscription.planName} · {formatAdminMoney(subscription.priceCop)} / mes</small>
                <small>Alta: {subscription.createdLabel} · Renovación/prueba: {subscription.renewalLabel}</small>
              </div>
              <span data-status={subscription.statusLabel}>{subscription.statusLabel}</span>
              <a href={`/admin/clientes?empresa=${subscription.id}`}>Ver cliente</a>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay suscripciones registradas.</p>
          )}
        </div>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Crear acciones de seguimiento para pagos pendientes: reenviar link, marcar conciliación, revisar factura SIIGO y bloquear acceso al terminar la prueba gratis sin pago.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
