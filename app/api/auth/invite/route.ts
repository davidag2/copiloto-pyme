import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth";
import { query, transaction } from "@/lib/db";

const allowedRoles = new Set(["owner", "admin", "finance", "operations", "sales", "viewer"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const email = normalizeEmail(requiredString(body.email, "email"));
    const role = allowedRoles.has(body.role) ? body.role : "viewer";
    const invitedBy = typeof body.invitedBy === "string" && body.invitedBy ? body.invitedBy : null;
    const token = createPlainToken();

    const invitation = await transaction(async (client) => {
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
