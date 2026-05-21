import { fail, ok, requiredString } from "@/lib/api";
import { validateAdminSession } from "@/lib/admin-access";
import { query } from "@/lib/db";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

const validPlans = new Set(["go", "basic", "pro"]);

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
    const metadata: Record<string, unknown> = {};

    if (action === "change_plan") {
      const planId = requiredString(body.planId, "planId").toLowerCase();
      if (!validPlans.has(planId)) throw new Error("Plan inválido.");
      await changePlan(companyId, planId);
      metadata.planId = planId;
      message = `Plan cambiado a ${planId.toUpperCase()}.`;
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
    } else {
      throw new Error("Acción no soportada.");
    }

    await logAction(companyId, adminSession.userId, action, channel, metadata);

    return ok({ message });
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

async function logAction(companyId: string, adminUserId: string, action: string, channel: string | null, metadata: Record<string, unknown>) {
  await query(
    `INSERT INTO admin_client_actions (company_id, admin_user_id, action, channel, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [companyId, adminUserId, action, channel, JSON.stringify(metadata)]
  );
}
