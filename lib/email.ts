import { query } from "@/lib/db";

type EmailStatus = "sent" | "configuration_required" | "failed";

type SendEmailInput = {
  body: string;
  companyId?: string | null;
  from?: string;
  metadata?: Record<string, unknown>;
  preheader?: string;
  sentByAdminUserId?: string | null;
  subject: string;
  templateKey?: string;
  to: string;
};

type SendEmailResult = {
  messageId: string | null;
  status: EmailStatus;
};

const brandFrom = process.env.EMAIL_FROM || "Copiloto Pyme <onboarding@resend.dev>";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function paragraphs(value: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replaceAll("\n", "<br />")}</p>`)
    .join("");
}

export function renderBrandedEmail({ body, preheader, title }: { body: string; preheader?: string; title: string }) {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;background:#f3f6fb;color:#0A2540;font-family:Inter,Arial,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader || title)}</div>
    <main style="padding:32px 16px;">
      <section style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #dbe4f0;border-radius:28px;box-shadow:0 24px 80px rgba(10,37,64,0.10);overflow:hidden;">
        <header style="padding:28px 30px;background:linear-gradient(135deg,#0A2540,#2563EB);color:#ffffff;">
          <div style="display:inline-flex;align-items:center;gap:10px;font-weight:900;">
            <span style="display:inline-grid;place-items:center;width:42px;height:42px;border-radius:14px;background:linear-gradient(135deg,#2563EB,#22C55E);">CP</span>
            <span>Copiloto Pyme</span>
          </div>
          <h1 style="font-size:30px;line-height:1.15;margin:24px 0 0;">${escapeHtml(title)}</h1>
        </header>
        <div style="padding:30px;color:#1F2937;font-size:16px;line-height:1.65;">
          ${paragraphs(body)}
          <div style="margin-top:28px;padding:18px;border-radius:18px;background:#f3f6fb;border:1px solid #dbe4f0;">
            <strong style="color:#0A2540;">Tecnotitan S.A.S</strong>
            <p style="margin:6px 0 0;color:#667085;">Este correo fue enviado desde Copiloto Pyme para acompañar la administración y toma de decisiones de tu empresa.</p>
          </div>
        </div>
      </section>
    </main>
  </body>
</html>`;
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const html = renderBrandedEmail({
    body: input.body,
    preheader: input.preheader,
    title: input.subject
  });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    await logEmail(input, "configuration_required", null, "Falta configurar RESEND_API_KEY en Vercel.", { skipped: true });
    return { messageId: null, status: "configuration_required" };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: input.from || brandFrom,
        html,
        subject: input.subject,
        to: [input.to]
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage = typeof payload?.message === "string" ? payload.message : "Resend no pudo enviar el correo.";
      await logEmail(input, "failed", null, errorMessage, payload);
      return { messageId: null, status: "failed" };
    }

    const messageId = typeof payload?.id === "string" ? payload.id : null;
    await logEmail(input, "sent", messageId, null, payload);
    return { messageId, status: "sent" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error inesperado enviando correo.";
    await logEmail(input, "failed", null, errorMessage, { error: errorMessage });
    return { messageId: null, status: "failed" };
  }
}

async function logEmail(input: SendEmailInput, status: EmailStatus, messageId: string | null, errorMessage: string | null, providerPayload: unknown) {
  try {
    await query(
      `INSERT INTO admin_email_logs (
         company_id,
         recipient_email,
         subject,
         preheader,
         body_text,
         template_key,
         status,
         provider,
         provider_message_id,
         error_message,
         payload,
         sent_by_admin_user_id,
         sent_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'resend', $8, $9, $10::jsonb, $11, CASE WHEN $7 = 'sent' THEN NOW() ELSE NULL END)`,
      [
        input.companyId || null,
        input.to,
        input.subject,
        input.preheader || "",
        input.body,
        input.templateKey || null,
        status,
        messageId,
        errorMessage,
        JSON.stringify({ providerPayload, metadata: input.metadata || {} }),
        input.sentByAdminUserId || null
      ]
    );
  } catch {
    // Email logging must never block registration or admin workflows.
  }
}

export function welcomeEmailBody({ companyName, ownerName, planName, trialEndsAt }: { companyName: string; ownerName: string; planName: string; trialEndsAt: string }) {
  const trialLabel = new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(trialEndsAt));

  return `Hola ${ownerName},

Bienvenido a Copiloto Pyme. La empresa ${companyName} ya tiene activa su cuenta y su mes gratis en el plan ${planName.toUpperCase()}.

Tu usuario quedó como administrador maestro de la empresa. Desde el dashboard podrás configurar datos, invitar integrantes, asignar roles y empezar a cargar ventas, caja e inventario.

Primeros pasos recomendados:
- Completa el onboarding inicial.
- Registra o importa tus primeras ventas.
- Revisa el resumen de hoy para ver tus primeras señales de negocio.

Tu mes gratis estará activo hasta el ${trialLabel}.`;
}
