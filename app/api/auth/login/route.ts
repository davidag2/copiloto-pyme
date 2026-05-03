import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail, verifyPassword } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
    return ok({
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
        tokenHash: hashToken(token),
        expiresIn: "demo-session"
      }
    });
  } catch (error) {
    return fail(error, 400);
  }
}
