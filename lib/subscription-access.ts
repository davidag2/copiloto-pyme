import { query } from "./db";

type SubscriptionRow = {
  id: string;
  companyId: string;
  planId: string;
  status: "trial" | "active" | "past_due" | "canceled";
  trialEndsAt: string;
  currentPeriodEnd: string | null;
};

export type SubscriptionAccess = {
  allowed: boolean;
  reason: "trial_active" | "subscription_active" | "trial_expired" | "subscription_expired" | "past_due" | "canceled" | "missing_subscription" | "access_blocked" | "company_deleted";
  redirectTo?: string;
  subscription?: SubscriptionRow;
};

export async function getSubscriptionAccess(companyId: string): Promise<SubscriptionAccess> {
  const companyAccess = await getCompanyAccessState(companyId);
  if (companyAccess === "deleted") return block("company_deleted");
  if (companyAccess === "blocked") return block("access_blocked");

  const result = await query<SubscriptionRow>(
    `SELECT id,
            company_id AS "companyId",
            plan_id AS "planId",
            status,
            trial_ends_at AS "trialEndsAt",
            current_period_end AS "currentPeriodEnd"
     FROM subscriptions
     WHERE company_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [companyId]
  );

  const subscription = result.rows[0];
  if (!subscription) {
    return block("missing_subscription");
  }

  const now = Date.now();
  const trialEndsAt = new Date(subscription.trialEndsAt).getTime();
  const currentPeriodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null;

  if (subscription.status === "trial") {
    if (trialEndsAt >= now) return { allowed: true, reason: "trial_active", subscription };
    await markPastDue(subscription.id);
    return block("trial_expired", { ...subscription, status: "past_due" });
  }

  if (subscription.status === "active") {
    if (!currentPeriodEnd || currentPeriodEnd >= now) return { allowed: true, reason: "subscription_active", subscription };
    await markPastDue(subscription.id);
    return block("subscription_expired", { ...subscription, status: "past_due" });
  }

  if (subscription.status === "canceled") return block("canceled", subscription);
  return block("past_due", subscription);
}

async function getCompanyAccessState(companyId: string) {
  try {
    const company = await query<{ deletedAt: string | null; accessBlockedAt: string | null }>(
      `SELECT deleted_at AS "deletedAt",
              access_blocked_at AS "accessBlockedAt"
       FROM companies
       WHERE id = $1
       LIMIT 1`,
      [companyId]
    );
    if (company.rows[0]?.deletedAt) return "deleted";
    if (company.rows[0]?.accessBlockedAt) return "blocked";
  } catch {
    return "active";
  }

  return "active";
}

function block(reason: SubscriptionAccess["reason"], subscription?: SubscriptionRow): SubscriptionAccess {
  return {
    allowed: false,
    reason,
    redirectTo: `/billing?reason=${reason}`,
    subscription
  };
}

async function markPastDue(subscriptionId: string) {
  await query(
    `UPDATE subscriptions
     SET status = 'past_due',
         updated_at = NOW()
     WHERE id = $1 AND status IN ('trial', 'active')`,
    [subscriptionId]
  );
}
