import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { buildSiigoInvoicePayload, createSiigoInvoice, getSiigoConfig, hasCompleteBillingProfile, type BillingProfile, type SiigoPayment } from "@/lib/siigo";
import { validateRequestSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesión requerida o expirada."), 401);

    const body = await request.json();
    const paymentId = requiredString(body.paymentId, "paymentId");

    const paymentResult = await query(
      `SELECT id,
              company_id AS "companyId",
              plan_id AS "planId",
              amount_cop AS "amountCop",
              external_reference AS "externalReference",
              provider_id AS "providerId",
              status
       FROM payment_transactions
       WHERE id = $1 AND company_id = $2
       LIMIT 1`,
      [paymentId, session.companyId]
    );
    const payment = paymentResult.rows[0] as SiigoPayment & { status: string } | undefined;
    if (!payment) return fail(new Error("Pago no encontrado."), 404);

    const profileResult = await query(
      `SELECT person_type AS "personType",
              id_type AS "idType",
              identification,
              check_digit AS "checkDigit",
              legal_name AS "legalName",
              address,
              country_code AS "countryCode",
              state_code AS "stateCode",
              city_code AS "cityCode",
              email,
              phone,
              fiscal_responsibility_code AS "fiscalResponsibilityCode"
       FROM billing_profiles
       WHERE company_id = $1
       LIMIT 1`,
      [session.companyId]
    );
    const profile = profileResult.rows[0] as BillingProfile | undefined;

    if (!profile || !hasCompleteBillingProfile(profile)) {
      const invoice = await upsertInvoice(payment.id, session.companyId, "billing_profile_required", {}, {}, "Faltan datos fiscales del cliente.");
      await logSiigoInvoiceAttempt(invoice.id, session.companyId, payment.id, "skipped", "billing_profile_required", {}, {}, "Faltan datos fiscales del cliente.", true);
      return ok({ invoice, ready: false, message: "Faltan datos fiscales para enviar la factura a SIIGO." }, 202);
    }

    const config = getSiigoConfig();
    if (!config) {
      const payloadPreview = buildSiigoInvoicePayload(getPreviewConfig(), profile, payment);
      const invoice = await upsertInvoice(payment.id, session.companyId, "configuration_required", payloadPreview, {}, "Faltan credenciales o IDs de SIIGO.");
      await logSiigoInvoiceAttempt(invoice.id, session.companyId, payment.id, "skipped", "configuration_required", payloadPreview, {}, "Faltan credenciales o IDs de SIIGO.", true);
      return ok({ invoice, ready: false, payloadPreview, message: "Factura preparada, pero faltan credenciales o IDs de SIIGO." }, 202);
    }

    const payload = buildSiigoInvoicePayload(config, profile, payment);

    if (payment.status !== "paid" && body.force !== true) {
      const invoice = await upsertInvoice(payment.id, session.companyId, "waiting_payment", payload, {}, "La factura se enviará cuando la pasarela confirme el pago.");
      await logSiigoInvoiceAttempt(invoice.id, session.companyId, payment.id, "skipped", "waiting_payment", payload, {}, "La factura se enviará cuando la pasarela confirme el pago.", false);
      return ok({ invoice, ready: false, payloadPreview: payload, message: "Factura preparada. Se enviará a SIIGO cuando el pago esté confirmado." }, 202);
    }

    let siigoResponse;
    try {
      siigoResponse = await createSiigoInvoice(config, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : "SIIGO rechazó la creación de la factura.";
      const invoice = await upsertInvoice(payment.id, session.companyId, "failed", payload, {}, message);
      await logSiigoInvoiceAttempt(invoice.id, session.companyId, payment.id, "error", "create_invoice", payload, {}, message, true);
      return fail(error, 400);
    }

    const invoice = await upsertInvoice(
      payment.id,
      session.companyId,
      siigoResponse?.stamp?.status === "Accepted" ? "accepted" : "sent",
      payload,
      siigoResponse,
      null,
      siigoResponse?.id,
      siigoResponse?.name,
      siigoResponse?.number ? String(siigoResponse.number) : null,
      siigoResponse?.cufe || siigoResponse?.stamp?.cufe || null
    );
    await logSiigoInvoiceAttempt(invoice.id, session.companyId, payment.id, "success", "create_invoice", payload, siigoResponse, null, false);

    return ok({ invoice, siigo: siigoResponse, message: "Factura enviada a SIIGO." }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}

async function upsertInvoice(
  paymentId: string,
  companyId: string,
  status: string,
  requestPayload: unknown,
  responsePayload: unknown,
  errorMessage: string | null,
  siigoInvoiceId: string | null = null,
  siigoInvoiceName: string | null = null,
  siigoInvoiceNumber: string | null = null,
  siigoCufe: string | null = null
) {
  const invoice = await query(
    `INSERT INTO siigo_invoices (
       company_id,
       payment_transaction_id,
       status,
       siigo_invoice_id,
       siigo_invoice_name,
       siigo_invoice_number,
       siigo_cufe,
       request_payload,
       response_payload,
       error_message,
       sent_at,
       accepted_at
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, CASE WHEN $3 IN ('sent', 'accepted') THEN NOW() ELSE NULL END, CASE WHEN $3 = 'accepted' THEN NOW() ELSE NULL END)
     ON CONFLICT (payment_transaction_id) DO UPDATE SET
       status = EXCLUDED.status,
       siigo_invoice_id = COALESCE(EXCLUDED.siigo_invoice_id, siigo_invoices.siigo_invoice_id),
       siigo_invoice_name = COALESCE(EXCLUDED.siigo_invoice_name, siigo_invoices.siigo_invoice_name),
       siigo_invoice_number = COALESCE(EXCLUDED.siigo_invoice_number, siigo_invoices.siigo_invoice_number),
       siigo_cufe = COALESCE(EXCLUDED.siigo_cufe, siigo_invoices.siigo_cufe),
       request_payload = EXCLUDED.request_payload,
       response_payload = EXCLUDED.response_payload,
       error_message = EXCLUDED.error_message,
       sent_at = COALESCE(EXCLUDED.sent_at, siigo_invoices.sent_at),
       accepted_at = COALESCE(EXCLUDED.accepted_at, siigo_invoices.accepted_at),
       updated_at = NOW()
     RETURNING id,
               company_id AS "companyId",
               payment_transaction_id AS "paymentTransactionId",
               status,
               siigo_invoice_id AS "siigoInvoiceId",
               siigo_invoice_name AS "siigoInvoiceName",
               siigo_invoice_number AS "siigoInvoiceNumber",
               siigo_cufe AS "siigoCufe",
               error_message AS "errorMessage",
               sent_at AS "sentAt",
               accepted_at AS "acceptedAt",
               created_at AS "createdAt",
               updated_at AS "updatedAt"`,
    [
      companyId,
      paymentId,
      status,
      siigoInvoiceId,
      siigoInvoiceName,
      siigoInvoiceNumber,
      siigoCufe,
      JSON.stringify(requestPayload || {}),
      JSON.stringify(responsePayload || {}),
      errorMessage
    ]
  );

  return invoice.rows[0];
}

async function logSiigoInvoiceAttempt(
  invoiceId: string,
  companyId: string,
  paymentId: string,
  status: "success" | "error" | "skipped",
  action: string,
  requestPayload: unknown,
  responsePayload: unknown,
  errorMessage: string | null,
  canRetry: boolean
) {
  try {
    await query(
      `INSERT INTO siigo_invoice_logs (
         siigo_invoice_id,
         company_id,
         payment_transaction_id,
         status,
         action,
         attempt_number,
         can_retry,
         request_payload,
         response_payload,
         error_message
       )
       VALUES (
         $1,
         $2,
         $3,
         $4,
         $5,
         COALESCE((SELECT MAX(attempt_number) + 1 FROM siigo_invoice_logs WHERE siigo_invoice_id = $1), 1),
         $6,
         $7::jsonb,
         $8::jsonb,
         $9
       )`,
      [
        invoiceId,
        companyId,
        paymentId,
        status,
        action,
        canRetry,
        JSON.stringify(requestPayload || {}),
        JSON.stringify(responsePayload || {}),
        errorMessage
      ]
    );
  } catch {
    // La facturacion no debe fallar solo porque la tabla de auditoria aun no exista.
  }
}

function getPreviewConfig() {
  return {
    username: "preview@tecnotitan.com",
    accessKey: "preview",
    partnerId: "preview",
    documentId: Number(process.env.SIIGO_DOCUMENT_ID || 0),
    sellerId: Number(process.env.SIIGO_SELLER_ID || 0),
    paymentTypeId: Number(process.env.SIIGO_PAYMENT_TYPE_ID || 0),
    productCode: process.env.SIIGO_PRODUCT_CODE || "COPILOTO-PYME",
    baseUrl: process.env.SIIGO_BASE_URL || "https://api.siigo.com",
    sendToDian: process.env.SIIGO_SEND_TO_DIAN === "true",
    sendMail: process.env.SIIGO_SEND_MAIL !== "false"
  };
}
