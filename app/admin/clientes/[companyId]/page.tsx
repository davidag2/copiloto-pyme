import { notFound } from "next/navigation";
import { Activity, AlertTriangle, ArrowLeft, Building2, CreditCard, FileText, Link2, Mail, Receipt, Users } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { AdminClientActions } from "@/components/admin/AdminClientActions";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminClientDetail } from "@/lib/admin-client-detail";
import { formatAdminMoney } from "@/lib/admin-summary";

type PageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function AdminClientDetailPage({ params }: PageProps) {
  const { companyId } = await params;
  const adminSession = await requireAdminPageSession(`/admin/clientes/${companyId}`);
  const detail = await getAdminClientDetail(companyId);

  if (!detail) notFound();

  const paidTotal = detail.payments.reduce((total, payment) => total + (payment.status === "paid" ? payment.amountCop : 0), 0);
  const pendingTotal = detail.payments.reduce((total, payment) => total + (payment.status !== "paid" ? payment.amountCop : 0), 0);

  return (
    <AdminShell
      active="clientes"
      description="Ficha completa del cliente: datos, usuarios, plan, pagos, facturas, integraciones, actividad y alertas."
      session={adminSession}
      title={detail.company.name}
    >
      <AdminClientActions
        companyId={detail.company.id}
        currentPlan={detail.company.plan}
        isBlocked={Boolean(detail.company.accessBlockedAt)}
        isDeleted={Boolean(detail.company.deletedAt)}
      />

      <section className="admin-table-card">
        <header>
          <div>
            <span><Building2 size={18} /> Ficha del cliente</span>
            <h2>Datos de la empresa</h2>
          </div>
          <a href="/admin/clientes"><ArrowLeft size={16} /> Volver</a>
        </header>
        <div className="admin-detail-grid">
          <article><small>País</small><strong>{detail.company.country}</strong><span>{detail.company.businessType}</span></article>
          <article><small>Plan comercial</small><strong>{detail.company.plan.toUpperCase()}</strong><span>{detail.company.currency}</span></article>
          <article><small>Meta mensual</small><strong>{formatAdminMoney(detail.company.monthlyGoal)}</strong><span>Stock mínimo {detail.company.minimumStock}</span></article>
          <article><small>Alta</small><strong>{detail.company.createdLabel}</strong><span>{detail.company.dataSource}</span></article>
          <article><small>Acceso</small><strong>{detail.company.accessBlockedAt ? "Bloqueado" : "Habilitado"}</strong><span>{detail.company.accessBlockReason || "Sin bloqueo operativo"}</span></article>
          <article><small>Borrado</small><strong>{detail.company.deletedAt ? "Eliminado" : "Activo"}</strong><span>{detail.company.deletionReason || "Sin eliminación"}</span></article>
        </div>
      </section>

      <section className="admin-kpi-grid" aria-label="Resumen del cliente">
        <article><small>Usuarios</small><strong>{detail.users.length}</strong><span>Equipo registrado</span></article>
        <article><small>Plan actual</small><strong>{detail.subscription?.planName || "Sin plan"}</strong><span>{detail.subscription?.statusLabel || "Sin suscripción"}</span></article>
        <article><small>Pagado</small><strong>{formatAdminMoney(paidTotal)}</strong><span>{detail.payments.length} pago(s) registrados</span></article>
        <article><small>Pendiente</small><strong>{formatAdminMoney(pendingTotal)}</strong><span>{detail.alerts.filter((alert) => alert.status === "open").length} alerta(s) abiertas</span></article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header><div><span><Users size={18} /> Usuarios</span><h2>Equipo</h2></div></header>
          <div className="admin-client-list">
            {detail.users.length ? detail.users.map((user) => (
              <article key={user.id}>
                <i><Users size={18} /></i>
                <div><strong>{user.name}</strong><small><Mail size={14} /> {user.email}</small><small>{user.role} · Último acceso: {user.lastLoginLabel}</small></div>
                <span data-status={user.statusLabel}>{user.statusLabel}</span>
                <strong>{user.createdLabel}</strong>
              </article>
            )) : <p className="admin-empty-note">Sin usuarios registrados.</p>}
          </div>
        </article>

        <article className="admin-health-card">
          <header><span><CreditCard size={18} /> Suscripción</span><h2>{detail.subscription?.planName || "Sin plan"}</h2></header>
          <div>
            <p><strong>Estado:</strong> {detail.subscription?.statusLabel || "Sin suscripción"}</p>
            <p><strong>Valor:</strong> {formatAdminMoney(detail.subscription?.priceCop || 0)} / mes</p>
            <p><strong>Renovación/prueba:</strong> {detail.subscription?.renewalLabel || "Sin fecha"}</p>
            <p><strong>Bloqueo:</strong> {detail.company.accessBlockedAt ? detail.company.accessBlockReason || "Acceso bloqueado" : "Sin bloqueo activo"}</p>
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header><div><span><CreditCard size={18} /> Pagos</span><h2>Transacciones</h2></div></header>
          <div className="admin-client-list">
            {detail.payments.length ? detail.payments.map((payment) => (
              <article key={payment.id}>
                <i><CreditCard size={18} /></i>
                <div><strong>{payment.providerName}</strong><small>{payment.planName} · {payment.externalReference}</small><small>Creado: {payment.createdLabel} · Pagado: {payment.paidLabel}</small></div>
                <span data-status={payment.statusLabel}>{payment.statusLabel}</span>
                <strong>{formatAdminMoney(payment.amountCop)}</strong>
              </article>
            )) : <p className="admin-empty-note">Sin pagos registrados.</p>}
          </div>
        </article>

        <article className="admin-table-card">
          <header><div><span><Receipt size={18} /> Facturas</span><h2>SIIGO</h2></div></header>
          <div className="admin-client-list">
            {detail.invoices.length ? detail.invoices.map((invoice) => (
              <article key={invoice.id}>
                <i><FileText size={18} /></i>
                <div><strong>{invoice.siigoInvoiceName || invoice.siigoInvoiceNumber || "Factura sin número"}</strong><small>{invoice.errorMessage || "Sin error registrado"}</small><small>{invoice.createdLabel}</small></div>
                <span data-status={invoice.statusLabel}>{invoice.statusLabel}</span>
                <strong>SIIGO</strong>
              </article>
            )) : <p className="admin-empty-note">Sin facturas registradas.</p>}
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header><div><span><Link2 size={18} /> Integraciones</span><h2>Conexiones</h2></div></header>
          <div className="admin-client-list">
            {detail.integrations.length ? detail.integrations.map((integration) => (
              <article key={integration.id}>
                <i><Link2 size={18} /></i>
                <div><strong>{integration.provider}</strong><small>{integration.category} · {integration.syncLabel}</small><small>Última sincronización: {integration.lastSyncLabel}</small></div>
                <span data-status={integration.statusLabel}>{integration.statusLabel}</span>
                <strong>{integration.statusLabel}</strong>
              </article>
            )) : <p className="admin-empty-note">Sin integraciones conectadas.</p>}
          </div>
        </article>

        <article className="admin-table-card">
          <header><div><span><AlertTriangle size={18} /> Alertas</span><h2>Riesgos</h2></div></header>
          <div className="admin-client-list">
            {detail.alerts.length ? detail.alerts.map((alert) => (
              <article key={alert.id}>
                <i><AlertTriangle size={18} /></i>
                <div><strong>{alert.title}</strong><small>{alert.text}</small><small>{alert.createdLabel}</small></div>
                <span data-status={alert.statusLabel}>{alert.statusLabel}</span>
                <strong>{alert.level}</strong>
              </article>
            )) : <p className="admin-empty-note">Sin alertas registradas.</p>}
          </div>
        </article>
      </section>

      <section className="admin-table-card">
        <header><div><span><Activity size={18} /> Actividad</span><h2>Eventos recientes</h2></div></header>
        <div className="admin-client-list">
          {detail.activity.length ? detail.activity.map((event) => (
            <article key={event.id}>
              <i><Activity size={18} /></i>
              <div><strong>{event.title}</strong><small>{event.description || "Sin descripción"}</small></div>
              <span data-status={event.severity}>{event.severity}</span>
              <strong>{event.occurredLabel}</strong>
            </article>
          )) : <p className="admin-empty-note">Sin actividad registrada.</p>}
        </div>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header><div><span><AlertTriangle size={18} /> Soporte</span><h2>Casos abiertos</h2></div></header>
          <div className="admin-client-list">
            {detail.supportCases.length ? detail.supportCases.map((supportCase) => (
              <article key={supportCase.id}>
                <i><AlertTriangle size={18} /></i>
                <div><strong>{supportCase.title}</strong><small>{supportCase.description || "Sin descripción"}</small><small>{supportCase.createdLabel} · Prioridad {supportCase.priority}</small></div>
                <span data-status={supportCase.statusLabel}>{supportCase.statusLabel}</span>
                <strong>{supportCase.priority}</strong>
              </article>
            )) : <p className="admin-empty-note">Sin casos de soporte registrados.</p>}
          </div>
        </article>

        <article className="admin-table-card">
          <header><div><span><Activity size={18} /> Acciones admin</span><h2>Historial operativo</h2></div></header>
          <div className="admin-client-list">
            {detail.adminActions.length ? detail.adminActions.map((action) => (
              <article key={action.id}>
                <i><Activity size={18} /></i>
                <div><strong>{action.action}</strong><small>Canal: {action.channel || "interno"}</small><small>{action.createdLabel}</small></div>
                <span data-status="success">Registrada</span>
                <strong>Admin</strong>
              </article>
            )) : <p className="admin-empty-note">Sin acciones administrativas registradas.</p>}
          </div>
        </article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar los recordatorios a proveedores reales de email/WhatsApp y enlazar reenvío de pago con la pasarela activa.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
