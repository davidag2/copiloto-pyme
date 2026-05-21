import { AlertTriangle, Banknote, CreditCard, Receipt } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { formatAdminMoney } from "@/lib/admin-summary";
import { getAdminPayments } from "@/lib/admin-payments";

export default async function AdminPaymentsPage() {
  const adminSession = await requireAdminPageSession("/admin/pagos");
  const { providers, summary, transactions } = await getAdminPayments();

  return (
    <AdminShell
      active="pagos"
      description="Revisa transacciones, pagos pendientes, pagos aprobados, fallidos, pasarelas y conciliación operativa."
      session={adminSession}
      title="Pagos"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de pagos">
        <article><small>Pagos aprobados</small><strong>{formatAdminMoney(summary.paidAmount)}</strong><span>{summary.paidCount} transacción(es) confirmadas</span></article>
        <article><small>Pagos pendientes</small><strong>{formatAdminMoney(summary.pendingAmount)}</strong><span>{summary.pendingCount} transacción(es) por revisar</span></article>
        <article><small>Pagos fallidos</small><strong>{summary.failedCount}</strong><span>Fallidos, vencidos o cancelados</span></article>
        <article><small>Pasarelas</small><strong>{providers.length}</strong><span>Proveedores configurados</span></article>
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
            <p><strong>Pasarelas:</strong> {providers.map((provider) => provider.name).join(", ") || "Sin proveedores configurados"}.</p>
          </div>
        </article>
      </section>

      <section className="admin-module-grid">
        <article><CreditCard size={24} /><div><h2>Pasarelas</h2><p>{providers.length} proveedor(es): {providers.map((provider) => provider.name).join(", ") || "sin configurar"}.</p></div></article>
        <article><Banknote size={24} /><div><h2>Conciliación</h2><p>{summary.pendingCount} pagos pendientes y {summary.failedCount} con estado fallido o expirado.</p></div></article>
        <article><Receipt size={24} /><div><h2>Factura asociada</h2><p>La factura SIIGO se genera cuando el pago queda confirmado.</p></div></article>
        <article><AlertTriangle size={24} /><div><h2>Pagos fallidos</h2><p>Seguimiento de transacciones rechazadas, vencidas o canceladas por pasarela.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Crear acciones de seguimiento para pagos pendientes: reenviar link, marcar conciliación y revisar factura SIIGO asociada.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
