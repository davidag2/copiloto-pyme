import { ok } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET() {
  const plans = await query(
    `SELECT id,
            name,
            price_cop AS "priceCop",
            trial_days AS "trialDays",
            status,
            features,
            updated_at AS "updatedAt"
     FROM plans
     WHERE status = 'active'
     ORDER BY price_cop ASC`
  );

  return ok({ plans: plans.rows });
}
