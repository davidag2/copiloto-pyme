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

function statusFromCount(count: number) {
  if (count >= 5) return "Degradado";
  if (count > 0) return "Revisar";
  return "Operativo";
}

function severityLabel(severity: string | null | undefined) {
  if (severity === "danger") return "Crítico";
  if (severity === "warning") return "Atención";
  if (severity === "success") return "Correcto";
  return "Info";
}

async function timedQuery() {
  const startedAt = Date.now();
  await query("SELECT 1");
  return Date.now() - startedAt;
}

async function safeQuery<T>(callback: () => Promise<T>, fallback: T) {
  try {
    return await callback();
  } catch {
    return fallback;
  }
}

export async function getAdminMonitoring() {
  const startedAt = Date.now();
  const postgresLatencyMs = await safeQuery(timedQuery, 0);

  const [summary, database, recentErrors] = await Promise.all([
    query<{
      apiErrors: string;
      databaseErrors: string;
      siigoErrors: string;
      paymentErrors: string;
      integrationErrors: string;
      csvErrors: string;
      slowEvents: string;
    }>(
      `SELECT (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '24 hours'
                  AND (
                    title ILIKE '%api%' OR description ILIKE '%api%' OR
                    title ILIKE '%endpoint%' OR description ILIKE '%endpoint%' OR
                    title ILIKE '%server%' OR description ILIKE '%server%'
                  )
              )::text AS "apiErrors",
              (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '24 hours'
                  AND (
                    title ILIKE '%base de datos%' OR description ILIKE '%base de datos%' OR
                    title ILIKE '%database%' OR description ILIKE '%database%' OR
                    title ILIKE '%postgres%' OR description ILIKE '%postgres%' OR
                    title ILIKE '%supabase%' OR description ILIKE '%supabase%'
                  )
              )::text AS "databaseErrors",
              (
                (SELECT COUNT(*) FROM siigo_invoices WHERE status IN ('failed', 'rejected') AND created_at >= NOW() - INTERVAL '24 hours') +
                (SELECT COUNT(*) FROM siigo_invoice_logs WHERE status = 'error' AND created_at >= NOW() - INTERVAL '24 hours')
              )::text AS "siigoErrors",
              (
                SELECT COUNT(*)
                FROM payment_transactions
                WHERE status IN ('failed', 'expired', 'canceled')
                  AND created_at >= NOW() - INTERVAL '24 hours'
              )::text AS "paymentErrors",
              (
                SELECT COUNT(*)
                FROM integrations
                WHERE status IN ('Error', 'Fallida', 'Fallido', 'Desconectado')
                  AND updated_at >= NOW() - INTERVAL '24 hours'
              )::text AS "integrationErrors",
              (
                SELECT COUNT(*)
                FROM imported_data_batches
                WHERE error_count > 0
                  AND created_at >= NOW() - INTERVAL '24 hours'
              )::text AS "csvErrors",
              (
                SELECT COUNT(*)
                FROM activity_events
                WHERE severity IN ('danger', 'warning')
                  AND occurred_at >= NOW() - INTERVAL '24 hours'
                  AND (
                    title ILIKE '%lento%' OR description ILIKE '%lento%' OR
                    title ILIKE '%lentitud%' OR description ILIKE '%lentitud%' OR
                    title ILIKE '%timeout%' OR description ILIKE '%timeout%' OR
                    title ILIKE '%latencia%' OR description ILIKE '%latencia%' OR
                    title ILIKE '%inp%' OR description ILIKE '%inp%'
                  )
              )::text AS "slowEvents"`
    ),
    safeQuery(
      async () => (await query<{
        databaseName: string;
        databaseSize: string;
        databaseSizeBytes: string;
        visibleConnections: string;
        tableCount: string;
        estimatedRows: string;
        lastActivityAt: string | null;
        lastPaymentAt: string | null;
      }>(
        `SELECT current_database() AS "databaseName",
                pg_size_pretty(pg_database_size(current_database())) AS "databaseSize",
                pg_database_size(current_database())::text AS "databaseSizeBytes",
                (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database())::text AS "visibleConnections",
                (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::text AS "tableCount",
                COALESCE((SELECT SUM(n_live_tup) FROM pg_stat_user_tables), 0)::text AS "estimatedRows",
                (SELECT MAX(occurred_at) FROM activity_events)::text AS "lastActivityAt",
                (SELECT MAX(created_at) FROM payment_transactions)::text AS "lastPaymentAt"`
      )).rows,
      []
    ),
    query<{
      id: string;
      companyId: string | null;
      companyName: string | null;
      source: string;
      title: string;
      description: string;
      severity: string;
      occurredAt: string;
    }>(
      `WITH system_events AS (
         SELECT activity_events.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Sistema' AS source,
                activity_events.title,
                activity_events.description,
                activity_events.severity,
                activity_events.occurred_at
         FROM activity_events
         JOIN companies ON companies.id = activity_events.company_id
         WHERE activity_events.severity IN ('danger', 'warning')
       ),
       payment_events AS (
         SELECT payment_transactions.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Pagos' AS source,
                CONCAT('Pago ', payment_transactions.status) AS title,
                CONCAT(payment_providers.name, ' · COP ', payment_transactions.amount_cop::text) AS description,
                'danger' AS severity,
                payment_transactions.created_at AS occurred_at
         FROM payment_transactions
         JOIN companies ON companies.id = payment_transactions.company_id
         JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
         WHERE payment_transactions.status IN ('failed', 'expired', 'canceled')
       ),
       siigo_events AS (
         SELECT siigo_invoice_logs.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'SIIGO' AS source,
                CONCAT('SIIGO ', siigo_invoice_logs.action) AS title,
                COALESCE(siigo_invoice_logs.error_message, 'Error de integración SIIGO') AS description,
                'danger' AS severity,
                siigo_invoice_logs.created_at AS occurred_at
         FROM siigo_invoice_logs
         LEFT JOIN companies ON companies.id = siigo_invoice_logs.company_id
         WHERE siigo_invoice_logs.status = 'error'
       ),
       csv_events AS (
         SELECT imported_data_batches.id::text AS id,
                companies.id AS company_id,
                companies.name AS company_name,
                'CSV' AS source,
                'CSV con errores' AS title,
                CONCAT(COALESCE(imported_data_batches.file_name, 'Archivo sin nombre'), ' · ', imported_data_batches.error_count::text, ' errores') AS description,
                'warning' AS severity,
                imported_data_batches.created_at AS occurred_at
         FROM imported_data_batches
         JOIN companies ON companies.id = imported_data_batches.company_id
         WHERE imported_data_batches.error_count > 0
       )
       SELECT id,
              company_id AS "companyId",
              company_name AS "companyName",
              source,
              title,
              description,
              severity,
              occurred_at AS "occurredAt"
       FROM (
         SELECT * FROM system_events
         UNION ALL SELECT * FROM payment_events
         UNION ALL SELECT * FROM siigo_events
         UNION ALL SELECT * FROM csv_events
       ) errors
       WHERE occurred_at >= NOW() - INTERVAL '7 days'
       ORDER BY occurred_at DESC
       LIMIT 20`
    )
  ]);

  const summaryRow = summary.rows[0];
  const databaseRow = database[0];
  const values = {
    apiErrors: toNumber(summaryRow?.apiErrors),
    databaseErrors: toNumber(summaryRow?.databaseErrors),
    siigoErrors: toNumber(summaryRow?.siigoErrors),
    paymentErrors: toNumber(summaryRow?.paymentErrors),
    integrationErrors: toNumber(summaryRow?.integrationErrors),
    csvErrors: toNumber(summaryRow?.csvErrors),
    slowEvents: toNumber(summaryRow?.slowEvents)
  };
  const totalErrors = Object.values(values).reduce((total, value) => total + value, 0);
  const apiResponseMs = Date.now() - startedAt;

  return {
    database: {
      databaseName: databaseRow?.databaseName || "PostgreSQL",
      databaseSize: databaseRow?.databaseSize || "No disponible",
      estimatedRows: toNumber(databaseRow?.estimatedRows),
      lastActivityLabel: toDateTimeLabel(databaseRow?.lastActivityAt),
      lastPaymentLabel: toDateTimeLabel(databaseRow?.lastPaymentAt),
      tableCount: toNumber(databaseRow?.tableCount),
      visibleConnections: toNumber(databaseRow?.visibleConnections)
    },
    recentErrors: recentErrors.rows.map((error) => ({
      ...error,
      occurredLabel: toDateTimeLabel(error.occurredAt),
      severityLabel: severityLabel(error.severity)
    })),
    services: [
      {
        name: "Vercel",
        status: process.env.VERCEL ? "Operativo" : "Local / Preview",
        detail: process.env.VERCEL_ENV ? `Entorno ${process.env.VERCEL_ENV}` : "Ejecución local o sin metadata Vercel",
        metric: `${apiResponseMs} ms`,
        metricLabel: "Respuesta server"
      },
      {
        name: "Supabase / PostgreSQL",
        status: statusFromCount(values.databaseErrors),
        detail: `${databaseRow?.databaseSize || "BD conectada"} · ${toNumber(databaseRow?.visibleConnections)} conexiones visibles`,
        metric: `${postgresLatencyMs} ms`,
        metricLabel: "Latencia consulta"
      },
      {
        name: "SIIGO / DIAN",
        status: statusFromCount(values.siigoErrors),
        detail: values.siigoErrors ? "Hay errores de facturación por revisar" : "Sin fallos recientes en logs",
        metric: String(values.siigoErrors),
        metricLabel: "Fallos 24h"
      },
      {
        name: "Pasarelas de pago",
        status: statusFromCount(values.paymentErrors),
        detail: values.paymentErrors ? "Pagos fallidos, expirados o cancelados" : "Sin fallos recientes",
        metric: String(values.paymentErrors),
        metricLabel: "Fallos 24h"
      }
    ],
    summary: {
      ...values,
      apiResponseMs,
      postgresLatencyMs,
      totalErrors
    }
  };
}
