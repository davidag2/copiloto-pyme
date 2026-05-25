import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type SummaryRow = {
  activeSubscriptions: string;
  blockedCompanies: string;
  companies: string;
  invoiceFailures: string;
  openAlerts: string;
  openSupport: string;
  paidToday: string;
  pendingPayments: string;
  sentInvoices: string;
  trialSubscriptions: string;
  users: string;
};

type SalesRow = {
  ordersToday: string;
  pendingReceivables: string;
  salesMonth: string;
  salesToday: string;
};

type ActivityRow = {
  importsToday: string;
  loginsToday: string;
  newCompaniesToday: string;
  suggestionsToday: string;
};

type CompanyStatusRow = {
  accessBlockedAt: string | null;
  alertCount: string;
  companyName: string;
  openSuggestions: string;
  ownerEmail: string | null;
  ownerName: string | null;
  plan: string | null;
  status: string | null;
  trialEndsAt: string | null;
};

type CriticalAlertRow = {
  companyName: string;
  createdAt: string;
  level: string;
  text: string;
  title: string;
};

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function money(value: unknown) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(toNumber(value));
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeZone: "America/Bogota"
  }).format(new Date(value));
}

function todayLabel() {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "full",
    timeZone: "America/Bogota"
  }).format(new Date());
}

function cleanStatusText(value: unknown) {
  if (value === null || value === undefined) return "";

  return String(value)
    .normalize("NFC")
    .replace(/\u00C3\u00A1/g, "\u00E1")
    .replace(/\u00C3\u00A9/g, "\u00E9")
    .replace(/\u00C3\u00AD/g, "\u00ED")
    .replace(/\u00C3\u00B3/g, "\u00F3")
    .replace(/\u00C3\u00BA/g, "\u00FA")
    .replace(/\u00C3\u00B1/g, "\u00F1")
    .replace(/Panela Org.nica/gi, "Panela Org\u00E1nica")
    .replace(/Andr.s V.lez/gi, "Andr\u00E9s V\u00E9lez")
    .replace(/Org.nica/gi, "Org\u00E1nica")
    .replace(/Organica/g, "Org\u00E1nica");
}

export async function sendAdminDailyStatusEmail() {
  const report = await getAdminDailyStatus();
  const body = renderAdminDailyStatus(report);

  return sendEmail({
    body,
    metadata: {
      generatedAt: new Date().toISOString(),
      reportType: "admin_daily_status"
    },
    preheader: `Estado diario de Copiloto Pyme: ${report.summary.companies} empresas, ${money(report.sales.salesToday)} en ventas hoy.`,
    subject: `Status diario Copiloto Pyme - ${todayLabel()}`,
    templateKey: "admin_daily_status",
    to: process.env.ADMIN_STATUS_EMAIL || "info@tecnotitan.com"
  });
}

