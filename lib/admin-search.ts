import { query } from "@/lib/db";
import { formatAdminMoney } from "@/lib/admin-summary";

function cleanSearchTerm(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim().slice(0, 120);
}

function searchPattern(value: string) {
  return `%${value.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function statusLabel(value: string | null | undefined) {
  if (value === "active") return "Activo";
  if (value === "trial") return "Prueba";
  if (value === "past_due") return "Pago pendiente";
  if (value === "canceled") return "Cancelado";
  if (value === "paid") return "Pagado";
  if (value === "pending") return "Pendiente";
  if (value === "failed") return "Fallido";
  if (value === "expired") return "Expirado";
  if (value === "accepted") return "Aceptada";
  if (value === "sent") return "Enviada";
  if (value === "rejected") return "Rechazada";
  if (value === "ready") return "Lista";
  return value || "Sin estado";
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export async function getAdminGlobalSearch(input: string | string[] | undefined) {
  const term = cleanSearchTerm(input);

  if (!term) {
    return {
      hasQuery: false,
      query: "",
      results: {
        companies: [],
        invoices: [],
        payments: [],
        subscriptions: [],
        users: []
      },
      total: 0
    };
  }

  const pattern = searchPattern(term);

  const [companies, users, invoices, payments, subscriptions] = await Promise.all([
    query<{
      id: string;
      name: string;
      country: string;
      businessType: string;
      plan: string;
      ownerEmail: string | null;
      nit: string | null;
      createdAt: string;
    }>(
      `SELECT companies.id,
              companies.name,
              companies.country,
              companies.business_type AS "businessType",
              companies.plan,
              owner.email AS "ownerEmail",
              billing_profiles.identification AS nit,
              companies.created_at AS "createdAt"
       FROM companies
       LEFT JOIN billing_profiles ON billing_profiles.company_id = companies.id
       LEFT JOIN LATERAL (
         SELECT users.email
         FROM users
         WHERE users.company_id = companies.id
         ORDER BY CASE WHEN users.role = 'propietario' THEN 0 ELSE 1 END, users.created_at ASC
         LIMIT 1
       ) owner ON TRUE
       WHERE companies.deleted_at IS NULL
         AND (
           companies.id::text ILIKE $1 ESCAPE '\\' OR
           companies.name ILIKE $1 ESCAPE '\\' OR
           companies.business_type ILIKE $1 ESCAPE '\\' OR
           companies.country ILIKE $1 ESCAPE '\\' OR
           companies.plan ILIKE $1 ESCAPE '\\' OR
           billing_profiles.identification ILIKE $1 ESCAPE '\\' OR
           billing_profiles.legal_name ILIKE $1 ESCAPE '\\' OR
           billing_profiles.email ILIKE $1 ESCAPE '\\' OR
           owner.email ILIKE $1 ESCAPE '\\'
         )
       ORDER BY companies.created_at DESC
       LIMIT 12`,
      [pattern]
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      name: string;
      email: string;
      role: string;
      status: string;
      lastLoginAt: string | null;
    }>(
      `SELECT users.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              users.name,
              users.email,
              users.role,
              users.status,
              users.last_login_at AS "lastLoginAt"
       FROM users
       JOIN companies ON companies.id = users.company_id
       WHERE companies.deleted_at IS NULL
         AND (
           users.id::text ILIKE $1 ESCAPE '\\' OR
           users.name ILIKE $1 ESCAPE '\\' OR
           users.email ILIKE $1 ESCAPE '\\' OR
           users.role ILIKE $1 ESCAPE '\\' OR
           companies.name ILIKE $1 ESCAPE '\\'
         )
       ORDER BY users.created_at DESC
       LIMIT 12`,
      [pattern]
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      customerName: string | null;
      nit: string | null;
      invoiceNumber: string | null;
      status: string;
      amountCop: string | null;
      createdAt: string;
    }>(
      `SELECT siigo_invoices.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              billing_profiles.legal_name AS "customerName",
              billing_profiles.identification AS nit,
              COALESCE(siigo_invoices.siigo_invoice_number, siigo_invoices.siigo_invoice_name, siigo_invoices.siigo_invoice_id) AS "invoiceNumber",
              siigo_invoices.status,
              payment_transactions.amount_cop::text AS "amountCop",
              siigo_invoices.created_at AS "createdAt"
       FROM siigo_invoices
       JOIN companies ON companies.id = siigo_invoices.company_id
       JOIN payment_transactions ON payment_transactions.id = siigo_invoices.payment_transaction_id
       LEFT JOIN billing_profiles ON billing_profiles.company_id = companies.id
       WHERE companies.deleted_at IS NULL
         AND (
           siigo_invoices.id::text ILIKE $1 ESCAPE '\\' OR
           siigo_invoices.siigo_invoice_id ILIKE $1 ESCAPE '\\' OR
           siigo_invoices.siigo_invoice_name ILIKE $1 ESCAPE '\\' OR
           siigo_invoices.siigo_invoice_number ILIKE $1 ESCAPE '\\' OR
           siigo_invoices.siigo_cufe ILIKE $1 ESCAPE '\\' OR
           siigo_invoices.status ILIKE $1 ESCAPE '\\' OR
           billing_profiles.identification ILIKE $1 ESCAPE '\\' OR
           billing_profiles.legal_name ILIKE $1 ESCAPE '\\' OR
           companies.name ILIKE $1 ESCAPE '\\'
         )
       ORDER BY siigo_invoices.created_at DESC
       LIMIT 12`,
      [pattern]
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      providerName: string;
      planName: string;
      amountCop: string;
      status: string;
      externalReference: string;
      providerTransactionId: string | null;
      createdAt: string;
    }>(
      `SELECT payment_transactions.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              payment_providers.name AS "providerName",
              plans.name AS "planName",
              payment_transactions.amount_cop::text AS "amountCop",
              payment_transactions.status,
              payment_transactions.external_reference AS "externalReference",
              payment_transactions.provider_transaction_id AS "providerTransactionId",
              payment_transactions.created_at AS "createdAt"
       FROM payment_transactions
       JOIN companies ON companies.id = payment_transactions.company_id
       JOIN plans ON plans.id = payment_transactions.plan_id
       JOIN payment_providers ON payment_providers.id = payment_transactions.provider_id
       WHERE companies.deleted_at IS NULL
         AND (
           payment_transactions.id::text ILIKE $1 ESCAPE '\\' OR
           payment_transactions.subscription_id::text ILIKE $1 ESCAPE '\\' OR
           payment_transactions.external_reference ILIKE $1 ESCAPE '\\' OR
           payment_transactions.provider_transaction_id ILIKE $1 ESCAPE '\\' OR
           payment_transactions.status ILIKE $1 ESCAPE '\\' OR
           payment_providers.name ILIKE $1 ESCAPE '\\' OR
           plans.name ILIKE $1 ESCAPE '\\' OR
           companies.name ILIKE $1 ESCAPE '\\'
         )
       ORDER BY payment_transactions.created_at DESC
       LIMIT 12`,
      [pattern]
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      planName: string;
      status: string;
      currentPeriodEnd: string | null;
      trialEndsAt: string;
      createdAt: string;
    }>(
      `SELECT subscriptions.id,
              companies.id AS "companyId",
              companies.name AS "companyName",
              plans.name AS "planName",
              subscriptions.status,
              subscriptions.current_period_end AS "currentPeriodEnd",
              subscriptions.trial_ends_at AS "trialEndsAt",
              subscriptions.created_at AS "createdAt"
       FROM subscriptions
       JOIN companies ON companies.id = subscriptions.company_id
       JOIN plans ON plans.id = subscriptions.plan_id
       WHERE companies.deleted_at IS NULL
         AND (
           subscriptions.id::text ILIKE $1 ESCAPE '\\' OR
           subscriptions.company_id::text ILIKE $1 ESCAPE '\\' OR
           subscriptions.plan_id ILIKE $1 ESCAPE '\\' OR
           subscriptions.status ILIKE $1 ESCAPE '\\' OR
           companies.name ILIKE $1 ESCAPE '\\' OR
           plans.name ILIKE $1 ESCAPE '\\'
         )
       ORDER BY subscriptions.created_at DESC
       LIMIT 12`,
      [pattern]
    )
  ]);

  const results = {
    companies: companies.rows.map((item) => ({
      ...item,
      createdLabel: dateLabel(item.createdAt),
      href: `/admin/clientes/${item.id}`
    })),
    invoices: invoices.rows.map((item) => ({
      ...item,
      amountLabel: formatAdminMoney(item.amountCop),
      createdLabel: dateLabel(item.createdAt),
      href: `/admin/clientes/${item.companyId}`,
      statusLabel: statusLabel(item.status)
    })),
    payments: payments.rows.map((item) => ({
      ...item,
      amountCop: toNumber(item.amountCop),
      amountLabel: formatAdminMoney(item.amountCop),
      createdLabel: dateLabel(item.createdAt),
      href: `/admin/clientes/${item.companyId}`,
      statusLabel: statusLabel(item.status)
    })),
    subscriptions: subscriptions.rows.map((item) => ({
      ...item,
      endLabel: dateLabel(item.currentPeriodEnd || item.trialEndsAt),
      href: `/admin/clientes/${item.companyId}`,
      statusLabel: statusLabel(item.status)
    })),
    users: users.rows.map((item) => ({
      ...item,
      href: `/admin/clientes/${item.companyId}`,
      lastLoginLabel: dateLabel(item.lastLoginAt),
      statusLabel: statusLabel(item.status)
    }))
  };

  return {
    hasQuery: true,
    query: term,
    results,
    total:
      results.companies.length +
      results.users.length +
      results.invoices.length +
      results.payments.length +
      results.subscriptions.length
  };
}
