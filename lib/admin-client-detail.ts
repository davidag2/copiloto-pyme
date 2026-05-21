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

function statusLabel(status: string | null | undefined) {
  if (status === "trial") return "Prueba gratis";
  if (status === "active") return "Activo";
  if (status === "past_due") return "Pago pendiente";
  if (status === "canceled") return "Cancelado";
  if (status === "paid") return "Pagado";
  if (status === "pending") return "Pendiente";
  if (status === "configuration_required") return "Configurar";
  if (status === "redirect_created") return "Link creado";
  if (status === "failed") return "Fallido";
  if (status === "expired") return "Expirado";
  if (status === "sent") return "Enviada";
  if (status === "accepted") return "Aceptada";
  if (status === "ready") return "Lista";
  if (status === "open") return "Abierta";
  if (status === "resolved") return "Resuelta";
  if (status === "Conectado") return "Conectado";
  if (status === "Disponible") return "Disponible";
  return status || "Sin estado";
}

export async function getAdminClientDetail(companyId: string) {
  const [company, users, subscription, payments, invoices, integrations, activity, alerts] = await Promise.all([
    query<{
      id: string;
      name: string;
      country: string;
      businessType: string;
      currency: string;
      plan: string;
      monthlyGoal: string;
      minimumStock: number;
      dataSource: string;
      createdAt: string;
    }>(
      `SELECT id,
              name,
              country,
              business_type AS "businessType",
              currency,
              plan,
              monthly_goal AS "monthlyGoal",
              minimum_stock AS "minimumStock",
              data_source AS "dataSource",
              created_at AS "createdAt"
       FROM companies
       WHERE id = $1
       LIMIT 1`,
      [companyId]
    ),
    query<{
      id: string;
      name: string;
      email: string;
      role: string;
      status: string;
      lastLoginAt: string | null;
      createdAt: string;
    }>(
      `SELECT id,
              name,
              email,
              role,
              status,
              last_login_at AS "lastLoginAt",
              created_at AS "createdAt"
       FROM users
       WHERE company_id = $1
       ORDER BY created_at ASC`,
      [companyId]
    ),
    query<{
      id: string;
      planId: string;
      planName: string;
      priceCop: string;
      status: string;
      trialEndsAt: string;
      currentPeriodEnd: string | null;
      createdAt: string;
    }>(
      `SELECT subscriptions.id,
              subscriptions.plan_id AS "planId",
              plans.name AS "planName",
              plans.price_cop AS "priceCop",
              subscriptions.status,
              subscriptions.trial_ends_at AS "trialEndsAt",
              subscriptions.current_period_end AS "currentPeriodEnd",
              subscriptions.created_at AS "createdAt"
       FROM subscriptions
       JOIN plans ON plans.id = subscriptions.plan_id
       WHERE subscriptions.company_id = $1
       ORDER BY subscriptions.created_at DESC
       LIMIT 1`,
      [companyId]
    ),
    query<{
      id: string;
      providerName: string;
      planName: string;
      amountCop: string;
      status: string;
      externalReference: string;
      createdAt: string;
      paidAt: string | null;
    }>(
      `SELECT payment_transactions.id,
              payment_providers.name AS "providerName",
              plans.name AS "planName",
              payment_transactions.amount_cop AS "amountCop",
              payment_transactions.status,
              payment_transactions.external_reference AS "externalReference",
              payment_transactions.created_at AS "createdAt",
              payment_transactions.paid_at AS "paidAt"
       FROM payment_transactions
       JOIN plans ON plans.id = payment_transactions.plan_id
       JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       WHERE payment_transactions.company_id = $1
       ORDER BY payment_transactions.created_at DESC
       LIMIT 10`,
      [companyId]
    ),
    query<{
      id: string;
      status: string;
      siigoInvoiceName: string | null;
      siigoInvoiceNumber: string | null;
      errorMessage: string | null;
      createdAt: string;
    }>(
      `SELECT id,
              status,
              siigo_invoice_name AS "siigoInvoiceName",
              siigo_invoice_number AS "siigoInvoiceNumber",
              error_message AS "errorMessage",
              created_at AS "createdAt"
       FROM siigo_invoices
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [companyId]
    ),
    query<{
      id: string;
      provider: string;
      category: string;
      status: string;
      syncLabel: string;
      lastSyncAt: string | null;
    }>(
      `SELECT id,
              provider,
              category,
              status,
              sync_label AS "syncLabel",
              last_sync_at AS "lastSyncAt"
       FROM integrations
       WHERE company_id = $1
       ORDER BY updated_at DESC
       LIMIT 10`,
      [companyId]
    ),
    query<{
      id: string;
      title: string;
      description: string;
      severity: string;
      occurredAt: string;
    }>(
      `SELECT id,
              title,
              description,
              severity,
              occurred_at AS "occurredAt"
       FROM activity_events
       WHERE company_id = $1
       ORDER BY occurred_at DESC
       LIMIT 10`,
      [companyId]
    ),
    query<{
      id: string;
      level: string;
      title: string;
      text: string;
      status: string;
      createdAt: string;
    }>(
      `SELECT id,
              level,
              title,
              text,
              status,
              created_at AS "createdAt"
       FROM alerts
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [companyId]
    )
  ]);

  const detail = company.rows[0];
  if (!detail) return null;

  return {
    alerts: alerts.rows.map((alert) => ({ ...alert, createdLabel: toDateLabel(alert.createdAt), statusLabel: statusLabel(alert.status) })),
    company: {
      ...detail,
      createdLabel: toDateLabel(detail.createdAt),
      monthlyGoal: toNumber(detail.monthlyGoal)
    },
    activity: activity.rows.map((event) => ({ ...event, occurredLabel: toDateLabel(event.occurredAt) })),
    integrations: integrations.rows.map((integration) => ({ ...integration, lastSyncLabel: toDateLabel(integration.lastSyncAt), statusLabel: statusLabel(integration.status) })),
    invoices: invoices.rows.map((invoice) => ({ ...invoice, createdLabel: toDateLabel(invoice.createdAt), statusLabel: statusLabel(invoice.status) })),
    payments: payments.rows.map((payment) => ({ ...payment, amountCop: toNumber(payment.amountCop), createdLabel: toDateLabel(payment.createdAt), paidLabel: toDateLabel(payment.paidAt), statusLabel: statusLabel(payment.status) })),
    subscription: subscription.rows[0] ? {
      ...subscription.rows[0],
      priceCop: toNumber(subscription.rows[0].priceCop),
      renewalLabel: toDateLabel(subscription.rows[0].currentPeriodEnd || subscription.rows[0].trialEndsAt),
      statusLabel: statusLabel(subscription.rows[0].status)
    } : null,
    users: users.rows.map((user) => ({ ...user, createdLabel: toDateLabel(user.createdAt), lastLoginLabel: toDateLabel(user.lastLoginAt), statusLabel: statusLabel(user.status) }))
  };
}
