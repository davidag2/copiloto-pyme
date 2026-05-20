import { query } from "@/lib/db";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatAdminMoney(value: unknown) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(toNumber(value));
}

export async function getAdminSummary() {
  const [companies, users, subscriptions, payments, invoices, alerts, recentCompanies] = await Promise.all([
    query<{
      total: string;
      createdThisMonth: string;
      go: string;
      basic: string;
      pro: string;
    }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))::text AS "createdThisMonth",
              COUNT(*) FILTER (WHERE plan = 'go')::text AS go,
              COUNT(*) FILTER (WHERE plan = 'basic')::text AS basic,
              COUNT(*) FILTER (WHERE plan = 'pro')::text AS pro
       FROM companies`
    ),
    query<{ total: string; active: string; loggedLast7Days: string }>(
      `SELECT COUNT(*)::text AS total,
              COUNT(*) FILTER (WHERE status = 'active')::text AS active,
              COUNT(*) FILTER (WHERE last_login_at >= NOW() - INTERVAL '7 days')::text AS "loggedLast7Days"
       FROM users`
    ),
    query<{ trial: string; active: string; pastDue: string; canceled: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'trial')::text AS trial,
              COUNT(*) FILTER (WHERE status = 'active')::text AS active,
              COUNT(*) FILTER (WHERE status = 'past_due')::text AS "pastDue",
              COUNT(*) FILTER (WHERE status = 'canceled')::text AS canceled
       FROM subscriptions`
    ),
    query<{ pending: string; paid: string; failed: string; paidAmount: string; pendingAmount: string }>(
      `SELECT COUNT(*) FILTER (WHERE status IN ('pending', 'configuration_required', 'redirect_created'))::text AS pending,
              COUNT(*) FILTER (WHERE status = 'paid')::text AS paid,
              COUNT(*) FILTER (WHERE status IN ('failed', 'expired', 'canceled'))::text AS failed,
              COALESCE(SUM(amount_cop) FILTER (WHERE status = 'paid'), 0)::text AS "paidAmount",
              COALESCE(SUM(amount_cop) FILTER (WHERE status IN ('pending', 'configuration_required', 'redirect_created')), 0)::text AS "pendingAmount"
       FROM payment_transactions`
    ),
    query<{ sent: string; ready: string; failed: string; accepted: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'sent')::text AS sent,
              COUNT(*) FILTER (WHERE status = 'ready')::text AS ready,
              COUNT(*) FILTER (WHERE status = 'failed')::text AS failed,
              COUNT(*) FILTER (WHERE status = 'accepted')::text AS accepted
       FROM siigo_invoices`
    ),
    query<{ open: string; danger: string; warning: string; resolved: string }>(
      `SELECT COUNT(*) FILTER (WHERE status = 'open')::text AS open,
              COUNT(*) FILTER (WHERE status = 'open' AND level = 'danger')::text AS danger,
              COUNT(*) FILTER (WHERE status = 'open' AND level = 'warning')::text AS warning,
              COUNT(*) FILTER (WHERE status = 'resolved')::text AS resolved
       FROM alerts`
    ),
    query<{
      id: string;
      name: string;
      plan: string;
      createdAt: string;
      subscriptionStatus: string | null;
      usersCount: string;
    }>(
      `SELECT companies.id,
              companies.name,
              companies.plan,
              companies.created_at AS "createdAt",
              subscriptions.status AS "subscriptionStatus",
              COUNT(users.id)::text AS "usersCount"
       FROM companies
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
         AND subscriptions.status IN ('trial', 'active', 'past_due')
       LEFT JOIN users ON users.company_id = companies.id
       GROUP BY companies.id, subscriptions.status
       ORDER BY companies.created_at DESC
       LIMIT 5`
    )
  ]);

  return {
    alerts: {
      danger: toNumber(alerts.rows[0]?.danger),
      open: toNumber(alerts.rows[0]?.open),
      resolved: toNumber(alerts.rows[0]?.resolved),
      warning: toNumber(alerts.rows[0]?.warning)
    },
    companies: {
      basic: toNumber(companies.rows[0]?.basic),
      createdThisMonth: toNumber(companies.rows[0]?.createdThisMonth),
      go: toNumber(companies.rows[0]?.go),
      pro: toNumber(companies.rows[0]?.pro),
      total: toNumber(companies.rows[0]?.total)
    },
    invoices: {
      accepted: toNumber(invoices.rows[0]?.accepted),
      failed: toNumber(invoices.rows[0]?.failed),
      ready: toNumber(invoices.rows[0]?.ready),
      sent: toNumber(invoices.rows[0]?.sent)
    },
    payments: {
      failed: toNumber(payments.rows[0]?.failed),
      paid: toNumber(payments.rows[0]?.paid),
      paidAmount: toNumber(payments.rows[0]?.paidAmount),
      pending: toNumber(payments.rows[0]?.pending),
      pendingAmount: toNumber(payments.rows[0]?.pendingAmount)
    },
    recentCompanies: recentCompanies.rows,
    subscriptions: {
      active: toNumber(subscriptions.rows[0]?.active),
      canceled: toNumber(subscriptions.rows[0]?.canceled),
      pastDue: toNumber(subscriptions.rows[0]?.pastDue),
      trial: toNumber(subscriptions.rows[0]?.trial)
    },
    users: {
      active: toNumber(users.rows[0]?.active),
      loggedLast7Days: toNumber(users.rows[0]?.loggedLast7Days),
      total: toNumber(users.rows[0]?.total)
    }
  };
}
