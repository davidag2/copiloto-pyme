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

function actionLabel(action: string) {
  const labels: Record<string, string> = {
    block_access: "Bloquear cliente",
    change_plan: "Cambiar plan",
    delete_client: "Eliminar cliente",
    extend_trial: "Extender prueba",
    impersonate_client: "Impersonar cliente",
    mark_manual_payment: "Pago manual",
    open_support_case: "Abrir soporte",
    resend_invoice: "Reenviar factura",
    resend_payment_link: "Reenviar pago",
    restore_client: "Restaurar cliente",
    send_payment_reminder_email: "Recordatorio email",
    send_payment_reminder_whatsapp: "Recordatorio WhatsApp",
    unblock_access: "Desbloquear cliente"
  };

  return labels[action] || action;
}

function riskLabel(action: string) {
  if (["delete_client", "impersonate_client", "block_access", "mark_manual_payment"].includes(action)) return "Alto";
  if (["change_plan", "extend_trial", "resend_invoice", "restore_client"].includes(action)) return "Medio";
  return "Bajo";
}

function metadataSummary(metadata: Record<string, unknown> | null) {
  if (!metadata) return "Sin metadata";
  const keys = Object.keys(metadata);
  if (!keys.length) return "Sin metadata";
  return keys.slice(0, 4).map((key) => `${key}: ${String(metadata[key])}`).join(" · ");
}

export async function getAdminAudit() {
  try {
    const [summary, events] = await Promise.all([
      query<{
        total: string;
        last24h: string;
        highRisk: string;
        impersonations: string;
        uniqueAdmins: string;
      }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::text AS "last24h",
                COUNT(*) FILTER (WHERE action IN ('delete_client', 'impersonate_client', 'block_access', 'mark_manual_payment'))::text AS "highRisk",
                COUNT(*) FILTER (WHERE action = 'impersonate_client')::text AS impersonations,
                COUNT(DISTINCT admin_user_id)::text AS "uniqueAdmins"
         FROM admin_client_actions`
      ),
      query<{
        id: string;
        companyId: string;
        companyName: string;
        adminName: string | null;
        adminEmail: string | null;
        action: string;
        channel: string | null;
        ipAddress: string | null;
        userAgent: string | null;
        requestPath: string | null;
        requestMethod: string | null;
        targetType: string | null;
        targetId: string | null;
        metadata: Record<string, unknown> | null;
        createdAt: string;
      }>(
        `SELECT admin_client_actions.id,
                companies.id AS "companyId",
                companies.name AS "companyName",
                admin_users.name AS "adminName",
                admin_users.email AS "adminEmail",
                admin_client_actions.action,
                admin_client_actions.channel,
                admin_client_actions.ip_address AS "ipAddress",
                admin_client_actions.user_agent AS "userAgent",
                admin_client_actions.request_path AS "requestPath",
                admin_client_actions.request_method AS "requestMethod",
                admin_client_actions.target_type AS "targetType",
                admin_client_actions.target_id::text AS "targetId",
                admin_client_actions.metadata,
                admin_client_actions.created_at AS "createdAt"
         FROM admin_client_actions
         JOIN companies ON companies.id = admin_client_actions.company_id
         LEFT JOIN users admin_users ON admin_users.id = admin_client_actions.admin_user_id
         ORDER BY admin_client_actions.created_at DESC
         LIMIT 120`
      )
    ]);

    const summaryRow = summary.rows[0];

    return {
      events: events.rows.map((event) => ({
        ...event,
        actionLabel: actionLabel(event.action),
        createdLabel: toDateTimeLabel(event.createdAt),
        metadataSummary: metadataSummary(event.metadata),
        riskLabel: riskLabel(event.action),
        userAgentLabel: event.userAgent ? event.userAgent.slice(0, 90) : "Sin user-agent"
      })),
      setupRequired: false,
      summary: {
        highRisk: toNumber(summaryRow?.highRisk),
        impersonations: toNumber(summaryRow?.impersonations),
        last24h: toNumber(summaryRow?.last24h),
        total: toNumber(summaryRow?.total),
        uniqueAdmins: toNumber(summaryRow?.uniqueAdmins)
      }
    };
  } catch (error) {
    return {
      events: [],
      setupRequired: error instanceof Error,
      summary: {
        highRisk: 0,
        impersonations: 0,
        last24h: 0,
        total: 0,
        uniqueAdmins: 0
      }
    };
  }
}
