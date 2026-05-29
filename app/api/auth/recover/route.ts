import { fail, ok, requiredString } from "@/lib/api";
import { createPlainToken, hashToken, normalizeEmail } from "@/lib/auth";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

function getAppOrigin(request: Request) {
  const forwardedProto = request.headers.get("x-forwarded-proto");
  const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (forwardedProto && forwardedHost) return `${forwardedProto}://${forwardedHost}`;
  return new URL(request.url).origin;
}

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

      const resetUrl = new URL("/restablecer-contrasena", getAppOrigin(request));
      resetUrl.searchParams.set("token", token);

      await sendEmail({
        actionLabel: "Cambiar contraseña",
        actionUrl: resetUrl.toString(),
        body: `Hola,

Recibimos una solicitud para cambiar la contraseña de tu cuenta de Copiloto Pyme.

Por seguridad, este enlace estará activo durante 30 minutos. Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña seguirá igual.`,
        metadata: { source: "password_recovery", userId: user.rows[0].id },
        preheader: "Cambia tu contraseña de Copiloto Pyme de forma segura.",
        sensitive: true,
        subject: "Recupera tu contraseña de Copiloto Pyme",
        templateKey: "password_recovery",
        to: user.rows[0].email
      });
    }

    return ok({
      message: "Si el correo existe, enviaremos instrucciones para recuperar la contraseña.",
      expiresIn: "30 minutos"
    });
  } catch (error) {
    return fail(error, 400);
  }
}
