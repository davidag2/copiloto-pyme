import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const users = await query(
      `SELECT id, company_id AS "companyId", name, email, role, status, last_login_at AS "lastLoginAt", created_at AS "createdAt"
       FROM users
       WHERE company_id = $1
       ORDER BY
         CASE role
           WHEN 'dueno' THEN 1
           WHEN 'owner' THEN 1
           WHEN 'administrador' THEN 2
           WHEN 'admin' THEN 2
           WHEN 'contador' THEN 3
           WHEN 'finance' THEN 3
           WHEN 'operaciones' THEN 4
           WHEN 'operations' THEN 4
           WHEN 'ventas' THEN 5
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
