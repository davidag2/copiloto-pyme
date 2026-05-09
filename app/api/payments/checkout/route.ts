import { fail, ok } from "@/lib/api";
import { query } from "@/lib/db";
import { getPlanById } from "@/lib/plans";
import { createCheckoutReference, getPaymentProvider, isPaymentProviderConfigured } from "@/lib/payment-providers";
import { validateRequestSession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesión requerida o expirada."), 401);

    const body = await request.json();
    const provider = getPaymentProvider(body.provider);
    const plan = getPlanById(body.planId);
    const configured = isPaymentProviderConfigured(provider);
    const externalReference = createCheckoutReference(session.companyId, plan.id, provider.id);
    const status = configured ? "pending" : "configuration_required";
    const checkoutUrl = null;

    const subscription = await query(
      `SELECT id, plan_id AS "planId", status
       FROM subscriptions
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [session.companyId]
    );

    const payment = await query(
      `INSERT INTO payment_transactions (
         company_id,
         subscription_id,
         plan_id,
         provider_id,
         amount_cop,
         status,
         external_reference,
         external_checkout_url,
         metadata,
         expires_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW() + INTERVAL '24 hours')
       RETURNING id,
                 company_id AS "companyId",
                 subscription_id AS "subscriptionId",
                 plan_id AS "planId",
                 provider_id AS "providerId",
                 amount_cop AS "amountCop",
                 currency,
                 status,
                 external_reference AS "externalReference",
                 external_checkout_url AS "externalCheckoutUrl",
                 expires_at AS "expiresAt",
                 created_at AS "createdAt"`,
      [
        session.companyId,
        subscription.rows[0]?.id || null,
        plan.id,
        provider.id,
        plan.priceCop,
        status,
        externalReference,
        checkoutUrl,
        JSON.stringify({
          provider: provider.name,
          configured,
          envKeysRequired: provider.envKeys,
          userId: session.userId,
          companyName: session.companyName
        })
      ]
    );

    return ok({
      payment: payment.rows[0],
      provider: {
        id: provider.id,
        name: provider.name,
        configured,
        requiredEnvKeys: provider.envKeys
      },
      checkoutUrl,
      message: configured
        ? "Solicitud de checkout registrada. El siguiente paso es activar el adaptador API de la pasarela."
        : "Pasarela registrada, pero faltan credenciales de producción o sandbox."
    }, 201);
  } catch (error) {
    return fail(error, 400);
  }
}
