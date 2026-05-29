import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { commercialPlans } from "@/lib/plans";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const supportKeywords = [
  "queja",
  "problema",
  "error",
  "soporte",
  "ticket",
  "bloqueada",
  "bloqueado",
  "no puedo entrar",
  "no me deja",
  "factura",
  "pago",
  "contraseña",
  "clave",
  "integracion",
  "integración",
  "siigo",
  "dian",
  "robo",
  "hackeo",
  "datos"
];

function sanitizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is ChatMessage => {
      return item && typeof item === "object" && (item as ChatMessage).role && typeof (item as ChatMessage).content === "string";
    })
    .map((item) => ({
      role: item.role === "assistant" ? "assistant" as const : "user" as const,
      content: item.content.slice(0, 1200)
    }))
    .slice(-8);
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function hasSupportIntent(message: string) {
  const normalized = message.toLowerCase();
  return supportKeywords.some((keyword) => normalized.includes(keyword));
}

function inferPriority(message: string) {
  const normalized = message.toLowerCase();
  if (/(hackeo|robo|base de datos|ca[ií]da|no funciona|seguridad|cr[ií]tico|critico)/i.test(normalized)) return "urgent";
  if (/(bloquead|pago|factura|error|siigo|dian|contrase|clave)/i.test(normalized)) return "high";
  return "normal";
}

function estimatedResponse(priority: string) {
  if (priority === "urgent") return "Respuesta estimada: 30 minutos hábiles.";
  if (priority === "high") return "Respuesta estimada: 2 horas hábiles.";
  return "Respuesta estimada: 1 día hábil.";
}

function ticketNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `CP-${date}-${suffix}`;
}

function productContext() {
  const plans = commercialPlans
    .map((plan) => `${plan.name}: ${plan.priceLabel}, 1 mes gratis. Incluye: ${plan.features.join(", ")}.`)
    .join("\n");

  return `
Copiloto Pyme es un sistema operativo para administrar una PYME con inteligencia artificial.
La plataforma une ventas, caja, inventario, clientes, equipo, datos, reportes, alertas, configuración y proyecciones según el plan.
Inicio es el centro de decisiones: toma datos de los módulos y recomienda qué problema atender, qué oportunidad aprovechar y qué acción ejecutar hoy.
Ventas registra ventas, productos, canales, vendedores, descuentos, pagos pendientes y comportamiento comercial.
Caja controla ingresos, egresos, cuentas por cobrar, pagos próximos, bancos y flujo disponible.
Inventario administra productos, stock, bodegas, movimientos, compras y riesgos de quiebre.
Clientes funciona como CRM simple para contactos, seguimiento, recompra, clientes frecuentes e inactivos.
Datos permite importar Excel o Word por módulo para construir la información de la empresa por partes.
Planes comerciales:
${plans}
Cuando una persona reporte una queja, problema de cuenta, pago, factura, error o bloqueo, debes indicar que crearás un ticket de soporte para Tecnotitan S.A.S. y pedir email/empresa si faltan.
`;
}

function fallbackReply(lastMessage: string, supportIntent: boolean, ticket?: { number: string; estimatedResponse: string }) {
  if (ticket) {
    return `Ya creé tu ticket de soporte ${ticket.number}. ${ticket.estimatedResponse} El equipo de Tecnotitan S.A.S. revisará el caso y te contactará con el siguiente paso.`;
  }

  if (supportIntent) {
    return "Puedo ayudarte con soporte. Cuéntame tu email, empresa y qué ocurrió para crear un ticket y darte un número de seguimiento.";
  }

  if (/precio|plan|cu[aá]nto|costo|vale/i.test(lastMessage)) {
    return "Copiloto Pyme tiene 3 planes con 1 mes gratis: Go por COP $20.000/mes, Basic por COP $50.000/mes y Pro por COP $100.000/mes. Basic es el recomendado porque agrega Inventario y Clientes, y Pro suma Proyecciones con IA.";
  }

  return "Copiloto Pyme administra tu PYME con IA: registras ventas, caja, inventario y clientes; luego Inicio cruza esos datos y te dice qué riesgo atender, qué oportunidad aprovechar y qué acción tomar hoy.";
}

