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

function severityLabel(severity: string | null | undefined) {
  if (severity === "danger") return "Crítica";
  if (severity === "warning") return "Atención";
  if (severity === "success") return "Resuelta";
  return "Info";
}

function categoryLabel(category: string) {
  const labels: Record<string, string> = {
    api: "API",
    database: "Base de datos",
    integration: "Integración",
    payment: "Pagos",
    performance: "Rendimiento",
    siigo: "SIIGO / DIAN",
    csv: "CSV"
  };

  return labels[category] || "Sistema";
}

function ownerLabel(category: string) {
  if (category === "payment") return "Operaciones / Pagos";
  if (category === "siigo") return "Facturación";
  if (category === "database") return "Infraestructura";
  if (category === "performance") return "Producto";
  if (category === "csv") return "Soporte";
  return "Tecnología";
}

export async function getAdminSystemAlerts() {
  const [summary, alerts, health] = await Promise.all([
    query<{
      apiFailures: string;
      databaseFailures: string;
      siigoFailures: string;
      paymentFailures: string;
      slowEvents: string;
      integrationFailures: string;
      csvFailures: string;
    }>(
      `SELECT (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '7 days'
                  AND (
                    title ILIKE '%api%' OR description ILIKE '%api%' OR
                    title ILIKE '%endpoint%' OR description ILIKE '%endpoint%' OR
                    title ILIKE '%server%' OR description ILIKE '%server%'
                  )
              )::text AS "apiFailures",
              (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '7 days'
                  AND (
                    title ILIKE '%base de datos%' OR description ILIKE '%base de datos%' OR
                    title ILIKE '%database%' OR description ILIKE '%database%' OR
                    title ILIKE '%supabase%' OR description ILIKE '%supabase%' OR
                    title ILIKE '%postgres%' OR description ILIKE '%postgres%'
                  )
              )::text AS "databaseFailures",
              (
                (SELECT COUNT(*) FROM siigo_invoices WHERE status IN ('failed', 'rejected') AND created_at >= NOW() - INTERVAL '7 days') +
                (SELECT COUNT(*) FROM siigo_invoice_logs WHERE status = 'error' AND created_at >= NOW() - INTERVAL '7 days')
              )::text AS "siigoFailures",
              (
                SELECT COUNT(*)
                FROM payment_transactions
                WHERE status IN ('failed', 'expired', 'canceled')
                  AND created_at >= NOW() - INTERVAL '7 days'
              )::text AS "paymentFailures",
              (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '7 days'
                  AND (
                    title ILIKE '%lento%' OR description ILIKE '%lento%' OR
                    title ILIKE '%lentitud%' OR description ILIKE '%lentitud%' OR
                    title ILIKE '%timeout%' OR description ILIKE '%timeout%' OR
                    title ILIKE '%latencia%' OR description ILIKE '%latencia%' OR
                    title ILIKE '%inp%' OR description ILIKE '%inp%'
                  )
              )::text AS "slowEvents",
              (
                SELECT COUNT(*)
                FROM integrations
                WHERE status IN ('Error', 'Fallida', 'Fallido', 'Desconectado')
                  AND updated_at >= NOW() - INTERVAL '7 days'
              )::text AS "integrationFailures",
              (
                SELECT COUNT(*)
                FROM imported_data_batches
                WHERE error_count > 0
                  AND created_at >= NOW() - INTERVAL '7 days'
              )::text AS "csvFailures"`
    ),
    query<{
      id: string;
      companyId: string | null;
      companyName: string | null;
      category: string;
      title: string;
      description: string;
      severity: string;
      occurredAt: string;
    }>(
      `WITH payment_failures AS (
         SELECT payment_transactions.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'payment' AS category,
                CONCAT('Pago ', payment_transactions.status) AS title,
                CONCAT(payment_providers.name, ' · COP ', payment_transactions.amount_cop::text, ' · ', payment_transactions.external_reference) AS description,
                'danger' AS severity,
                payment_transactions.created_at AS occurred_at
         FROM payment_transactions
         JOIN companies ON companies.id = payment_transactions.company_id
         JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
         WHERE payment_transactions.status IN ('failed', 'expired', 'canceled')
           AND companies.deleted_at IS NULL
       ),
       siigo_failures AS (
         SELECT siigo_invoices.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'siigo' AS category,
                CONCAT('Factura ', siigo_invoices.status) AS title,
                COALESCE(siigo_invoices.error_message, 'Factura no pudo ser validada o enviada') AS description,
                'danger' AS severity,
                siigo_invoices.created_at AS occurred_at
         FROM siigo_invoices
         JOIN companies ON companies.id = siigo_invoices.company_id
         WHERE siigo_invoices.status IN ('failed', 'rejected')
           AND companies.deleted_at IS NULL
       ),
       siigo_log_errors AS (
         SELECT siigo_invoice_logs.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'siigo' AS category,
                CONCAT('Intento SIIGO ', siigo_invoice_logs.action) AS title,
                COALESCE(siigo_invoice_logs.error_message, 'Intento de facturación con error') AS description,
                'warning' AS severity,
                siigo_invoice_logs.created_at AS occurred_at
         FROM siigo_invoice_logs
         LEFT JOIN companies ON companies.id = siigo_invoice_logs.company_id
         WHERE siigo_invoice_logs.status = 'error'
           AND (companies.deleted_at IS NULL OR companies.id IS NULL)
       ),
       integration_failures AS (
         SELECT integrations.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'integration' AS category,
                CONCAT('Integración ', integrations.provider, ' requiere atención') AS title,
                CONCAT(integrations.category, ' · Estado: ', integrations.status, ' · Sync: ', integrations.sync_label) AS description,
                'warning' AS severity,
                integrations.updated_at AS occurred_at
         FROM integrations
         JOIN companies ON companies.id = integrations.company_id
         WHERE integrations.status IN ('Error', 'Fallida', 'Fallido', 'Desconectado')
           AND companies.deleted_at IS NULL
       ),
       csv_failures AS (
         SELECT imported_data_batches.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'csv' AS category,
                'Importación CSV con errores' AS title,
                CONCAT(COALESCE(imported_data_batches.file_name, 'Archivo sin nombre'), ' · ', imported_data_batches.error_count::text, ' errores de ', imported_data_batches.row_count::text, ' filas') AS description,
                'warning' AS severity,
                imported_data_batches.created_at AS occurred_at
         FROM imported_data_batches
         JOIN companies ON companies.id = imported_data_batches.company_id
         WHERE imported_data_batches.error_count > 0
           AND companies.deleted_at IS NULL
       ),
       system_events AS (
         SELECT activity_events.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                CASE
                  WHEN activity_events.title ILIKE '%base de datos%' OR activity_events.description ILIKE '%database%' OR activity_events.description ILIKE '%supabase%' THEN 'database'
                  WHEN activity_events.title ILIKE '%lento%' OR activity_events.description ILIKE '%latencia%' OR activity_events.description ILIKE '%timeout%' THEN 'performance'
                  WHEN activity_events.title ILIKE '%api%' OR activity_events.description ILIKE '%endpoint%' THEN 'api'
                  ELSE 'api'
                END AS category,
                activity_events.title,
                activity_events.description,
                activity_events.severity,
                activity_events.occurred_at
         FROM activity_events
         JOIN companies ON companies.id = activity_events.company_id
         WHERE activity_events.severity IN ('danger', 'warning')
           AND companies.deleted_at IS NULL
       )
       SELECT id,
              company_id AS "companyId",
              company_name AS "companyName",
              category,
              title,
              description,
              severity,
              occurred_at AS "occurredAt"
       FROM (
         SELECT * FROM payment_failures
         UNION ALL SELECT * FROM siigo_failures
         UNION ALL SELECT * FROM siigo_log_errors
         UNION ALL SELECT * FROM integration_failures
         UNION ALL SELECT * FROM csv_failures
         UNION ALL SELECT * FROM system_events
       ) system_alerts
       WHERE occurred_at >= NOW() - INTERVAL '30 days'
       ORDER BY occurred_at DESC
       LIMIT 80`
    ),
    query<{
      lastCompanyCreatedAt: string | null;
      lastPaymentCreatedAt: string | null;
      lastInvoiceLogAt: string | null;
      lastActivityAt: string | null;
    }>(
      `SELECT (SELECT MAX(created_at) FROM companies)::text AS "lastCompanyCreatedAt",
              (SELECT MAX(created_at) FROM payment_transactions)::text AS "lastPaymentCreatedAt",
              (SELECT MAX(created_at) FROM siigo_invoice_logs)::text AS "lastInvoiceLogAt",
              (SELECT MAX(occurred_at) FROM activity_events)::text AS "lastActivityAt"`
    )
  ]);

  const summaryRow = summary.rows[0];
  const values = {
    apiFailures: toNumber(summaryRow?.apiFailures),
    databaseFailures: toNumber(summaryRow?.databaseFailures),
    siigoFailures: toNumber(summaryRow?.siigoFailures),
    paymentFailures: toNumber(summaryRow?.paymentFailures),
    slowEvents: toNumber(summaryRow?.slowEvents),
    integrationFailures: toNumber(summaryRow?.integrationFailures),
    csvFailures: toNumber(summaryRow?.csvFailures)
  };
  const activeAlerts = Object.values(values).reduce((total, value) => total + value, 0);
  const criticalAlerts = values.databaseFailures + values.siigoFailures + values.paymentFailures;
  const healthRow = health.rows[0];

  return {
    alerts: alerts.rows.map((alert) => ({
      ...alert,
      categoryLabel: categoryLabel(alert.category),
      occurredLabel: toDateTimeLabel(alert.occurredAt),
      ownerLabel: ownerLabel(alert.category),
      severityLabel: severityLabel(alert.severity)
    })),
    health: [
      {
        label: "API",
        status: values.apiFailures > 0 ? "Revisar" : "Operativa",
        detail: values.apiFailures > 0 ? `${values.apiFailures} eventos recientes` : "Sin errores internos reportados"
      },
      {
        label: "Base de datos",
        status: values.databaseFailures > 0 ? "Riesgo" : "Operativa",
        detail: healthRow?.lastActivityAt ? `Última actividad: ${toDateTimeLabel(healthRow.lastActivityAt)}` : "Consultas administrativas OK"
      },
      {
        label: "SIIGO / DIAN",
        status: values.siigoFailures > 0 ? "Degradada" : "Operativa",
        detail: healthRow?.lastInvoiceLogAt ? `Último intento: ${toDateTimeLabel(healthRow.lastInvoiceLogAt)}` : "Sin intentos recientes"
      },
      {
        label: "Pagos",
        status: values.paymentFailures > 0 ? "Revisar" : "Operativos",
        detail: healthRow?.lastPaymentCreatedAt ? `Último pago creado: ${toDateTimeLabel(healthRow.lastPaymentCreatedAt)}` : "Sin pagos recientes"
      }
    ],
    summary: {
      ...values,
      activeAlerts,
      criticalAlerts
    }
  };
}