async function getAdminDailyStatus() {
  const [summary, sales, activity, companies, criticalAlerts] = await Promise.all([
    query<SummaryRow>(
      `SELECT COUNT(*) FILTER (WHERE companies.deleted_at IS NULL)::text AS companies,
              COUNT(*) FILTER (WHERE companies.deleted_at IS NULL AND companies.access_blocked_at IS NOT NULL)::text AS "blockedCompanies",
              COUNT(users.id) FILTER (WHERE users.status <> 'disabled')::text AS users,
              COUNT(DISTINCT subscriptions.id) FILTER (WHERE subscriptions.status = 'trial')::text AS "trialSubscriptions",
              COUNT(DISTINCT subscriptions.id) FILTER (WHERE subscriptions.status = 'active')::text AS "activeSubscriptions",
              COUNT(DISTINCT payment_transactions.id) FILTER (WHERE payment_transactions.status IN ('pending', 'configuration_required', 'redirect_created'))::text AS "pendingPayments",
              COALESCE(SUM(payment_transactions.amount_cop) FILTER (WHERE payment_transactions.status = 'paid' AND payment_transactions.paid_at >= CURRENT_DATE), 0)::text AS "paidToday",
              COUNT(DISTINCT siigo_invoices.id) FILTER (WHERE siigo_invoices.status IN ('sent', 'accepted'))::text AS "sentInvoices",
              COUNT(DISTINCT siigo_invoices.id) FILTER (WHERE siigo_invoices.status IN ('failed', 'rejected'))::text AS "invoiceFailures",
              COUNT(DISTINCT alerts.id) FILTER (WHERE alerts.status = 'open')::text AS "openAlerts",
              COUNT(DISTINCT support_cases.id) FILTER (WHERE support_cases.status IN ('open', 'in_progress'))::text AS "openSupport"
       FROM companies
       LEFT JOIN users ON users.company_id = companies.id
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
       LEFT JOIN payment_transactions ON payment_transactions.company_id = companies.id
       LEFT JOIN siigo_invoices ON siigo_invoices.company_id = companies.id
       LEFT JOIN alerts ON alerts.company_id = companies.id
       LEFT JOIN support_cases ON support_cases.company_id = companies.id`
    ),
    query<SalesRow>(
      `SELECT COALESCE(SUM(total) FILTER (WHERE status <> 'anulada' AND sale_date = CURRENT_DATE), 0)::text AS "salesToday",
              COUNT(*) FILTER (WHERE status <> 'anulada' AND sale_date = CURRENT_DATE)::text AS "ordersToday",
              COALESCE(SUM(total) FILTER (WHERE status <> 'anulada' AND sale_date >= date_trunc('month', CURRENT_DATE)), 0)::text AS "salesMonth",
              COALESCE(SUM(total) FILTER (WHERE status = 'pendiente'), 0)::text AS "pendingReceivables"
       FROM sales_orders`
    ),
    query<ActivityRow>(
      `SELECT (SELECT COUNT(*) FROM companies WHERE created_at >= CURRENT_DATE)::text AS "newCompaniesToday",
              (SELECT COUNT(*) FROM sessions WHERE created_at >= CURRENT_DATE)::text AS "loginsToday",
              (SELECT COUNT(*) FROM imported_data_batches WHERE created_at >= CURRENT_DATE)::text AS "importsToday",
              (SELECT COUNT(*) FROM ai_suggestions WHERE generated_at >= CURRENT_DATE)::text AS "suggestionsToday"`
    ),
    query<CompanyStatusRow>(
      `SELECT companies.name AS "companyName",
              companies.plan,
              companies.access_blocked_at AS "accessBlockedAt",
              subscriptions.status,
              subscriptions.trial_ends_at AS "trialEndsAt",
              owner.name AS "ownerName",
              owner.email AS "ownerEmail",
              COUNT(DISTINCT alerts.id) FILTER (WHERE alerts.status = 'open')::text AS "alertCount",
              COUNT(DISTINCT ai_suggestions.id) FILTER (WHERE ai_suggestions.status IN ('nueva', 'vista', 'asignada', 'en_progreso'))::text AS "openSuggestions"
       FROM companies
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
         AND subscriptions.status IN ('trial', 'active', 'past_due')
       LEFT JOIN users owner ON owner.company_id = companies.id
         AND owner.role = 'propietario'
       LEFT JOIN alerts ON alerts.company_id = companies.id
       LEFT JOIN ai_suggestions ON ai_suggestions.company_id = companies.id
       WHERE companies.deleted_at IS NULL
       GROUP BY companies.id, subscriptions.status, subscriptions.trial_ends_at, owner.name, owner.email
       ORDER BY COUNT(DISTINCT alerts.id) FILTER (WHERE alerts.status = 'open') DESC,
                companies.created_at DESC
       LIMIT 8`
    ),
    query<CriticalAlertRow>(
      `SELECT companies.name AS "companyName",
              alerts.level,
              alerts.title,
              alerts.text,
              alerts.created_at AS "createdAt"
       FROM alerts
       JOIN companies ON companies.id = alerts.company_id
       WHERE alerts.status = 'open'
       ORDER BY CASE alerts.level WHEN 'danger' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END,
                alerts.created_at DESC
       LIMIT 8`
    )
  ]);

  return {
    activity: {
      importsToday: toNumber(activity.rows[0]?.importsToday),
      loginsToday: toNumber(activity.rows[0]?.loginsToday),
      newCompaniesToday: toNumber(activity.rows[0]?.newCompaniesToday),
      suggestionsToday: toNumber(activity.rows[0]?.suggestionsToday)
    },
    companies: companies.rows,
    criticalAlerts: criticalAlerts.rows,
    sales: {
      ordersToday: toNumber(sales.rows[0]?.ordersToday),
      pendingReceivables: toNumber(sales.rows[0]?.pendingReceivables),
      salesMonth: toNumber(sales.rows[0]?.salesMonth),
      salesToday: toNumber(sales.rows[0]?.salesToday)
    },
    summary: {
      activeSubscriptions: toNumber(summary.rows[0]?.activeSubscriptions),
      blockedCompanies: toNumber(summary.rows[0]?.blockedCompanies),
      companies: toNumber(summary.rows[0]?.companies),
      invoiceFailures: toNumber(summary.rows[0]?.invoiceFailures),
      openAlerts: toNumber(summary.rows[0]?.openAlerts),
      openSupport: toNumber(summary.rows[0]?.openSupport),
      paidToday: toNumber(summary.rows[0]?.paidToday),
      pendingPayments: toNumber(summary.rows[0]?.pendingPayments),
      sentInvoices: toNumber(summary.rows[0]?.sentInvoices),
      trialSubscriptions: toNumber(summary.rows[0]?.trialSubscriptions),
      users: toNumber(summary.rows[0]?.users)
    }
  };
}

