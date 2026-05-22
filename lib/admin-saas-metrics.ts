import { query } from "@/lib/db";
import { formatAdminMoney } from "@/lib/admin-summary";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percentage(value: number, decimals = 1) {
  return `${value.toFixed(decimals)}%`;
}

function safeRate(numerator: number, denominator: number) {
  if (!denominator) return 0;
  return (numerator / denominator) * 100;
}

function growthRate(current: number, previous: number) {
  if (!previous && current > 0) return 100;
  if (!previous) return 0;
  return ((current - previous) / previous) * 100;
}

function monthLabel(value: string) {
  const [year, month] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    year: "2-digit"
  }).format(new Date(year, month - 1, 1));
}

export async function getAdminSaasMetrics() {
  const [revenue, customers, conversion, monthly, planMix, recentPayments] = await Promise.all([
    query<{
      mrr: string;
      activeSubscriptions: string;
      trialSubscriptions: string;
      pastDueSubscriptions: string;
      canceledThisMonth: string;
      activeStartOfMonth: string;
      activeLastMonth: string;
      mrrLastMonth: string;
    }>(
      `WITH latest_subscription AS (
         SELECT DISTINCT ON (subscriptions.company_id)
                subscriptions.company_id,
                subscriptions.plan_id,
                subscriptions.status,
                subscriptions.created_at,
                subscriptions.updated_at,
                subscriptions.canceled_at
         FROM subscriptions
         ORDER BY subscriptions.company_id, subscriptions.updated_at DESC, subscriptions.created_at DESC
       )
       SELECT COALESCE(SUM(plans.price_cop) FILTER (WHERE latest_subscription.status = 'active'), 0)::text AS mrr,
              COUNT(*) FILTER (WHERE latest_subscription.status = 'active')::text AS "activeSubscriptions",
              COUNT(*) FILTER (WHERE latest_subscription.status = 'trial')::text AS "trialSubscriptions",
              COUNT(*) FILTER (WHERE latest_subscription.status = 'past_due')::text AS "pastDueSubscriptions",
              COUNT(*) FILTER (
                WHERE latest_subscription.status = 'canceled'
                  AND COALESCE(latest_subscription.canceled_at, latest_subscription.updated_at) >= date_trunc('month', NOW())
              )::text AS "canceledThisMonth",
              COUNT(*) FILTER (
                WHERE latest_subscription.status IN ('active', 'past_due')
                  AND latest_subscription.created_at < date_trunc('month', NOW())
              )::text AS "activeStartOfMonth",
              COUNT(*) FILTER (
                WHERE latest_subscription.status = 'active'
                  AND latest_subscription.created_at < date_trunc('month', NOW())
              )::text AS "activeLastMonth",
              COALESCE(SUM(plans.price_cop) FILTER (
                WHERE latest_subscription.status = 'active'
                  AND latest_subscription.created_at < date_trunc('month', NOW())
              ), 0)::text AS "mrrLastMonth"
       FROM latest_subscription
       JOIN plans ON plans.id = latest_subscription.plan_id`
    ),
    query<{
      totalCompanies: string;
      newThisMonth: string;
      newLastMonth: string;
      activeCustomers: string;
      activeUsers: string;
    }>(
      `SELECT COUNT(*) FILTER (WHERE companies.deleted_at IS NULL)::text AS "totalCompanies",
              COUNT(*) FILTER (
                WHERE companies.deleted_at IS NULL
                  AND companies.created_at >= date_trunc('month', NOW())
              )::text AS "newThisMonth",
              COUNT(*) FILTER (
                WHERE companies.deleted_at IS NULL
                  AND companies.created_at >= date_trunc('month', NOW()) - INTERVAL '1 month'
                  AND companies.created_at < date_trunc('month', NOW())
              )::text AS "newLastMonth",
              COUNT(DISTINCT companies.id) FILTER (
                WHERE companies.deleted_at IS NULL
                  AND (
                    users.last_login_at >= NOW() - INTERVAL '30 days'
                    OR payment_transactions.paid_at >= NOW() - INTERVAL '30 days'
                    OR subscriptions.status IN ('active', 'trial')
                  )
              )::text AS "activeCustomers",
              COUNT(DISTINCT users.id) FILTER (
                WHERE users.status = 'active'
                  AND users.last_login_at >= NOW() - INTERVAL '30 days'
              )::text AS "activeUsers"
       FROM companies
       LEFT JOIN users ON users.company_id = companies.id
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
       LEFT JOIN payment_transactions ON payment_transactions.company_id = companies.id`
    ),
    query<{
      trialStarted: string;
      convertedToPaid: string;
      currentlyTrial: string;
      expiredOrPastDue: string;
    }>(
      `SELECT COUNT(DISTINCT subscriptions.company_id) FILTER (
                WHERE subscriptions.trial_starts_at IS NOT NULL
              )::text AS "trialStarted",
              COUNT(DISTINCT subscriptions.company_id) FILTER (
                WHERE subscriptions.status = 'active'
                  OR EXISTS (
                    SELECT 1
                    FROM payment_transactions
                    WHERE payment_transactions.company_id = subscriptions.company_id
                      AND payment_transactions.status = 'paid'
                  )
              )::text AS "convertedToPaid",
              COUNT(DISTINCT subscriptions.company_id) FILTER (
                WHERE subscriptions.status = 'trial'
              )::text AS "currentlyTrial",
              COUNT(DISTINCT subscriptions.company_id) FILTER (
                WHERE subscriptions.status IN ('past_due', 'canceled')
              )::text AS "expiredOrPastDue"
       FROM subscriptions`
    ),
    query<{
      month: string;
      newCustomers: string;
      paidRevenue: string;
      paidCustomers: string;
    }>(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', NOW()) - INTERVAL '5 months',
           date_trunc('month', NOW()),
           INTERVAL '1 month'
         ) AS month_start
       )
       SELECT TO_CHAR(months.month_start, 'YYYY-MM') AS month,
              COUNT(DISTINCT companies.id) FILTER (
                WHERE companies.created_at >= months.month_start
                  AND companies.created_at < months.month_start + INTERVAL '1 month'
                  AND companies.deleted_at IS NULL
              )::text AS "newCustomers",
              COALESCE(SUM(payment_transactions.amount_cop) FILTER (
                WHERE payment_transactions.status = 'paid'
                  AND COALESCE(payment_transactions.paid_at, payment_transactions.created_at) >= months.month_start
                  AND COALESCE(payment_transactions.paid_at, payment_transactions.created_at) < months.month_start + INTERVAL '1 month'
              ), 0)::text AS "paidRevenue",
              COUNT(DISTINCT payment_transactions.company_id) FILTER (
                WHERE payment_transactions.status = 'paid'
                  AND COALESCE(payment_transactions.paid_at, payment_transactions.created_at) >= months.month_start
                  AND COALESCE(payment_transactions.paid_at, payment_transactions.created_at) < months.month_start + INTERVAL '1 month'
              )::text AS "paidCustomers"
       FROM months
       LEFT JOIN companies ON TRUE
       LEFT JOIN payment_transactions ON TRUE
       GROUP BY months.month_start
       ORDER BY months.month_start ASC`
    ),
    query<{
      planId: string;
      planName: string;
      customers: string;
      mrr: string;
    }>(
      `SELECT plans.id AS "planId",
              plans.name AS "planName",
              COUNT(subscriptions.id) FILTER (WHERE subscriptions.status = 'active')::text AS customers,
              COALESCE(SUM(plans.price_cop) FILTER (WHERE subscriptions.status = 'active'), 0)::text AS mrr
       FROM plans
       LEFT JOIN subscriptions ON subscriptions.plan_id = plans.id
       GROUP BY plans.id, plans.name, plans.price_cop
       ORDER BY plans.price_cop ASC`
    ),
    query<{
      id: string;
      companyName: string;
      planName: string;
      amountCop: string;
      providerName: string;
      paidAt: string | null;
      createdAt: string;
    }>(
      `SELECT payment_transactions.id,
              companies.name AS "companyName",
              plans.name AS "planName",
              payment_transactions.amount_cop::text AS "amountCop",
              payment_providers.name AS "providerName",
              payment_transactions.paid_at AS "paidAt",
              payment_transactions.created_at AS "createdAt"
       FROM payment_transactions
       JOIN companies ON companies.id = payment_transactions.company_id
       JOIN plans ON plans.id = payment_transactions.plan_id
       JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       WHERE payment_transactions.status = 'paid'
       ORDER BY COALESCE(payment_transactions.paid_at, payment_transactions.created_at) DESC
       LIMIT 8`
    )
  ]);

  const revenueRow = revenue.rows[0];
  const customerRow = customers.rows[0];
  const conversionRow = conversion.rows[0];
  const mrr = toNumber(revenueRow?.mrr);
  const arr = mrr * 12;
  const activeSubscriptions = toNumber(revenueRow?.activeSubscriptions);
  const canceledThisMonth = toNumber(revenueRow?.canceledThisMonth);
  const activeStartOfMonth = toNumber(revenueRow?.activeStartOfMonth);
  const mrrLastMonth = toNumber(revenueRow?.mrrLastMonth);
  const newThisMonth = toNumber(customerRow?.newThisMonth);
  const newLastMonth = toNumber(customerRow?.newLastMonth);
  const trialStarted = toNumber(conversionRow?.trialStarted);
  const convertedToPaid = toNumber(conversionRow?.convertedToPaid);

  return {
    monthly: monthly.rows.map((row) => ({
      ...row,
      label: monthLabel(row.month),
      newCustomers: toNumber(row.newCustomers),
      paidCustomers: toNumber(row.paidCustomers),
      paidRevenue: toNumber(row.paidRevenue)
    })),
    planMix: planMix.rows.map((row) => ({
      ...row,
      customers: toNumber(row.customers),
      mrr: toNumber(row.mrr),
      mrrLabel: formatAdminMoney(row.mrr)
    })),
    recentPayments: recentPayments.rows.map((row) => ({
      ...row,
      amountCop: toNumber(row.amountCop),
      amountLabel: formatAdminMoney(row.amountCop),
      dateLabel: new Intl.DateTimeFormat("es-CO", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(new Date(row.paidAt || row.createdAt))
    })),
    summary: {
      activeCustomers: toNumber(customerRow?.activeCustomers),
      activeSubscriptions,
      activeUsers: toNumber(customerRow?.activeUsers),
      arr,
      arrLabel: formatAdminMoney(arr),
      churnRate: safeRate(canceledThisMonth, activeStartOfMonth + canceledThisMonth),
      churnRateLabel: percentage(safeRate(canceledThisMonth, activeStartOfMonth + canceledThisMonth)),
      conversionRate: safeRate(convertedToPaid, trialStarted),
      conversionRateLabel: percentage(safeRate(convertedToPaid, trialStarted)),
      convertedToPaid,
      currentlyTrial: toNumber(conversionRow?.currentlyTrial),
      customerGrowth: growthRate(newThisMonth, newLastMonth),
      customerGrowthLabel: percentage(growthRate(newThisMonth, newLastMonth)),
      expiredOrPastDue: toNumber(conversionRow?.expiredOrPastDue),
      mrr,
      mrrGrowth: growthRate(mrr, mrrLastMonth),
      mrrGrowthLabel: percentage(growthRate(mrr, mrrLastMonth)),
      mrrLabel: formatAdminMoney(mrr),
      newLastMonth,
      newThisMonth,
      pastDueSubscriptions: toNumber(revenueRow?.pastDueSubscriptions),
      totalCompanies: toNumber(customerRow?.totalCompanies),
      trialStarted,
      trialSubscriptions: toNumber(revenueRow?.trialSubscriptions)
    }
  };
}
