import { fail, ok, requiredString } from "@/lib/api";
import { sendEmail } from "@/lib/email";

const contactInbox = "hola@copilotopyme.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = requiredString(body.name, "name");
    const company = requiredString(body.company, "company");
    const email = requiredString(body.email, "email").toLowerCase();
    const message = requiredString(body.message, "message");
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Ingresa un email válido.");
    }

    const result = await sendEmail({
      body: [
        `Nuevo mensaje recibido desde el formulario comercial de Copiloto Pyme.`,
        `Nombre: ${name}`,
        `Empresa: ${company}`,
        `Email: ${email}`,
        `Teléfono: ${phone || "No indicado"}`,
        `Mensaje: ${message}`
      ].join("\n\n"),
      metadata: {
        source: "marketing_contact_form",
        senderEmail: email,
        senderPhone: phone
      },
      preheader: `Nuevo contacto de ${company}`,
      subject: `Nuevo contacto comercial: ${company}`,
      templateKey: "marketing_contact",
      to: contactInbox
    });

    if (result.status === "failed") {
      throw new Error("No pudimos enviar el mensaje. Inténtalo nuevamente.");
    }

    return ok({
      message: result.status === "configuration_required"
        ? "Mensaje registrado. Falta configurar el envío real de correo."
        : "Mensaje enviado correctamente.",
      status: result.status
    });
  } catch (error) {
    return fail(error, 400);
  }
}
