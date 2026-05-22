import { fail, ok, requiredString } from "@/lib/api";
import { validateAdminSession } from "@/lib/admin-access";
import { createPlainToken, hashToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { setSessionCookie } from "@/lib/session";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

const validPlans = new Set(["go", "basic", "pro"]);

type AuditContext = {
  ipAddress: string | null;
  requestMethod: string;
  requestPath: string;
  userAgent: string | null;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const adminSession = await validateAdminSession(request);
    if (!adminSession) return fail(new Error("Acceso admin requerido."), 403);

    const { companyId } = await context.params;
    const body = await request.json();
    const action = requiredString(body.action, "action");

    await ensureCompanyExists(companyId);

    let message = "Acción registrada.";
    let channel: string | null = null;
    let redirectTo: string | null = null;
    let impersonationCookie: { token: string; expiresAt: Date } | null = null;
    const metadata: Record<string, unknown> = {};

    if (action === "change_plan") {
      const planId = requiredString(body.planId, "planId").toLowerCase();
      if (!validPlans.has(planId)) throw new Error("Plan inválido.");
      await changePlan(companyId, planId);
      metadata.planId = planId;
      message = `Plan cambiado a ${planId.toUpperCase()}.`;
    } else if (action === "extend_trial") {
      const days = Number.isFinite(Number(body.days)) ? Math.max(1, Math.min(90, Number(body.days))) : 30;
      const result = await extendTrial(companyId, days);
      metadata.days = days;
      metadata.subscriptionId = result.subscriptionId;
      metadata.trialEndsAt = result.trialEndsAt;
      message = `Prueba gratis extendida ${days} días.`;
    } else if (action === "block_access") {
      const reason = String(body.reason || "Bloqueo operativo desde admin.");
      await query(
        `UPDATE companies
         SET access_blocked_at = NOW(),
             access_blocked_by = $2,
             access_block_reason = $3,
             updated_at = NOW()
         WHERE id = $1`,
        [companyId, adminSession.userId, reason]
      );
      metadata.reason = reason;
      message = "Acceso bloqueado.";
    } else if (action === "unblock_access") {
      await query(
        `UPDATE companies
         SET access_blocked_at = NULL,
             access_blocked_by = NULL,
             access_block_reason = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [companyId]
      );
      message = "Acceso desbloqueado.";
    } else if (action === "delete_client") {
      const reason = String(body.reason || "Eliminado desde panel administrativo.");
      await query(
        `UPDATE companies
         SET deleted_at = NOW(),
             deleted_by = $2,
             deletion_reason = $3,
             access_blocked_at = NOW(),
             access_blocked_by = $2,
             access_block_reason = 'Cliente eliminado desde panel administrativo',
             updated_at = NOW()
         WHERE id = $1`,
        [companyId, adminSession.userId, reason]
      );
      metadata.reason = reason;
      message = "Cliente eliminado y dashboard bloqueado.";
    } else if (action === "restore_client") {
      await query(
        `UPDATE companies
         SET deleted_at = NULL,
             deleted_by = NULL,
             deletion_reason = NULL,
             access_blocked_at = NULL,
             access_blocked_by = NULL,
             access_block_reason = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [companyId]
      );
      message = "Cliente restaurado.";
    } else if (action === "open_support_case") {
      const title = String(body.title || "Caso operativo del cliente");
      const description = String(body.description || "Caso abierto desde ficha administrativa.");
      const priority = ["low", "normal", "high", "urgent"].includes(String(body.priority)) ? String(body.priority) : "normal";
      const supportCase = await query<{ id: string }>(
        `INSERT INTO support_cases (company_id, opened_by, title, description, priority, status)
         VALUES ($1, $2, $3, $4, $5, 'open')
         RETURNING id`,
        [companyId, adminSession.userId, title, description, priority]
      );
      metadata.caseId = supportCase.rows[0]?.id;
      metadata.priority = priority;
      message = "Caso de soporte abierto.";
    } else if (action === "resend_payment_link") {
      channel = "payment_link";
      message = "Reenvío de link de pago registrado para seguimiento.";
    } else if (action === "send_payment_reminder_email") {
      channel = "email";
      message = "Recordatorio de pago por email registrado.";
    } else if (action === "send_payment_reminder_whatsapp") {
      channel = "whatsapp";
      message = "Recordatorio de pago por WhatsApp registrado.";
    } else if (action === "resend_invoice") {
      const invoice = await latestInvoice(companyId);
      if (!invoice) throw new Error("El cliente no tiene facturas para reenviar.");
      await query(
        `INSERT INTO siigo_invoice_logs (siigo_invoice_id, company_id, payment_transaction_id, status, action, can_retry, request_payload, response_payload)
         VALUES ($1, $2, $3, 'skipped', 'resend_invoice', TRUE, $4::jsonb, $5::jsonb)`,
        [
          invoice.id,
          companyId,
          invoice.paymentTransactionId,
          JSON.stringify({ requestedBy: adminSession.userEmail, source: "admin_client_actions" }),
          JSON.stringify({ queued: true, invoiceStatus: invoice.status })
        ]
      );
      metadata.invoiceId = invoice.id;
      metadata.invoiceStatus = invoice.status;
      message = "Reenvío de factura registrado para reintento.";
    } else if (action === "mark_manual_payment") {
      const payment = await markManualPayment(companyId);
      metadata.paymentId = payment.paymentId;
      metadata.amountCop = payment.amountCop;
      message = "Pago manual marcado como pagado.";
    } else if (action === "impersonate_client") {
      const impersonation = await createImpersonationSession(companyId, adminSession.userId, adminSession.userEmail);
      impersonationCookie = { token: impersonation.token, expiresAt: impersonation.expiresAt };
      metadata.impersonatedUserId = impersonation.userId;
      metadata.impersonatedUserEmail = impersonation.userEmail;
      redirectTo = "/dashboard";
      message = `Entrando como ${impersonation.userEmail}. Acción auditada.`;
    } else {
      throw new Error("Acción no soportada.");
    }

    await logAction(companyId, adminSession.userId, action, channel, metadata, auditContext(request));

    const response = ok({ message, redirectTo });
    if (impersonationCookie) {
      setSessionCookie(response, impersonationCookie.token, impersonationCookie.expiresAt);
    }
    return response;
  } catch (error) {
    return fail(error, 400);
  }
}

