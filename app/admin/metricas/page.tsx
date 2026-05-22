import { BarChart3, Building2, CreditCard, LineChart, Repeat2, TrendingUp, Users, WalletCards } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminSaasMetrics } from "@/lib/admin-saas-metrics";

export default async function AdminSaasMetricsPage() {
  const adminSession = await requireAdminPageSession("/admin/metricas");
  const { monthly, planMix, recentPayments, summary } = await getAdminSaasMetrics();
  const maxMonthlyRevenue = Math.max(...monthly.map((item) => item.paidRevenue), 1);
  const maxNewCustomers = Math.max(...monthly.map((item) => item.newCustomers), 1);

  return (
    <AdminShell
      active="metricas"
      description="MRR, ARR, churn, clientes nuevos, clientes activos, conversion de prueba a pago y crecimiento mensual."
      session={adminSession}
      title="Métricas SaaS"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de metricas SaaS">
        <article><small>MRR</small><strong>{summary.mrrLabel}</strong><span>{summary.mrrGrowthLabel} vs base previa</span></article>
        <article><small>ARR</small><strong>{summary.arrLabel}</strong><span>MRR anualizado</span></article>
        <article><small>Churn</small><strong>{summary.churnRateLabel}</strong><span>{summary.pastDueSubscriptions} pagos vencidos</span></article>
        <article><small>Conversión trial</small><strong>{summary.conversionRateLabel}</strong><span>{summary.convertedToPaid}/{summary.trialStarted} pasaron a pago</span></article>
      </section>

      <section className="admin-kpi-grid" aria-label="Clientes SaaS">
        <article><small>Nuevos clientes</small><strong>{summary.newThisMonth}</strong><span>{summary.customerGrowthLabel} vs mes anterior</span></article>
        <article><small>Clientes activos</small><strong>{summary.activeCustomers}</strong><span>{summary.activeSubscriptions} suscripciones activas</span></article>
        <article><small>Pruebas activas</small><strong>{summary.trialSubscriptions}</strong><span>{summary.currentlyTrial} empresas en trial</span></article>
        <article><small>Usuarios activos</small><strong>{summary.activeUsers}</strong><span>Logins últimos 30 días</span></article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header>
            <div>
              <span><LineChart size={18} /> Crecimiento mensual</span>
              <h2>Ingresos y nuevos clientes</h2>
            </div>
            <a href="/admin/pagos">Ver pagos</a>
          </header>
          <div className="admin-saas-bars">
            {monthly.map((item) => (
              <article key={item.month}>
                <div>
                  <strong>{item.label}</strong>
                  <small>{item.newCustomers} clientes · {item.paidCustomers} pagaron</small>
                </div>
                <div className="admin-saas-meter" aria-label={`Ingresos ${item.label}`}>
                  <span style={{ width: `${Math.max((item.paidRevenue / maxMonthlyRevenue) * 100, item.paidRevenue ? 8 : 2)}%` }} />
                </div>
                <div className="admin-saas-meter admin-saas-meter-alt" aria-label={`Clientes ${item.label}`}>
                  <span style={{ width: `${Math.max((item.newCustomers / maxNewCustomers) * 100, item.newCustomers ? 8 : 2)}%` }} />
                </div>
                <b>{new Intl.NumberFormat("es-CO", { currency: "COP", maximumFractionDigits: 0, style: "currency" }).format(item.paidRevenue)}</b>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-health-card">
          <header>
            <span><TrendingUp size={18} /> Lectura ejecutiva</span>
            <h2>Salud SaaS</h2>
          </header>
          <div>
            <p><strong>MRR:</strong> {summary.mrrLabel} con crecimiento {summary.mrrGrowthLabel}.</p>
            <p><strong>Clientes:</strong> {summary.activeCustomers} activos de {summary.totalCompanies} registrados.</p>
            <p><strong>Conversión:</strong> {summary.conversionRateLabel} de pruebas a pago.</p>
            <p><strong>Riesgo:</strong> {summary.expiredOrPastDue} pruebas vencidas, canceladas o en mora.</p>
          </div>
        </article>
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header>
            <div>
              <span><WalletCards size={18} /> Planes</span>
              <h2>MRR por plan</h2>
            </div>
            <a href="/admin/suscripciones">Ver suscripciones</a>
          </header>
          <div className="admin-activity-timeline">
            {planMix.map((plan) => (
              <article key={plan.planId}>
                <i><BarChart3 size={18} /></i>
                <div>
                  <strong>{plan.planName}</strong>
                  <small>{plan.customers} clientes activos</small>
                </div>
                <span data-status="Correcto">{plan.mrrLabel}</span>
                <b>{plan.planId.toUpperCase()}</b>
              </article>
            ))}
          </div>
        </article>

        <article className="admin-table-card">
          <header>
            <div>
              <span><CreditCard size={18} /> Pagos recientes</span>
              <h2>Ingresos confirmados</h2>
            </div>
            <a href="/admin/pagos">Ver todo</a>
          </header>
          <div className="admin-client-list">
            {recentPayments.length ? recentPayments.map((payment) => (
              <article key={payment.id}>
                <i><CreditCard size={18} /></i>
                <div>
                  <strong>{payment.companyName}</strong>
                  <small>{payment.planName} · {payment.providerName} · {payment.dateLabel}</small>
                </div>
                <span data-status="Activo">{payment.amountLabel}</span>
              </article>
            )) : (
              <p className="admin-empty-note">Aún no hay pagos confirmados.</p>
            )}
          </div>
        </article>
      </section>

      <section className="admin-module-grid">
        <article><Repeat2 size={24} /><div><h2>MRR y ARR</h2><p>Ingresos recurrentes mensuales y anualizados por plan activo.</p></div></article>
        <article><Users size={24} /><div><h2>Clientes activos</h2><p>Empresas con suscripción vigente, pagos recientes o actividad de usuarios.</p></div></article>
        <article><Building2 size={24} /><div><h2>Nuevos clientes</h2><p>Altas del mes actual comparadas contra el mes anterior.</p></div></article>
        <article><TrendingUp size={24} /><div><h2>Conversión</h2><p>Empresas que pasan de prueba gratis a pago real.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar cohortes por mes de alta, churn por plan y CAC/LTV cuando el módulo comercial tenga fuente de adquisición.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