async function createSupportTicket(body: Record<string, unknown>, lastMessage: string) {
  const priority = inferPriority(lastMessage);
  const number = ticketNumber();
  const name = text(body.name) || "Visitante del sitio";
  const email = text(body.email).toLowerCase();
  const company = text(body.company) || "Empresa no indicada";
  const phone = text(body.phone);
  const estimate = estimatedResponse(priority);
  const title = `Chatbot ${number}: ${priority === "urgent" ? "caso crítico" : "solicitud de soporte"}`;

  try {
    await query(
      `INSERT INTO public_support_tickets
        (ticket_number, source, contact_name, contact_email, contact_phone, company_name, subject, message, category, priority, status, estimated_response, metadata)
       VALUES
        ($1, 'landing_chatbot', $2, $3, $4, $5, $6, $7, 'chatbot_support', $8, 'open', $9, $10::jsonb)`,
      [
        number,
        name,
        email,
        phone,
        company,
        title,
        lastMessage,
        priority,
        estimate,
        JSON.stringify({ hasEmail: Boolean(email), createdFrom: "marketing_chatbot" })
      ]
    );
  } catch {
    return { number, estimatedResponse: estimate, persisted: false };
  }

  return { number, estimatedResponse: estimate, persisted: true };
}

async function askOpenAI(messages: ChatMessage[], supportIntent: boolean, ticket?: { number: string; estimatedResponse: string }) {
  const apiKey = process.env.OPENAI_CHATBOT_API_KEY || process.env.OPENAI_API_KEY;
  const lastMessage = messages.at(-1)?.content || "";

  if (!apiKey) {
    return fallbackReply(lastMessage, supportIntent, ticket);
  }

  const input = [
    {
      role: "system",
      content: [
        "Eres el asistente comercial y de soporte de Copiloto Pyme.",
        "Responde en español claro, breve y útil para dueños de PYMES en Colombia.",
        "No inventes integraciones activas que no estén en el contexto.",
        "Tu objetivo comercial es explicar valor, módulos, planes y guiar a registro o demo.",
        "Si hay soporte o queja, confirma el ticket si existe y da el estimado de respuesta.",
        productContext(),
        ticket ? `Ticket creado: ${ticket.number}. ${ticket.estimatedResponse}` : ""
      ].join("\n")
    },
    ...messages.map((message) => ({ role: message.role, content: message.content }))
  ];

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input,
      max_output_tokens: 420,
      model: process.env.OPENAI_CHATBOT_MODEL || "gpt-4.1-mini",
      temperature: 0.35
    })
  });

  if (!response.ok) {
    return fallbackReply(lastMessage, supportIntent, ticket);
  }

  const data = await response.json();
  const output = typeof data.output_text === "string" ? data.output_text.trim() : "";
  return output || fallbackReply(lastMessage, supportIntent, ticket);
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const messages = sanitizeMessages(body.messages);
    const lastMessage = messages.at(-1)?.content || "";

    if (!lastMessage) {
      throw new Error("Escribe un mensaje para el asistente.");
    }

    const supportIntent = hasSupportIntent(lastMessage);
    const shouldCreateTicket = supportIntent && (Boolean(text(body.email)) || /urgente|hackeo|robo|bloquead|no puedo entrar/i.test(lastMessage));
    const ticket = shouldCreateTicket ? await createSupportTicket(body, lastMessage) : undefined;
    const reply = await askOpenAI(messages, supportIntent, ticket);

    return ok({
      reply,
      supportIntent,
      ticket
    });
  } catch (error) {
    return fail(error, 400);
  }
}
