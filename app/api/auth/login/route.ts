import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail, verifyPassword } from "@/lib/auth";
import { getClientDashboardAccess } from "@/lib/client-dashboard-access";
import { query } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headers = request.headers;
    const email = normalizeEmail(requiredString(body.email, "email"));
    const password = requiredString(body.password, "password");

    const result = await query<{
      id: string;
      companyId: string;
      name: string;
      email: string;
      role: string;
      status: string;
      passwordHash: string | null;
      companyName: string;
      country: string;
      businessType: string;
      currency: string;
      plan: string;
      monthlyGoal: string;
      minimumStock: number;
      dataSource: string;
    }>(
      `SELECT users.id,
              users.company_id AS "companyId",
              users.name,
              users.email,
              users.role,
              users.status,
              users.password_hash AS "passwordHash",
              companies.name AS "companyName",
              companies.country,
              companies.business_type AS "businessType",
              companies.currency,
              companies.plan,
              companies.monthly_goal AS "monthlyGoal",
              companies.minimum_stock AS "minimumStock",
              companies.data_source AS "dataSource"
       FROM users
       JOIN companies ON companies.id = users.company_id
       WHERE users.email = $1
       LIMIT 1`,
      [email]
    );
    const account = result.rows[0];
    if (!account || account.status === "disabled" || !verifyPassword(password, account.passwordHash)) {
      return fail(new Error("Credenciales invalidas."), 401);
    }

    await query("UPDATE users SET last_login_at = NOW(), status = 'active' WHERE id = $1", [account.id]);

    const token = createPlainToken();
    const tokenHash = hashToken(token);
    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

    const session = await query<{
      id: string;
      userId: string;
      companyId: string;
      expiresAt: string;
      createdAt: string;
    }>(
      `INSERT INTO sessions (user_id, company_id, token_hash, user_agent, ip_address, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id AS "userId", company_id AS "companyId", expires_at AS "expiresAt", created_at AS "createdAt"`,
      [
        account.id,
        account.companyId,
        tokenHash,
        headers.get("user-agent") || null,
        headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        sessionExpiresAt
      ]
    );

    const subscription = await query(
      `SELECT id, company_id AS "companyId", plan_id AS "planId", status, trial_starts_at AS "trialStartsAt", trial_ends_at AS "trialEndsAt", created_at AS "createdAt"
       FROM subscriptions
       WHERE company_id = $1 AND status IN ('trial', 'active', 'past_due')
       ORDER BY created_at DESC
       LIMIT 1`,
      [account.companyId]
    );

    const onboarding = await query(
      `SELECT id, company_id AS "companyId", status, current_step AS "currentStep", completed_steps AS "completedSteps", created_at AS "createdAt"
       FROM onboarding_progress
       WHERE company_id = $1
       LIMIT 1`,
      [account.companyId]
    );

    const responseData = {
      user: {
        id: account.id,
        companyId: account.companyId,
        name: account.name,
        email: account.email,
        role: account.role,
        status: "active"
      },
      company: {
        id: account.companyId,
        name: account.companyName,
        country: account.country,
        businessType: account.businessType,
        currency: account.currency,
        plan: account.plan,
        monthlyGoal: Number(account.monthlyGoal),
        minimumStock: account.minimumStock,
        dataSource: account.dataSource
      },
      session: {
        token,
        tokenHash,
        expiresAt: session.rows[0].expiresAt
      },
      subscription: subscription.rows[0] || null,
      onboarding: onboarding.rows[0] || null,
      clientDashboardAccess: getClientDashboardAccess(account.email, account.companyId)
    };
    const response = ok(responseData);
    setSessionCookie(response, token, session.rows[0].expiresAt);
    return response;
  } catch (error) {
    return fail(error, 400);
  }
}
