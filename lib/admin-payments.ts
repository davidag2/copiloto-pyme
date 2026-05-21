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
  return "Sin estado";
}

export async function getAdminPayments() {
  const [summary, subscriptions, transactions, providers] = await Promise.all([
    query<{
      mrr: string;
      trial: string;
      active: string;
      pastDue: string;
      pendingCount: string;
      pendingAmount: string;
      paidCount: string;
      paidAmount: string;
      failedCount: string;
    }>(
      `WITH active_subscriptions AS (
         SELECT subscriptions.company_id,
                subscriptions.status,
                plans.price_cop
         FROM subscriptions
         JOIN plans ON plans.id = subscriptions.plan_id
         WHERE subscriptions.status IN ('trial', 'active', 'past_due')
       )
       SELECT COALESCE(SUM(price_cop) FILTER (WHERE status = 'active'), 0)::text AS mrr,
              COUNT(*) FILTER (WHERE status = 'trial')::text AS trial,
              COUNT(*) FILTER (WHERE status = 'active')::text AS active,
              COUNT(*) FILTER (WHERE status = 'past_due')::text AS "pastDue",
              (SELECT COUNT(*) FROM payment_transactions WHERE status IN ('pending', 'configuration_required', 'redirect_created'))::text AS "pendingCount",
              (SELECT COALESCE(SUM(amount_cop), 0) FROM payment_transactions WHERE status IN ('pending', 'configuration_required', 'redirect_created'))::text AS "pendingAmount",
              (SELECT COUNT(*) FROM payment_transactions WHERE status = 'paid')::text AS "paidCount",
              (SELECT COALESCE(SUM(amount_cop), 0) FROM payment_transactions WHERE status = 'paid')::text AS "paidAmount",
              (SELECT COUNT(*) FROM payment_transactions WHERE status IN ('failed', 'expired', 'canceled'))::text AS "failedCount"
       FROM active_subscriptions`
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      planName: string;
      priceCop: string;
      status: string;
      trialEndsAt: string;
      currentPeriodEnd: string | null;
      createdAt: string;
    }>(
      `SELECT subscriptions.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              plans.name AS "planName",
              plans.price_cop::text AS "priceCop",
              subscriptions.status,
              subscriptions.trial_ends_at AS "trialEndsAt",
              subscriptions.current_period_end AS "currentPeriodEnd",
              subscriptions.created_at AS "createdAt"
       FROM subscriptions
       JOIN companies ON companies.id = subscriptions.company_id
       JOIN plans ON plans.id = subscriptions.plan_id
       ORDER BY subscriptions.created_at DESC
       LIMIT 10`
    ),
    query<{
      id: string;
      companyName: string;
      providerName: string;
      planName: string;
      amountCop: string;
      status: string;
      externalReference: string;
      createdAt: string;
      paidAt: string | null;
    }>(
      `SELECT payment_transactions.id,
              companies.name AS "companyName",
              payment_providers.name AS "providerName",
              plans.name AS "planName",
              payment_transactions.amount_cop::text AS "amountCop",
              payment_transactions.status,
              payment_transactions.external_reference AS "externalReference",
              payment_transactions.created_at AS "createdAt",
              payment_transactions.paid_at AS "paidAt"
       FROM payment_transactions
       JOIN companies ON companies.id = payment_transactions.company_id
       JOIN plans ON plans.id = payment_transactions.plan_id
       JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       ORDER BY payment_transactions.created_at DESC
       LIMIT 12`
    ),
    query<{
      id: string;
      name: string;
      status: string;
      supportsRecurring: boolean;
      supportsCash: boolean;
      supportsPse: boolean;
      supportsCards: boolean;
    }>(
      `SELECT id,
              name,
              status,
              supports_recurring AS "supportsRecurring",
              supports_cash AS "supportsCash",
              supports_pse AS "supportsPse",
              supports_cards AS "supportsCards"
       FROM payment_providers
       ORDER BY name ASC`
    )
  ]);

  const summaryRow = summary.rows[0];

  return {
    providers: providers.rows,
    subscriptions: subscriptions.rows.map((subscription) => ({
      ...subscription,
      createdLabel: toDateLabel(subscription.createdAt),
      priceCop: toNumber(subscription.priceCop),
      renewalLabel: toDateLabel(subscription.currentPeriodEnd || subscription.trialEndsAt),
      statusLabel: statusLabel(subscription.status)
    })),
    summary: {
      active: toNumber(summaryRow?.active),
      failedCount: toNumber(summaryRow?.failedCount),
      mrr: toNumber(summaryRow?.mrr),
      paidAmount: toNumber(summaryRow?.paidAmount),
      paidCount: toNumber(summaryRow?.paidCount),
      pastDue: toNumber(summaryRow?.pastDue),
      pendingAmount: toNumber(summaryRow?.pendingAmount),
      pendingCount: toNumber(summaryRow?.pendingCount),
      trial: toNumber(summaryRow?.trial)
    },
    transactions: transactions.rows.map((transaction) => ({
      ...transaction,
      amountCop: toNumber(transaction.amountCop),
      createdLabel: toDateLabel(transaction.createdAt),
      paidLabel: toDateLabel(transaction.paidAt),
      statusLabel: statusLabel(transaction.status)
    }))
  };
}