function renderAdminDailyStatus(report: Awaited<ReturnType<typeof getAdminDailyStatus>>) {
  const companyLines = report.companies.length
    ? report.companies.map((company, index) => {
        const access = company.accessBlockedAt ? "Bloqueado" : "Habilitado";
        const subscription = company.status === "trial"
          ? `Trial hasta ${dateLabel(company.trialEndsAt)}`
          : company.status || "Sin suscripci\u00F3n";
        return `${index + 1}. ${cleanStatusText(company.companyName)} - Plan ${String(company.plan || "go").toUpperCase()} - ${subscription} - ${access} - Alertas: ${company.alertCount} - Sugerencias IA: ${company.openSuggestions} - Propietario: ${cleanStatusText(company.ownerName || "Sin propietario")} (${company.ownerEmail || "sin email"})`;
      }).join("\n")
    : "No hay empresas activas para reportar.";

  const alertLines = report.criticalAlerts.length
    ? report.criticalAlerts.map((alert, index) => `${index + 1}. ${cleanStatusText(alert.companyName)} - ${alert.level.toUpperCase()} - ${cleanStatusText(alert.title)}: ${cleanStatusText(alert.text)} (${dateLabel(alert.createdAt)})`).join("\n")
    : "No hay alertas abiertas cr\u00EDticas o pendientes.";

  return `Status diario de Copiloto Pyme
Fecha: ${todayLabel()}

Resumen SaaS
- Empresas activas: ${report.summary.companies}
- Usuarios activos: ${report.summary.users}
- Empresas bloqueadas: ${report.summary.blockedCompanies}
- Suscripciones en prueba: ${report.summary.trialSubscriptions}
- Suscripciones activas: ${report.summary.activeSubscriptions}
- Pagos pendientes: ${report.summary.pendingPayments}
- Pagos recibidos hoy: ${money(report.summary.paidToday)}
- Facturas SIIGO enviadas/aceptadas: ${report.summary.sentInvoices}
- Facturas SIIGO fallidas/rechazadas: ${report.summary.invoiceFailures}
- Alertas abiertas: ${report.summary.openAlerts}
- Casos de soporte abiertos: ${report.summary.openSupport}

M\u00E9tricas comerciales
- Ventas registradas hoy: ${money(report.sales.salesToday)}
- \u00D3rdenes registradas hoy: ${report.sales.ordersToday}
- Ventas del mes: ${money(report.sales.salesMonth)}
- Cuentas por cobrar: ${money(report.sales.pendingReceivables)}

Actividad de hoy
- Empresas nuevas: ${report.activity.newCompaniesToday}
- Logins: ${report.activity.loginsToday}
- Importaciones CSV: ${report.activity.importsToday}
- Sugerencias IA generadas: ${report.activity.suggestionsToday}

Empresas que requieren seguimiento
${companyLines}

Alertas importantes
${alertLines}

Acciones sugeridas para ma\u00F1ana
- Revisar empresas bloqueadas o con pago pendiente.
- Validar facturas SIIGO fallidas o rechazadas.
- Atender alertas cr\u00EDticas abiertas por empresa.
- Revisar clientes con trial pr\u00F3ximo a vencer.
- Confirmar que las empresas nuevas completen onboarding y carga de datos.`;
}
