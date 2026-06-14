import { query } from "@/lib/db";
import { createWaitlistTurn } from "@/lib/waitlist";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function toPlanLabel(value: string | null | undefined) {
  if (!value) return "Sin plan";
  return `Plan ${value.toUpperCase()}`;
}

function toStatusLabel(subscriptionStatus: string | null | undefined, accessBlockedAt?: string | null) {
  if (accessBlockedAt) return "Bloqueado";
  if (subscriptionStatus === "trial") return "Prueba gratis";
  if (subscriptionStatus === "active") return "Activo";
  if (subscriptionStatus === "past_due") return "Pago pendiente";
  if (subscriptionStatus === "canceled") return "Cancelado";
  return "Sin suscripción";
}

type ClientRow = {
  id: string;
  name: string;
  country: string;
  businessType: string;
  plan: string;
  createdAt: string;
  deletedAt: string | null;
  deletionReason: string | null;
  accessBlockedAt: string | null;
  subscriptionStatus: string | null;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  onboardingStatus: string | null;
  onboardingStep: string | null;
  usersCount: string;
  lastLoginAt: string | null;
  paidAmount: string;
  pendingAmount: string;
  invoiceErrors: string;
};

function toAccessStage(onboardingStatus: string | null | undefined) {
  if (onboardingStatus === "waitlist") return "Waitlist";
  if (onboardingStatus === "completed") return "Onboarding completo";
  if (onboardingStatus === "in_progress") return "Onboarding";
  return "Pendiente";
}

function mapClient(client: ClientRow) {
  return {
    ...client,
    createdLabel: toDateLabel(client.createdAt),
    deletedLabel: toDateLabel(client.deletedAt),
    invoiceErrors: toNumber(client.invoiceErrors),
    lastLoginLabel: toDateLabel(client.lastLoginAt),
    paidAmount: toNumber(client.paidAmount),
    pendingAmount: toNumber(client.pendingAmount),
    planLabel: toPlanLabel(client.plan),
    renewalLabel: toDateLabel(client.currentPeriodEnd || client.trialEndsAt),
    statusLabel: toStatusLabel(client.subscriptionStatus, client.accessBlockedAt),
    accessStage: toAccessStage(client.onboardingStatus),
    waitlistTurn: createWaitlistTurn(client.id),
    usersCount: toNumber(client.usersCount)
  };
}

export async function getAdminClients() {
  const [summary, clients, deletedClients] = await Promise.all([
    query<{
      total: string;
      deleted: string;
      trial: string;
      active: string;
      pastDue: string;
      waitlist: string;
      users: string;
    }>(
      `SELECT COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NULL)::text AS total,
              COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NOT NULL)::text AS deleted,
              COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NULL AND subscriptions.status = 'trial')::text AS trial,
              COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NULL AND subscriptions.status = 'active')::text AS active,
              COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NULL AND subscriptions.status = 'past_due')::text AS "pastDue",
              COUNT(DISTINCT companies.id) FILTER (WHERE companies.deleted_at IS NULL AND onboarding_progress.status = 'waitlist')::text AS waitlist,
              COUNT(DISTINCT users.id) FILTER (WHERE companies.deleted_at IS NULL)::text AS users
       FROM companies
       LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
         AND subscriptions.status IN ('trial', 'active', 'past_due')
       LEFT JOIN onboarding_progress ON onboarding_progress.company_id = companies.id
       LEFT JOIN users ON users.company_id = companies.id`
    ),
    query<ClientRow>(clientQuery("companies.deleted_at IS NULL", 50)),
    query<ClientRow>(clientQuery("companies.deleted_at IS NOT NULL", 25))
  ]);

  return {
    clients: clients.rows.map(mapClient),
    deletedClients: deletedClients.rows.map(mapClient),
    waitlistClients: clients.rows.map(mapClient).filter((client) => client.onboardingStatus === "waitlist"),
    summary: {
      active: toNumber(summary.rows[0]?.active),
      deleted: toNumber(summary.rows[0]?.deleted),
      pastDue: toNumber(summary.rows[0]?.pastDue),
      total: toNumber(summary.rows[0]?.total),
      trial: toNumber(summary.rows[0]?.trial),
      waitlist: toNumber(summary.rows[0]?.waitlist),
      users: toNumber(summary.rows[0]?.users)
    }
  };
}

function clientQuery(whereClause: string, limit: number) {
  return `WITH user_stats AS (
           SELECT company_id,
                  COUNT(*)::text AS users_count,
                  MAX(last_login_at)::text AS last_login_at
           FROM users
           GROUP BY company_id
         ),
         payment_stats AS (
           SELECT company_id,
                  COALESCE(SUM(amount_cop) FILTER (WHERE status = 'paid'), 0)::text AS paid_amount,
                  COALESCE(SUM(amount_cop) FILTER (WHERE status IN ('pending', 'configuration_required', 'redirect_created')), 0)::text AS pending_amount
           FROM payment_transactions
           GROUP BY company_id
         ),
         invoice_stats AS (
           SELECT company_id,
                  COUNT(*) FILTER (WHERE status = 'failed')::text AS invoice_errors
           FROM siigo_invoices
           GROUP BY company_id
         )
         SELECT companies.id,
                companies.name,
                companies.country,
                companies.business_type AS "businessType",
                companies.plan,
                companies.created_at AS "createdAt",
                companies.deleted_at AS "deletedAt",
                companies.deletion_reason AS "deletionReason",
                companies.access_blocked_at AS "accessBlockedAt",
                subscriptions.status AS "subscriptionStatus",
                subscriptions.trial_ends_at AS "trialEndsAt",
                subscriptions.current_period_end AS "currentPeriodEnd",
                owner.name AS "ownerName",
                owner.email AS "ownerEmail",
                onboarding_progress.status AS "onboardingStatus",
                onboarding_progress.current_step AS "onboardingStep",
                COALESCE(user_stats.users_count, '0') AS "usersCount",
                user_stats.last_login_at AS "lastLoginAt",
                COALESCE(payment_stats.paid_amount, '0') AS "paidAmount",
                COALESCE(payment_stats.pending_amount, '0') AS "pendingAmount",
                COALESCE(invoice_stats.invoice_errors, '0') AS "invoiceErrors"
         FROM companies
         LEFT JOIN subscriptions ON subscriptions.company_id = companies.id
           AND subscriptions.status IN ('trial', 'active', 'past_due', 'canceled')
         LEFT JOIN users owner ON owner.company_id = companies.id
           AND owner.role = 'propietario'
         LEFT JOIN onboarding_progress ON onboarding_progress.company_id = companies.id
         LEFT JOIN user_stats ON user_stats.company_id = companies.id
         LEFT JOIN payment_stats ON payment_stats.company_id = companies.id
         LEFT JOIN invoice_stats ON invoice_stats.company_id = companies.id
         WHERE ${whereClause}
         ORDER BY companies.created_at DESC
         LIMIT ${limit}`;
}
