import { query } from "@/lib/db";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function invoiceStatusLabel(status: string | null | undefined) {
  if (status === "waiting_payment") return "Esperando pago";
  if (status === "configuration_required") return "Configurar SIIGO";
  if (status === "billing_profile_required") return "Datos fiscales";
  if (status === "ready") return "Lista";
  if (status === "sent") return "Enviada";
  if (status === "accepted") return "Aceptada";
  if (status === "rejected") return "Rechazada";
  if (status === "failed") return "Falló";
  return "Sin estado";
}

function logStatusLabel(status: string | null | undefined) {
  if (status === "success") return "Éxito";
  if (status === "error") return "Error";
  if (status === "skipped") return "Pendiente";
  return "Sin estado";
}

async function getSiigoLogs() {
  try {
    const logs = await query<{
      id: string;
      invoiceId: string | null;
      companyName: string | null;
      status: string;
      action: string;
      attemptNumber: string;
      canRetry: boolean;
      errorMessage: string | null;
      createdAt: string;
    }>(
      `SELECT siigo_invoice_logs.id,
              siigo_invoice_logs.siigo_invoice_id AS "invoiceId",
              companies.name AS "companyName",
              siigo_invoice_logs.status,
              siigo_invoice_logs.action,
              siigo_invoice_logs.attempt_number::text AS "attemptNumber",
              siigo_invoice_logs.can_retry AS "canRetry",
              siigo_invoice_logs.error_message AS "errorMessage",
              siigo_invoice_logs.created_at AS "createdAt"
       FROM siigo_invoice_logs
       LEFT JOIN companies ON companies.id = siigo_invoice_logs.company_id
       ORDER BY siigo_invoice_logs.created_at DESC
       LIMIT 12`
    );

    return logs.rows.map((log) => ({
      ...log,
      attemptNumber: toNumber(log.attemptNumber),
      createdLabel: toDateLabel(log.createdAt),
      statusLabel: logStatusLabel(log.status)
    }));
  } catch {
    return [];
  }
}

export async function getAdminInvoices() {
  const [summary, invoices, logs] = await Promise.all([
    query<{
      sent: string;
      ready: string;
      failed: string;
      rejected: string;
      accepted: string;
    }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'sent')::text AS sent,
              COUNT(*) FILTER (WHERE status IN ('waiting_payment', 'ready', 'configuration_required', 'billing_profile_required'))::text AS ready,
              COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
              COUNT(*) FILTER (WHERE status = 'rejected')::text AS rejected,
              COUNT(*) FILTER (WHERE status = 'accepted')::text AS accepted
       FROM siigo_invoices`
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      customerName: string | null;
      nit: string | null;
      amountCop: string | null;
      providerName: string | null;
      status: string;
      invoiceNumber: string | null;
      siigoCufe: string | null;
      errorMessage: string | null;
      sentAt: string | null;
      acceptedAt: string | null;
      createdAt: string;
    }>(
      `SELECT siigo_invoices.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              billing_profiles.legal_name AS "customerName",
              billing_profiles.identification AS nit,
              payment_transactions.amount_cop::text AS "amountCop",
              payment_providers.name AS "providerName",
              siigo_invoices.status,
              COALESCE(siigo_invoices.siigo_invoice_number, siigo_invoices.siigo_invoice_name, siigo_invoices.siigo_invoice_id) AS "invoiceNumber",
              siigo_invoices.siigo_cufe AS "siigoCufe",
              siigo_invoices.error_message AS "errorMessage",
              siigo_invoices.sent_at AS "sentAt",
              siigo_invoices.accepted_at AS "acceptedAt",
              siigo_invoices.created_at AS "createdAt"
       FROM siigo_invoices
       JOIN companies ON companies.id = siigo_invoices.company_id
       JOIN payment_transactions ON payment_transactions.id = siigo_invoices.payment_transaction_id
       LEFT JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       LEFT JOIN billing_profiles ON billing_profiles.company_id = companies.id
       ORDER BY siigo_invoices.created_at DESC
       LIMIT 30`
    ),
    getSiigoLogs()
  ]);

  const summaryRow = summary.rows[0];

  return {
    invoices: invoices.rows.map((invoice) => ({
      ...invoice,
      amountCop: toNumber(invoice.amountCop),
      customerName: invoice.customerName || invoice.companyName,
      dateLabel: toDateLabel(invoice.acceptedAt || invoice.sentAt || invoice.createdAt),
      invoiceNumber: invoice.invoiceNumber || "Sin número",
      nit: invoice.nit || "Sin NIT",
      statusLabel: invoiceStatusLabel(invoice.status)
    })),
    logs,
    summary: {
      accepted: toNumber(summaryRow?.accepted),
      failed: toNumber(summaryRow?.failed),
      ready: toNumber(summaryRow?.ready),
      rejected: toNumber(summaryRow?.rejected),
      sent: toNumber(summaryRow?.sent)
    }
  };
}
