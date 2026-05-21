import { AlertTriangle, Building2, CreditCard, FileText, ShieldCheck, Users } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { adminRoles } from "@/lib/admin-roles";
import { requireAdminPageSession } from "@/lib/admin-page";
import { formatAdminMoney, getAdminSummary } from "@/lib/admin-summary";

const adminModules = [
  {
    title: "Clientes registrados",
    description: "Empresas, usuarios, planes, estado de acceso y ultimo movimiento.",
    icon: Building2
  },
  {
    title: "Pagos y suscripciones",
    description: "Pruebas gratis, pagos pendientes, renovaciones y bloqueos por vencimiento.",
    icon: CreditCard
  },
  {
    title: "Facturacion SIIGO",
    description: "Facturas emitidas, errores de integracion, reintentos y trazabilidad.",
    icon: FileText
  },
  {
    title: "Monitoreo del sistema",
    description: "Alertas tecnicas, errores API, tiempos de respuesta y salud de servicios.",
    icon: AlertTriangle
  }
];

export default async function AdminPage() {
  const adminSession = await requireAdminPageSession("/admin");
  const summary = await getAdminSummary();
  const paidOrTrial = summary.subscriptions.active + summary.subscriptions.trial;

  return (
    <AdminShell
      active="resumen"
      description="Centro de control para revisar clientes, pagos, facturas, alertas e integridad operativa de Copiloto Pyme."
      session={adminSession}
      title="Dashboard Administrativo"
    >
        <section className="admin-role-grid" aria-label="Roles administrativos">
          {adminRoles.map((role) => (
            <article key={role.value} data-active={role.value === adminSession.adminRole}>
              <strong>{role.label}</strong>
              <p>{role.description}</p>
              <span>{role.value}</span>
            </article>
          ))}
        </section>

        <section className="admin-kpi-grid" aria-label="Resumen administrativo">
          <article>
            <small>Clientes SaaS</small>
            <strong>{summary.companies.total}</strong>
            <span>{summary.companies.createdThisMonth} nuevos este mes</span>
          </article>
          <article>
            <small>Pagos pendientes</small>
            <strong>{formatAdminMoney(summary.payments.pendingAmount)}</strong>
            <span>{summary.payments.pending} transacciones por revisar</span>
          </article>
          <article>
            <small>Facturas SIIGO</small>
            <strong>{summary.invoices.sent + summary.invoices.accepted}</strong>
            <span>{summary.invoices.failed} con error · {summary.invoices.ready} listas</span>
          </article>
          <article>
            <small>Alertas servidor</small>
            <strong>{summary.alerts.open}</strong>
            <span>{summary.alerts.danger} criticas · {summary.alerts.warning} advertencias</span>
          </article>
        </section>

        <section className="admin-kpi-grid" aria-label="Indicadores SaaS">
          <article>
            <small>Ingresos confirmados</small>
            <strong>{formatAdminMoney(summary.payments.paidAmount)}</strong>
            <span>{summary.payments.paid} pagos aprobados</span>
          </article>
          <article>
            <small>Suscripciones vigentes</small>
            <strong>{paidOrTrial}</strong>
            <span>{summary.subscriptions.trial} en prueba · {summary.subscriptions.active} activas</span>
          </article>
          <article>
            <small>Usuarios registrados</small>
            <strong>{summary.users.total}</strong>
            <span>{summary.users.loggedLast7Days} activos en 7 dias</span>
          </article>
          <article>
            <small>Planes activos</small>
            <strong>{summary.companies.go}/{summary.companies.basic}/{summary.companies.pro}</strong>
            <span>GO · Basic · Pro</span>
          </article>
        </section>

        <section className="admin-overview-grid">
          <article className="admin-table-card">
            <header>
              <div>
                <span><Building2 size={18} /> Ultimos clientes</span>
                <h2>Empresas recientes</h2>
              </div>
              <a href="/admin/clientes">Ver clientes</a>
            </header>
            <div className="admin-client-list">
              {summary.recentCompanies.length ? summary.recentCompanies.map((company) => (
                <article key={company.id}>
                  <i><Building2 size={18} /></i>
                  <div>
                    <strong>{company.name}</strong>
                    <small><Users size={14} /> {company.usersCount} usuarios · Plan {String(company.plan).toUpperCase()}</small>
                  </div>
                  <span data-status={company.subscriptionStatus === "past_due" ? "Pago pendiente" : "Activo"}>
                    {company.subscriptionStatus || "Sin suscripcion"}
                  </span>
                  <a href={`/admin/clientes/${company.id}`}>Ver ficha</a>
                </article>
              )) : (
                <p className="admin-empty-note">Aun no hay empresas registradas.</p>
              )}
            </div>
          </article>

          <article className="admin-health-card">
            <header>
              <span><ShieldCheck size={18} /> Estado operativo</span>
              <h2>Lectura rapida</h2>
            </header>
            <div>
              <p><strong>Pagos:</strong> {summary.payments.failed} fallidos o expirados.</p>
              <p><strong>Facturacion:</strong> {summary.invoices.failed} facturas con error SIIGO.</p>
              <p><strong>Clientes:</strong> {summary.subscriptions.pastDue} suscripciones vencidas.</p>
              <p><strong>Alertas:</strong> {summary.alerts.open} alertas abiertas.</p>
            </div>
          </article>
        </section>

        <section className="admin-module-grid">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title}>
                <Icon size={24} />
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                </div>
              </article>
            );
          })}
        </section>

        <AdminNextStep>
          <strong>Siguiente paso</strong>
          <p>Conectar el modulo de clientes para ver empresas registradas, plan actual, estado de pago y fecha de alta.</p>
        </AdminNextStep>
    </AdminShell>
  );
}
