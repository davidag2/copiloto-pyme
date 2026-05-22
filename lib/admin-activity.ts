import { query } from "@/lib/db";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateTimeLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function typeLabel(type: string) {
  const labels: Record<string, string> = {
    admin_action: "Acción admin",
    csv_import: "Importación CSV",
    error: "Error",
    invoice: "Factura",
    login: "Login",
    payment: "Pago",
    plan_change: "Cambio de plan",
    register: "Registro",
    system_event: "Evento"
  };
  return labels[type] || "Evento";
}

function severityLabel(severity: string) {
  if (severity === "danger") return "Crítico";
  if (severity === "warning") return "Atención";
  if (severity === "success") return "Correcto";
  return "Info";
}

export async function getAdminActivity() {
  const [summary, timeline] = await Promise.all([
    query<{
      registrations: string;
      payments: string;
      logins: string;
      imports: string;
      errors: string;
      planChanges: string;
      invoices: string;
    }>(
      `SELECT (SELECT COUNT(*) FROM companies WHERE created_at >= NOW() - INTERVAL '30 days')::text AS registrations,
              (SELECT COUNT(*) FROM payment_transactions WHERE created_at >= NOW() - INTERVAL '30 days')::text AS payments,
              (SELECT COUNT(*) FROM users WHERE last_login_at >= NOW() - INTERVAL '30 days')::text AS logins,
              (SELECT COUNT(*) FROM imported_data_batches WHERE created_at >= NOW() - INTERVAL '30 days')::text AS imports,
              (
                (SELECT COUNT(*) FROM siigo_invoices WHERE status IN ('failed', 'rejected') AND created_at >= NOW() - INTERVAL '30 days') +
                (SELECT COUNT(*) FROM imported_data_batches WHERE error_count > 0 AND created_at >= NOW() - INTERVAL '30 days')
              )::text AS errors,
              (SELECT COUNT(*) FROM admin_client_actions WHERE action = 'change_plan' AND created_at >= NOW() - INTERVAL '30 days')::text AS "planChanges",
              (SELECT COUNT(*) FROM siigo_invoices WHERE created_at >= NOW() - INTERVAL '30 days')::text AS invoices`
    ),
    query<{
      id: string;
      companyId: string | null;
      companyName: string | null;
      type: string;
      title: string;
      description: string;
      severity: string;
      occurredAt: string;
    }>(
      `WITH registrations AS (
         SELECT companies.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'register' AS type,
                'Cliente registrado' AS title,
                CONCAT('Plan ', UPPER(companies.plan), ' · ', companies.business_type) AS description,
                'success' AS severity,
                companies.created_at AS occurred_at
         FROM companies
       ),
       logins AS (
         SELECT users.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'login' AS type,
                CONCAT('Login de ', users.name) AS title,
                users.email AS description,
                'info' AS severity,
                users.last_login_at AS occurred_at
         FROM users
         JOIN companies ON companies.id = users.company_id
         WHERE users.last_login_at IS NOT NULL
       ),
       payments AS (
         SELECT payment_transactions.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'payment' AS type,
                CONCAT('Pago ', payment_transactions.status) AS title,
                CONCAT(payment_providers.name, ' · COP ', payment_transactions.amount_cop::text, ' · ', payment_transactions.external_reference) AS description,
                CASE WHEN payment_transactions.status = 'paid' THEN 'success'
                     WHEN payment_transactions.status IN ('failed', 'expired', 'canceled') THEN 'danger'
                     ELSE 'warning' END AS severity,
                COALESCE(payment_transactions.paid_at, payment_transactions.created_at) AS occurred_at
         FROM payment_transactions
         JOIN companies ON companies.id = payment_transactions.company_id
         JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       ),
       imports AS (
         SELECT imported_data_batches.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'csv_import' AS type,
                'Importación CSV' AS title,
                CONCAT(COALESCE(imported_data_batches.file_name, 'Archivo sin nombre'), ' · ', imported_data_batches.row_count::text, ' filas · ', imported_data_batches.error_count::text, ' errores') AS description,
                CASE WHEN imported_data_batches.error_count > 0 THEN 'warning' ELSE 'success' END AS severity,
                imported_data_batches.created_at AS occurred_at
         FROM imported_data_batches
         JOIN companies ON companies.id = imported_data_batches.company_id
       ),
       invoices AS (
         SELECT siigo_invoices.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'invoice' AS type,
                CONCAT('Factura ', siigo_invoices.status) AS title,
                COALESCE(siigo_invoices.error_message, COALESCE(siigo_invoices.siigo_invoice_number, 'Factura SIIGO registrada')) AS description,
                CASE WHEN siigo_invoices.status IN ('accepted', 'sent') THEN 'success'
                     WHEN siigo_invoices.status IN ('failed', 'rejected') THEN 'danger'
                     ELSE 'warning' END AS severity,
                siigo_invoices.created_at AS occurred_at
         FROM siigo_invoices
         JOIN companies ON companies.id = siigo_invoices.company_id
       ),
       admin_actions AS (
         SELECT admin_client_actions.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                CASE WHEN admin_client_actions.action = 'change_plan' THEN 'plan_change' ELSE 'admin_action' END AS type,
                admin_client_actions.action AS title,
                CONCAT('Canal: ', COALESCE(admin_client_actions.channel, 'interno')) AS description,
                CASE WHEN admin_client_actions.action IN ('delete_client', 'block_access') THEN 'warning' ELSE 'info' END AS severity,
                admin_client_actions.created_at AS occurred_at
         FROM admin_client_actions
         JOIN companies ON companies.id = admin_client_actions.company_id
       ),
       events AS (
         SELECT activity_events.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'system_event' AS type,
                activity_events.title,
                activity_events.description,
                activity_events.severity,
                activity_events.occurred_at
         FROM activity_events
         JOIN companies ON companies.id = activity_events.company_id
       )
       SELECT id,
              company_id AS "companyId",
              company_name AS "companyName",
              type,
              title,
              description,
              severity,
              occurred_at AS "occurredAt"
       FROM (
         SELECT * FROM registrations
         UNION ALL SELECT * FROM logins
         UNION ALL SELECT * FROM payments
         UNION ALL SELECT * FROM imports
         UNION ALL SELECT * FROM invoices
         UNION ALL SELECT * FROM admin_actions
         UNION ALL SELECT * FROM events
       ) timeline
       WHERE occurred_at >= NOW() - INTERVAL '90 days'
       ORDER BY occurred_at DESC
       LIMIT 80`
    )
  ]);

  const summaryRow = summary.rows[0];

  return {
    summary: {
      errors: toNumber(summaryRow?.errors),
      imports: toNumber(summaryRow?.imports),
      invoices: toNumber(summaryRow?.invoices),
      logins: toNumber(summaryRow?.logins),
      payments: toNumber(summaryRow?.payments),
      planChanges: toNumber(summaryRow?.planChanges),
      registrations: toNumber(summaryRow?.registrations)
    },
    timeline: timeline.rows.map((item) => ({
      ...item,
      occurredLabel: toDateTimeLabel(item.occurredAt),
      severityLabel: severityLabel(item.severity),
      typeLabel: typeLabel(item.type)
    }))
  };
}
