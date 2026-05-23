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

type EmailRecipientRow = {
  companyId: string;
  companyName: string;
  ownerEmail: string;
  ownerName: string;
  plan: string;
  status: string | null;
};

type EmailTemplateRow = {
  bodyText: string;
  id: string;
  name: string;
  preheader: string;
  subject: string;
  templateKey: string;
};

type EmailLogRow = {
  companyName: string | null;
  createdAt: string;
  errorMessage: string | null;
  id: string;
  recipientEmail: string;
  status: string;
  subject: string;
};

export async function getAdminEmailCenter() {
  const [recipients, templates, logs, summary] = await Promise.all([
    getRecipients(),
    getTemplates(),
    getLogs(),
    getSummary()
  ]);

  return {
    logs,
    recipients,
    summary,
    templates
  };
}

async function getRecipients() {
  const recipients = await query<EmailRecipientRow>(
    `SELECT companies.id AS "companyId",
            companies.name AS "companyName",
            companies.plan,
            subscriptions.status,
            users.name AS "ownerName",
            users.email AS "ownerEmail"
     FROM companies
     JOIN users ON users.company_id = companies.id
       AND users.role = 'propietario'
       AND users.status <> 'disabled'
     LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
       AND subscriptions.status IN ('trial', 'active', 'past_due')
     WHERE companies.deleted_at IS NULL
     ORDER BY companies.created_at DESC
     LIMIT 100`
  );

  return recipients.rows.map((recipient) => ({
    ...recipient,
    label: `${recipient.companyName} - ${recipient.ownerEmail}`,
    planLabel: `Plan ${String(recipient.plan || "go").toUpperCase()}`,
    statusLabel: recipient.status === "trial" ? "Prueba gratis" : recipient.status === "active" ? "Activo" : recipient.status === "past_due" ? "Pago pendiente" : "Sin suscripción"
  }));
}

async function getTemplates() {
  try {
    const templates = await query<EmailTemplateRow>(
      `SELECT id,
              template_key AS "templateKey",
              name,
              subject,
              preheader,
              body_text AS "bodyText"
       FROM admin_email_templates
       WHERE status = 'active'
       ORDER BY created_at ASC`
    );
    if (templates.rows.length) return templates.rows;
  } catch {
    // The module can render before the SQL migration is applied.
  }

  return defaultTemplates;
}

async function getLogs() {
  try {
    const logs = await query<EmailLogRow>(
      `SELECT admin_email_logs.id,
              admin_email_logs.recipient_email AS "recipientEmail",
              admin_email_logs.subject,
              admin_email_logs.status,
              admin_email_logs.error_message AS "errorMessage",
              admin_email_logs.created_at AS "createdAt",
              companies.name AS "companyName"
       FROM admin_email_logs
       LEFT JOIN companies ON companies.id = admin_email_logs.company_id
       ORDER BY admin_email_logs.created_at DESC
       LIMIT 30`
    );

    return logs.rows.map((log) => ({
      ...log,
      createdLabel: toDateLabel(log.createdAt),
      statusLabel: statusLabel(log.status)
    }));
  } catch {
    return [];
  }
}

async function getSummary() {
  try {
    const summary = await query<{
      configPending: string;
      failed: string;
      sent: string;
      total: string;
    }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status = 'sent')::text AS sent,
              COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
              COUNT(*) FILTER (WHERE status = 'configuration_required')::text AS "configPending"
       FROM admin_email_logs
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    );

    return {
      configPending: toNumber(summary.rows[0]?.configPending),
      failed: toNumber(summary.rows[0]?.failed),
      sent: toNumber(summary.rows[0]?.sent),
      total: toNumber(summary.rows[0]?.total)
    };
  } catch {
    return {
      configPending: process.env.RESEND_API_KEY ? 0 : 1,
      failed: 0,
      sent: 0,
      total: 0
    };
  }
}

function statusLabel(status: string) {
  if (status === "sent") return "Enviado";
  if (status === "failed") return "Falló";
  if (status === "configuration_required") return "Configurar";
  return "Borrador";
}

const defaultTemplates = [
  {
    bodyText: "Hola {{nombre}},\n\nQueríamos contarte una novedad importante de Copiloto Pyme para {{empresa}}.\n\nTu equipo puede entrar al dashboard y revisar ventas, caja, inventario y decisiones recomendadas para hoy.\n\nEstamos atentos para acompañarte.",
    id: "default-product-update",
    name: "Actualización de producto",
    preheader: "Novedades importantes para administrar mejor tu PYME.",
    subject: "Novedades de Copiloto Pyme para tu empresa",
    templateKey: "product_update"
  },
  {
    bodyText: "Hola {{nombre}},\n\nVimos que {{empresa}} todavía puede completar algunos pasos para aprovechar mejor Copiloto Pyme.\n\nTe recomendamos cargar tus datos de ventas, caja e inventario para recibir un resumen diario más útil.\n\nSi necesitas ayuda, responde este correo y te acompañamos.",
    id: "default-onboarding",
    name: "Seguimiento onboarding",
    preheader: "Completa tu configuración y recibe mejores decisiones diarias.",
    subject: "Completa tu onboarding en Copiloto Pyme",
    templateKey: "onboarding_followup"
  },
  {
    bodyText: "Hola {{nombre}},\n\nTu cuenta de {{empresa}} tiene un pago pendiente. Para mantener activo el dashboard después del mes gratis, realiza el pago del plan contratado.\n\nSi ya pagaste, responde este correo para ayudarte a validar el estado.",
    id: "default-payment",
    name: "Recordatorio de pago",
    preheader: "Mantén activo el acceso al dashboard de Copiloto Pyme.",
    subject: "Recordatorio de pago de Copiloto Pyme",
    templateKey: "payment_reminder"
  }
];
