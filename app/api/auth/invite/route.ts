import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth";
import { query, transaction } from "@/lib/db";
import { getPlanSeatAccess } from "@/lib/plans";
import { canManageTeam, companyRoles, normalizeRole } from "@/lib/roles";
import { requireCompanySession } from "@/lib/session";

const allowedRoles = new Set(companyRoles.map((role) => role.value));

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const email = normalizeEmail(requiredString(body.email, "email"));
    const normalizedRole = normalizeRole(body.role);
    const role = allowedRoles.has(normalizedRole) ? normalizedRole : "ventas";
    const invitedBy = typeof body.invitedBy === "string" && body.invitedBy ? body.invitedBy : null;
    const token = createPlainToken();

    if (invitedBy) {
      const actor = await query<{ role: string }>(
        "SELECT role FROM users WHERE id = $1 AND company_id = $2 AND status = 'active' LIMIT 1",
        [invitedBy, companyId]
      );
      if (!actor.rows[0] || !canManageTeam(actor.rows[0].role)) {
        return fail(new Error("Tu rol no permite invitar usuarios a esta empresa."), 403);
      }
    }

    const invitation = await transaction(async (client) => {
      const seatStatus = await client.query<{ plan: string; usedSeats: string }>(
        `SELECT companies.plan,
                COUNT(users.id) FILTER (
                  WHERE users.status IN ('active', 'invited')
                  AND LOWER(users.email) <> LOWER($2)
                )::text AS "usedSeats"
         FROM companies
         LEFT JOIN users ON users.company_id = companies.id
         WHERE companies.id = $1
         GROUP BY companies.id, companies.plan
         LIMIT 1`,
        [companyId, email]
      );
      const companyPlan = seatStatus.rows[0]?.plan || "go";
      const seatAccess = getPlanSeatAccess(companyPlan);
      const usedSeats = Number(seatStatus.rows[0]?.usedSeats || 0);

      if (usedSeats >= seatAccess.totalSeats) {
        const inviteText = seatAccess.invitedSeats
          ? `cuenta maestra + ${seatAccess.invitedSeats} invitado(s)`
          : "solo la cuenta maestra";
        throw new Error(`Tu plan ${companyPlan.toUpperCase()} incluye ${seatAccess.totalSeats} asiento(s): ${inviteText}. Actualiza tu plan para invitar más usuarios.`);
      }

      const result = await client.query(
        `INSERT INTO team_invitations (company_id, invited_by, email, role, token_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
         ON CONFLICT (company_id, email)
         DO UPDATE SET role = EXCLUDED.role,
                       token_hash = EXCLUDED.token_hash,
                       status = 'pending',
                       expires_at = EXCLUDED.expires_at,
                       accepted_at = NULL,
                       created_at = NOW()
         RETURNING id, company_id AS "companyId", email, role, status, expires_at AS "expiresAt", created_at AS "createdAt"`,
        [companyId, invitedBy, email, role, hashToken(token)]
      );

      await client.query(
        `INSERT INTO users (company_id, name, email, role, status)
         VALUES ($1, $2, $3, $4, 'invited')
         ON CONFLICT (email)
         DO UPDATE SET company_id = EXCLUDED.company_id,
                       role = EXCLUDED.role,
                       status = CASE WHEN users.status = 'active' THEN users.status ELSE 'invited' END
         RETURNING id`,
        [companyId, email.split("@")[0], email, role]
      );

      return result.rows[0];
    });

    return ok({
      invitation,
      inviteToken: token,
      inviteUrl: `/aceptar-invitacion?token=${token}`
    }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = requiredString(searchParams.get("companyId"), "companyId");
    const session = await requireCompanySession(request, companyId);
    if (!session.ok) return session.response;
    const invitations = await query(
      `SELECT id, email, role, status, expires_at AS "expiresAt", created_at AS "createdAt"
       FROM team_invitations
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 25`,
      [companyId]
    );
    return ok({ invitations: invitations.rows });
  } catch (error) {
    return fail(error, 400);
  }
}
