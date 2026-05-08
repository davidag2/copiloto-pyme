import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { createPlainToken, hashPassword, hashToken, normalizeEmail, requirePassword } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { getPlanById, getTrialEndsAt } from "@/lib/plans";
import { normalizeRole } from "@/lib/roles";
import { setSessionCookie } from "@/lib/session";

const defaultRules = [
  ["sales", 70, "below"],
  ["cash", 14, "below"],
  ["margin", 30, "below"],
  ["stock", 3, "above"]
];

const defaultIntegrations = [
  ["Google Sheets", "Hojas de calculo", "Disponible", "Manual"],
  ["Siigo", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Alegra", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Mercado Pago", "Pagos", "Disponible", "Cada hora"],
  ["Shopify", "Ecommerce", "Disponible", "Cada 3 horas"],
  ["WooCommerce", "Ecommerce", "Disponible", "Cada 3 horas"]
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headers = request.headers;
    const companyName = requiredString(body.companyName, "companyName");
    const ownerName = requiredString(body.ownerName, "ownerName");
    const ownerEmail = normalizeEmail(requiredString(body.ownerEmail, "ownerEmail"));
    const password = requirePassword(body.password);
    const selectedPlan = getPlanById(body.plan);
    const trialStartsAt = new Date();
    const trialEndsAt = getTrialEndsAt(trialStartsAt);

    const result = await transaction(async (client) => {
      const company = await client.query(
        `INSERT INTO companies (name, country, business_type, currency, plan, monthly_goal, minimum_stock, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, country, business_type AS "businessType", currency, plan, monthly_goal AS "monthlyGoal", minimum_stock AS "minimumStock", data_source AS "dataSource"`,
        [
          companyName,
          body.country || "Colombia",
          body.businessType || "PYME",
          body.currency || "COP",
          selectedPlan.id,
          optionalNumber(body.monthlyGoal) ?? 0,
          optionalNumber(body.minimumStock) ?? 0,
          body.dataSource || "Excel/CSV"
        ]
      );
      const companyId = company.rows[0].id;

      const user = await client.query(
        `INSERT INTO users (company_id, name, email, password_hash, role, status, last_login_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         RETURNING id, company_id AS "companyId", name, email, role, status, created_at AS "createdAt"`,
        [companyId, ownerName, ownerEmail, hashPassword(password), normalizeRole("propietario")]
      );

      for (const rule of defaultRules) {
        await client.query(
          `INSERT INTO alert_rules (company_id, metric, threshold, comparator)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, metric) DO NOTHING`,
          [companyId, ...rule]
        );
      }

      for (const integration of defaultIntegrations) {
        await client.query(
          `INSERT INTO integrations (company_id, provider, category, status, sync_label)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, provider) DO NOTHING`,
          [companyId, ...integration]
        );
      }

      const sessionToken = createPlainToken();
      const sessionTokenHash = hashToken(sessionToken);
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

      const subscription = await client.query(
        `INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, trial_starts_at, trial_ends_at)
         VALUES ($1, $2, 'trial', $3, $4, $3, $4)
         RETURNING id, company_id AS "companyId", plan_id AS "planId", status, trial_starts_at AS "trialStartsAt", trial_ends_at AS "trialEndsAt", created_at AS "createdAt"`,
        [companyId, selectedPlan.id, trialStartsAt, trialEndsAt]
      );

      const onboarding = await client.query(
        `INSERT INTO onboarding_progress (company_id, status, current_step)
         VALUES ($1, 'pending', 'connect_data')
         RETURNING id, company_id AS "companyId", status, current_step AS "currentStep", completed_steps AS "completedSteps", created_at AS "createdAt"`,
        [companyId]
      );

      const session = await client.query(
        `INSERT INTO sessions (user_id, company_id, token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id AS "userId", company_id AS "companyId", expires_at AS "expiresAt", created_at AS "createdAt"`,
        [
          user.rows[0].id,
          companyId,
          sessionTokenHash,
          headers.get("user-agent") || null,
          headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
          sessionExpiresAt
        ]
      );

      return {
        company: company.rows[0],
        user: user.rows[0],
        session: {
          token: sessionToken,
          tokenHash: sessionTokenHash,
          expiresAt: session.rows[0].expiresAt
        },
        subscription: subscription.rows[0],
        onboarding: onboarding.rows[0],
        registration: {
          plan: selectedPlan,
          trial: {
            status: "trial",
            startsAt: trialStartsAt.toISOString(),
            endsAt: trialEndsAt.toISOString()
          },
          nextStep: "/onboarding"
        }
      };
    });

    const response = ok(result, 201);
    setSessionCookie(response, result.session.token, result.session.expiresAt);
    return response;
  } catch (error) {
    return fail(error, 400);
  }
}