async function ensureCompanyExists(companyId: string) {
  const company = await query<{ id: string }>(`SELECT id FROM companies WHERE id = $1 LIMIT 1`, [companyId]);
  if (!company.rows[0]) throw new Error("Cliente no encontrado.");
}

async function changePlan(companyId: string, planId: string) {
  await query(`UPDATE companies SET plan = $2, updated_at = NOW() WHERE id = $1`, [companyId, planId]);
  const subscription = await query<{ id: string }>(
    `SELECT id FROM subscriptions WHERE company_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [companyId]
  );

  if (subscription.rows[0]?.id) {
    await query(
      `UPDATE subscriptions
       SET plan_id = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [subscription.rows[0].id, planId]
    );
    return;
  }

  await query(
    `INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, trial_starts_at, trial_ends_at)
     VALUES ($1, $2, 'trial', NOW(), NOW(), NOW() + INTERVAL '30 days')`,
    [companyId, planId]
  );
}

async function extendTrial(companyId: string, days: number) {
  const subscription = await query<{ id: string; trialEndsAt: string }>(
    `UPDATE subscriptions
     SET status = 'trial',
         trial_ends_at = GREATEST(trial_ends_at, NOW()) + ($2::int * INTERVAL '1 day'),
         current_period_end = NULL,
         updated_at = NOW()
     WHERE id = (
       SELECT id
       FROM subscriptions
       WHERE company_id = $1
       ORDER BY created_at DESC
       LIMIT 1
     )
     RETURNING id, trial_ends_at AS "trialEndsAt"`,
    [companyId, days]
  );

  if (subscription.rows[0]) {
    await unblockCompany(companyId);
    return { subscriptionId: subscription.rows[0].id, trialEndsAt: subscription.rows[0].trialEndsAt };
  }

  const company = await query<{ plan: string }>(`SELECT plan FROM companies WHERE id = $1 LIMIT 1`, [companyId]);
  const planId = validPlans.has(company.rows[0]?.plan) ? company.rows[0].plan : "go";
  const created = await query<{ id: string; trialEndsAt: string }>(
    `INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, trial_starts_at, trial_ends_at)
     VALUES ($1, $2, 'trial', NOW(), NOW(), NOW() + ($3::int * INTERVAL '1 day'))
     RETURNING id, trial_ends_at AS "trialEndsAt"`,
    [companyId, planId, days]
  );
  await unblockCompany(companyId);
  return { subscriptionId: created.rows[0].id, trialEndsAt: created.rows[0].trialEndsAt };
}

