import { fail, ok, requiredString } from "@/lib/api";
import { validateAdminSession } from "@/lib/admin-access";
import { query } from "@/lib/db";
import { sendEmail } from "@/lib/email";

type RecipientRow = {
  companyName: string;
  ownerEmail: string;
  ownerName: string;
};

export async function POST(request: Request) {
  try {
    const adminSession = await validateAdminSession(request);
    if (!adminSession) return fail(new Error("Acceso admin requerido."), 403);

    const body = await request.json();
    const subject = requiredString(body.subject, "subject");
    const emailBody = requiredString(body.body, "body");
    const companyId = typeof body.companyId === "string" && body.companyId ? body.companyId : null;
    const customEmail = typeof body.customEmail === "string" && body.customEmail.trim() ? body.customEmail.trim().toLowerCase() : null;

    const recipient = companyId ? await getCompanyRecipient(companyId) : null;
    const to = customEmail || recipient?.ownerEmail;
    if (!to) throw new Error("Selecciona un cliente o escribe un email alternativo.");

    const result = await sendEmail({
      body: applyVariables(emailBody, recipient),
      companyId,
      metadata: {
        requestedBy: adminSession.userEmail,
        source: "admin_email_center"
      },
      preheader: applyVariables(String(body.preheader || ""), recipient),
      sentByAdminUserId: adminSession.userId,
      subject: applyVariables(subject, recipient),
      templateKey: typeof body.templateKey === "string" ? body.templateKey : "custom",
      to
    });

    const message =
      result.status === "sent"
        ? "Correo enviado correctamente."
        : result.status === "configuration_required"
          ? "Correo diseñado y registrado. Falta configurar RESEND_API_KEY para enviarlo realmente."
          : "No se pudo enviar el correo. Revisa el historial para ver el error.";

    return ok({ message, status: result.status, messageId: result.messageId });
  } catch (error) {
    return fail(error, 400);
  }
}

async function getCompanyRecipient(companyId: string) {
  const recipient = await query<RecipientRow>(
    `SELECT companies.name AS "companyName",
            users.name AS "ownerName",
            users.email AS "ownerEmail"
     FROM companies
     JOIN users ON users.company_id = companies.id
       AND users.role = 'propietario'
       AND users.status <> 'disabled'
     WHERE companies.id = $1
     ORDER BY users.created_at ASC
     LIMIT 1`,
    [companyId]
  );

  return recipient.rows[0] || null;
}

function applyVariables(value: string, recipient: RecipientRow | null) {
  return value
    .replaceAll("{{nombre}}", recipient?.ownerName || "cliente")
    .replaceAll("{{empresa}}", recipient?.companyName || "tu empresa");
}
