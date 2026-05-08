import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { requireCompanySession, validateRequestSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesion requerida o expirada."), 401);

    const onboarding = await query(
      `SELECT onboarding_progress.id,
              onboarding_progress.company_id AS "companyId",
              onboarding_progress.status,
              onboarding_progress.current_step AS "currentStep",
              onboarding_progress.completed_steps AS "completedSteps",
              onboarding_progress.completed_at AS "completedAt",
              companies.name AS "companyName",
              companies.business_type AS "businessType",
              companies.data_source AS "dataSource",
              companies.monthly_goal AS "monthlyGoal",
              companies.minimum_stock AS "minimumStock",
              companies.plan
       FROM onboarding_progress
       JOIN companies ON companies.id = onboarding_progress.company_id
       WHERE onboarding_progress.company_id = $1
       LIMIT 1`,
      [session.companyId]
    );

    return ok({
      user: {
        id: session.userId,
        name: session.userName,
        email: session.userEmail,
        role: session.role
      },
      onboarding: onboarding.rows[0] || null
    });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;

    const businessType = requiredString(body.businessType, "businessType");
    const dataSource = requiredString(body.dataSource, "dataSource");
    const monthlyGoal = Number(body.monthlyGoal || 0);
    const minimumStock = Number(body.minimumStock || 0);

    await query(
      `UPDATE companies
       SET business_type = $2,
           data_source = $3,
           monthly_goal = $4,
           minimum_stock = $5,
           updated_at = NOW()
       WHERE id = $1`,
      [companyId, businessType, dataSource, Number.isFinite(monthlyGoal) ? monthlyGoal : 0, Number.isFinite(minimumStock) ? minimumStock : 0]
    );

    const onboarding = await query(
      `UPDATE onboarding_progress
       SET status = 'completed',
           current_step = 'dashboard',
           completed_steps = '["connect_data", "business_context", "confirm"]'::jsonb,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE company_id = $1
       RETURNING id, company_id AS "companyId", status, current_step AS "currentStep", completed_steps AS "completedSteps", completed_at AS "completedAt"`,
      [companyId]
    );

    return ok({ onboarding: onboarding.rows[0], nextStep: "/dashboard" });
  } catch (error) {
    return fail(error, 400);
  }
}