async function latestInvoice(companyId: string) {
  const invoice = await query<{
    id: string;
    paymentTransactionId: string;
    status: string;
  }>(
    `SELECT id,
            payment_transaction_id AS "paymentTransactionId",
            status
     FROM siigo_invoices
     WHERE company_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [companyId]
  );
  return invoice.rows[0] || null;
}

async function markManualPayment(companyId: string) {
  await query(
    `INSERT INTO payment_providers (id, name, category, status, supports_recurring, supports_cash, supports_pse, supports_cards, description)
     VALUES ('manual_admin', 'Pago manual admin', 'Conciliación manual', 'available', FALSE, TRUE, FALSE, FALSE, 'Pago registrado manualmente desde el panel administrativo.')
     ON CONFLICT (id) DO UPDATE SET status = 'available', updated_at = NOW()`
  );

  const target = await query<{ subscriptionId: string | null; planId: string; amountCop: number }>(
    `SELECT subscriptions.id AS "subscriptionId",
            COALESCE(subscriptions.plan_id, companies.plan, 'go') AS "planId",
            plans.price_cop AS "amountCop"
     FROM companies
     LEFT JOIN LATERAL (
       SELECT id, plan_id
       FROM subscriptions
       WHERE company_id = companies.id
       ORDER BY created_at DESC
       LIMIT 1
     ) subscriptions ON TRUE
     JOIN plans ON plans.id = COALESCE(subscriptions.plan_id, companies.plan, 'go')
     WHERE companies.id = $1
     LIMIT 1`,
    [companyId]
  );

  if (!target.rows[0]) throw new Error("No se encontró plan para marcar pago manual.");
  let subscriptionId = target.rows[0].subscriptionId;

  if (!subscriptionId) {
    const created = await query<{ id: string }>(
      `INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, trial_starts_at, trial_ends_at)
       VALUES ($1, $2, 'active', NOW(), NOW() + INTERVAL '1 month', NOW(), NOW())
       RETURNING id`,
      [companyId, target.rows[0].planId]
    );
    subscriptionId = created.rows[0].id;
  }

  const payment = await query<{ id: string; amountCop: number }>(
    `INSERT INTO payment_transactions (
       company_id,
       subscription_id,
       plan_id,
       provider_id,
       amount_cop,
       status,
       external_reference,
       provider_transaction_id,
       metadata,
       paid_at
     )
     VALUES ($1, $2, $3, 'manual_admin', $4, 'paid', $5, $5, $6::jsonb, NOW())
     RETURNING id, amount_cop AS "amountCop"`,
    [
      companyId,
      subscriptionId,
      target.rows[0].planId,
      target.rows[0].amountCop,
      `manual_${companyId.slice(0, 8)}_${Date.now()}`,
      JSON.stringify({ source: "admin_manual_payment" })
    ]
  );

  await query(
    `UPDATE subscriptions
     SET status = 'active',
         current_period_start = NOW(),
         current_period_end = NOW() + INTERVAL '1 month',
         updated_at = NOW()
     WHERE id = $1`,
    [subscriptionId]
  );
  await unblockCompany(companyId);

  return { paymentId: payment.rows[0].id, amountCop: payment.rows[0].amountCop };
}

async function createImpersonationSession(companyId: string, adminUserId: string, adminEmail: string) {
  const user = await query<{ id: string; email: string }>(
    `SELECT id, email
     FROM users
     WHERE company_id = $1
       AND status = 'active'
     ORDER BY CASE WHEN role = 'propietario' THEN 0 ELSE 1 END, created_at ASC
     LIMIT 1`,
    [companyId]
  );

  if (!user.rows[0]) throw new Error("El cliente no tiene un usuario activo para impersonar.");

  const token = createPlainToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await query(
    `INSERT INTO sessions (user_id, company_id, token_hash, user_agent, ip_address, expires_at)
     VALUES ($1, $2, $3, $4, 'admin-impersonation', $5)`,
    [
      user.rows[0].id,
      companyId,
      hashToken(token),
      `Impersonación admin ${adminEmail} (${adminUserId})`,
      expiresAt
    ]
  );

  return {
    expiresAt,
    token,
    userEmail: user.rows[0].email,
    userId: user.rows[0].id
  };
}

async function unblockCompany(companyId: string) {
  await query(
    `UPDATE companies
     SET access_blocked_at = NULL,
         access_blocked_by = NULL,
         access_block_reason = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [companyId]
  );
}

function auditContext(request: Request): AuditContext {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const vercelForwardedFor = request.headers.get("x-vercel-forwarded-for");
  const ipAddress = (vercelForwardedFor || forwardedFor || realIp || "")
    .split(",")[0]
    .trim() || null;
  const url = new URL(request.url);

  return {
    ipAddress,
    requestMethod: request.method,
    requestPath: url.pathname,
    userAgent: request.headers.get("user-agent")
  };
}

async function logAction(
  companyId: string,
  adminUserId: string,
  action: string,
  channel: string | null,
  metadata: Record<string, unknown>,
  audit: AuditContext
) {
  try {
    await query(
      `INSERT INTO admin_client_actions (
         company_id,
         admin_user_id,
         action,
         channel,
         ip_address,
         user_agent,
         request_path,
         request_method,
         target_type,
         target_id,
         metadata
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'company', $1, $9::jsonb)`,
      [
        companyId,
        adminUserId,
        action,
        channel,
        audit.ipAddress,
        audit.userAgent,
        audit.requestPath,
        audit.requestMethod,
        JSON.stringify(metadata)
      ]
    );
  } catch (error) {
    if (!(error instanceof Error) || !error.message.toLowerCase().includes("column")) {
      throw error;
    }

    await query(
      `INSERT INTO admin_client_actions (company_id, admin_user_id, action, channel, metadata)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [companyId, adminUserId, action, channel, JSON.stringify({ ...metadata, auditPendingSchema: audit })]
    );
  }
}
