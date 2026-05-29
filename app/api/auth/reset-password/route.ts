import { fail, ok, requiredString } from "@/lib/api";
import { hashPassword, hashToken, requirePassword } from "@/lib/auth";
import { transaction } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = requiredString(body.token, "token");
    const password = requirePassword(body.password);
    const confirmPassword = requiredString(body.confirmPassword, "confirmPassword");

    if (password !== confirmPassword) {
      throw new Error("La confirmación de contraseña no coincide.");
    }

    await transaction(async (client) => {
      const reset = await client.query<{ id: string; userId: string }>(
        `SELECT id, user_id AS "userId"
         FROM password_reset_tokens
         WHERE token_hash = $1
           AND used_at IS NULL
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [hashToken(token)]
      );

      if (!reset.rows[0]) {
        throw new Error("El enlace de recuperación no es válido o ya venció.");
      }

      await client.query(
        `UPDATE users
         SET password_hash = $2,
             status = CASE WHEN status = 'invited' THEN 'active' ELSE status END
         WHERE id = $1`,
        [reset.rows[0].userId, hashPassword(password)]
      );

      await client.query(
        "UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1",
        [reset.rows[0].id]
      );

      await client.query(
        "UPDATE sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL",
        [reset.rows[0].userId]
      );
    });

    return ok({ message: "Contraseña actualizada. Ya puedes iniciar sesión." });
  } catch (error) {
    return fail(error, 400);
  }
}
