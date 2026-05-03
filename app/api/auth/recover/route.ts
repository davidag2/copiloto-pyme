import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = normalizeEmail(requiredString(body.email, "email"));

    const user = await query<{ id: string; email: string }>(
      "SELECT id, email FROM users WHERE email = $1 AND status <> 'disabled' LIMIT 1",
      [email]
    );

    const token = createPlainToken();
    if (user.rows[0]) {
      await query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, NOW() + INTERVAL '30 minutes')`,
        [user.rows[0].id, hashToken(token)]
      );
    }

    return ok({
      message: "Si el correo existe, enviaremos instrucciones de recuperacion.",
      resetToken: user.rows[0] ? token : null,
      expiresIn: "30 minutos"
    });
  } catch (error) {
    return fail(error, 400);
  }
}
