import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const users = await query(
      `SELECT id, name, email, role, status, last_login_at AS "lastLoginAt", created_at AS "createdAt"
       FROM users
       WHERE company_id = $1
       ORDER BY
         CASE role
           WHEN 'owner' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'finance' THEN 3
           WHEN 'operations' THEN 4
           WHEN 'sales' THEN 5
           ELSE 6
         END,
         created_at DESC`,
      [companyId]
    );
    return ok({ users: users.rows });
  } catch (error) {
    return fail(error, 400);
  }
}
