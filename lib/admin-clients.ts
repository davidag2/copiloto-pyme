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

function toPlanLabel(value: string | null | undefined) {
  if (!value) return "Sin plan";
  return `Plan ${value.toUpperCase()}`;
}

function toStatusLabel(subscriptionStatus: string | null | undefined) {
  if (subscriptionStatus === "trial") return "Prueba gratis";
  if (subscriptionStatus === "active") return "Activo";
  if (subscriptionStatus === "past_due") return "Pago pendiente";
  if (subscriptionStatus === "canceled") return "Cancelado";
  return "Sin suscripción";
}

export async function getAdminClients() {
  const [summary, clients] = await Promise.all([
    query<{
      total: string;
      trial: string;
      active: string;
      pastDue: string;
      users: string;
    }>(
      `SELECT COUNT(DISTINCT companies.id)::text AS total,
              COUNT(DISTINCT companies.id) FILTER (WHERE subscriptions.status = 'trial')::text AS trial,
              COUNT(DISTINCT companies.id) FILTER (WHERE subscriptions.status = 'active')::text AS active,
              COUNT(DISTINCT companies.id) FILTER (WHERE subscriptions.status = 'past_due')::text AS "pastDue",
              COUNT(DISTINCT users.id)::text AS users
       FROM companies
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
         AND subscriptions.status IN ('trial', 'active', 'past_due')
       LEFT JOIN users ON users.company_id = companies.id`
    ),
    query<{
      id: string;
      name: string;
      country: string;
      businessType: string;
      plan: string;
      createdAt: string;
      subscriptionStatus: string | null;
      trialEndsAt: string | null;
      currentPeriodEnd: string | null;
      ownerName: string | null;
      ownerEmail: string | null;
      usersCount: string;
      lastLoginAt: string | null;
      paidAmount: string;
      pendingAmount: string;
      invoiceErrors: string;
    }>(
      `WITH user_stats AS (
         SELECT company_id,
                COUNT(*)::text AS users_count,
                MAX(last_login_at)::text AS last_login_at
         FROM users
         GROUP BY company_id
       ),
       payment_stats AS (
         SELECT company_id,
                COALESCE(SUM(amount_cop) FILTER (WHERE status = 'paid'), 0)::text AS paid_amount,
                COALESCE(SUM(amount_cop) FILTER (WHERE status IN ('pending', 'configuration_required', 'redirect_created')), 0)::text AS pending_amount
         FROM payment_transactions
         GROUP BY company_id
       ),
       invoice_stats AS (
         SELECT company_id,
                COUNT(*) FILTER (WHERE status = 'failed')::text AS invoice_errors
         FROM siigo_invoices
         GROUP BY company_id
       )
       SELECT companies.id,
              companies.name,
              companies.country,
              companies.business_type AS "businessType",
              companies.plan,
              companies.created_at AS "createdAt",
              subscriptions.status AS "subscriptionStatus",
              subscriptions.trial_ends_at AS "trialEndsAt",
              subscriptions.current_period_end AS "currentPeriodEnd",
              owner.name AS "ownerName",
              owner.email AS "ownerEmail",
              COALESCE(user_stats.users_count, '0') AS "usersCount",
              user_stats.last_login_at AS "lastLoginAt",
              COALESCE(payment_stats.paid_amount, '0') AS "paidAmount",
              COALESCE(payment_stats.pending_amount, '0') AS "pendingAmount",
              COALESCE(invoice_stats.invoice_errors, '0') AS "invoiceErrors"
       FROM companies
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
         AND subscriptions.status IN ('trial', 'active', 'past_due')
       LEFT JOIN users owner ON owner.company_id = companies.id
         AND owner.role = 'propietario'
       LEFT JOIN user_stats ON user_stats.company_id = companies.id
       LEFT JOIN payment_stats ON payment_stats.company_id = companies.id
       LEFT JOIN invoice_stats ON invoice_stats.company_id = companies.id
       ORDER BY companies.created_at DESC
       LIMIT 50`
    )
  ]);

  return {
    clients: clients.rows.map((client) => ({
      ...client,
      createdLabel: toDateLabel(client.createdAt),
      invoiceErrors: toNumber(client.invoiceErrors),
      lastLoginLabel: toDateLabel(client.lastLoginAt),
      paidAmount: toNumber(client.paidAmount),
      pendingAmount: toNumber(client.pendingAmount),
      planLabel: toPlanLabel(client.plan),
      renewalLabel: toDateLabel(client.currentPeriodEnd || client.trialEndsAt),
      statusLabel: toStatusLabel(client.subscriptionStatus),
      usersCount: toNumber(client.usersCount)
    })),
    summary: {
      active: toNumber(summary.rows[0]?.active),
      pastDue: toNumber(summary.rows[0]?.pastDue),
      total: toNumber(summary.rows[0]?.total),
      trial: toNumber(summary.rows[0]?.trial),
      users: toNumber(summary.rows[0]?.users)
    }
  };
}
