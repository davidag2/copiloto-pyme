import { query } from "@/lib/db";

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

function priorityLabel(value: string | null | undefined) {
  if (value === "urgent") return "Urgente";
  if (value === "high") return "Alta";
  if (value === "low") return "Baja";
  return "Normal";
}

function statusLabel(value: string | null | undefined) {
  if (value === "open") return "Abierto";
  if (value === "in_progress") return "En progreso";
  if (value === "resolved") return "Resuelto";
  if (value === "closed") return "Cerrado";
  return "Pendiente";
}

export async function getAdminSupport() {
  const [summary, manualCases, operations] = await Promise.all([
    query<{
      openCases: string;
      inProgressCases: string;
      onboardingPending: string;
      blockedAccounts: string;
      integrationErrors: string;
    }>(
      `SELECT (SELECT COUNT(*) FROM support_cases WHERE status = 'open')::text AS "openCases",
              (SELECT COUNT(*) FROM support_cases WHERE status = 'in_progress')::text AS "inProgressCases",
              (SELECT COUNT(*) FROM onboarding_progress WHERE status <> 'completed')::text AS "onboardingPending",
              (SELECT COUNT(*) FROM companies WHERE access_blocked_at IS NOT NULL AND deleted_at IS NULL)::text AS "blockedAccounts",
              (
                (SELECT COUNT(*) FROM siigo_invoices WHERE status IN ('failed', 'rejected')) +
                (SELECT COUNT(*) FROM integrations WHERE status IN ('Error', 'Fallida', 'Fallido', 'Desconectado'))
              )::text AS "integrationErrors"`
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      title: string;
      description: string;
      priority: string;
      status: string;
      createdAt: string;
    }>(
      `SELECT support_cases.id,
              support_cases.company_id AS "companyId",
              companies.name AS "companyName",
              support_cases.title,
              support_cases.description,
              support_cases.priority,
              support_cases.status,
              support_cases.created_at AS "createdAt"
       FROM support_cases
       JOIN companies ON companies.id = support_cases.company_id
       WHERE companies.deleted_at IS NULL
       ORDER BY support_cases.created_at DESC
       LIMIT 30`
    ),
    query<{
      id: string;
      companyId: string;
      companyName: string;
      type: string;
      title: string;
      description: string;
      priority: string;
      status: string;
      createdAt: string;
    }>(
      `WITH onboarding_requests AS (
         SELECT onboarding_progress.id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Onboarding pendiente' AS type,
                'Onboarding pendiente' AS title,
                CONCAT('Paso actual: ', onboarding_progress.current_step) AS description,
                'normal' AS priority,
                onboarding_progress.status,
                onboarding_progress.created_at
         FROM onboarding_progress
         JOIN companies ON companies.id = onboarding_progress.company_id
         WHERE onboarding_progress.status <> 'completed'
           AND companies.deleted_at IS NULL
       ),
       blocked_requests AS (
         SELECT companies.id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Cuenta bloqueada' AS type,
                'Cuenta bloqueada' AS title,
                COALESCE(companies.access_block_reason, 'Bloqueo operativo activo') AS description,
                'high' AS priority,
                'open' AS status,
                companies.access_blocked_at AS created_at
         FROM companies
         WHERE companies.access_blocked_at IS NOT NULL
           AND companies.deleted_at IS NULL
       ),
       invoice_requests AS (
         SELECT siigo_invoices.id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Error de integración' AS type,
                'Factura SIIGO/DIAN con error' AS title,
                COALESCE(siigo_invoices.error_message, 'Factura no pudo ser validada o enviada') AS description,
                'urgent' AS priority,
                siigo_invoices.status,
                siigo_invoices.created_at
         FROM siigo_invoices
         JOIN companies ON companies.id = siigo_invoices.company_id
         WHERE siigo_invoices.status IN ('failed', 'rejected')
           AND companies.deleted_at IS NULL
       ),
       integration_requests AS (
         SELECT integrations.id,
                companies.id AS company_id,
                companies.name AS company_name,
                'Error de integración' AS type,
                CONCAT('Integración ', integrations.provider, ' requiere atención') AS title,
                CONCAT(integrations.category, ' · Estado: ', integrations.status) AS description,
                'high' AS priority,
                integrations.status,
                integrations.updated_at AS created_at
         FROM integrations
         JOIN companies ON companies.id = integrations.company_id
         WHERE integrations.status IN ('Error', 'Fallida', 'Fallido', 'Desconectado')
           AND companies.deleted_at IS NULL
       )
       SELECT id::text,
              company_id AS "companyId",
              company_name AS "companyName",
              type,
              title,
              description,
              priority,
              status,
              created_at AS "createdAt"
       FROM (
         SELECT * FROM onboarding_requests
         UNION ALL SELECT * FROM blocked_requests
         UNION ALL SELECT * FROM invoice_requests
         UNION ALL SELECT * FROM integration_requests
       ) support_queue
       ORDER BY created_at DESC
       LIMIT 40`
    )
  ]);

  const summaryRow = summary.rows[0];

  return {
    cases: manualCases.rows.map((supportCase) => ({
      ...supportCase,
      createdLabel: toDateLabel(supportCase.createdAt),
      priorityLabel: priorityLabel(supportCase.priority),
      statusLabel: statusLabel(supportCase.status)
    })),
    operations: operations.rows.map((item) => ({
      ...item,
      createdLabel: toDateLabel(item.createdAt),
      priorityLabel: priorityLabel(item.priority),
      statusLabel: statusLabel(item.status)
    })),
    summary: {
      blockedAccounts: toNumber(summaryRow?.blockedAccounts),
      inProgressCases: toNumber(summaryRow?.inProgressCases),
      integrationErrors: toNumber(summaryRow?.integrationErrors),
      onboardingPending: toNumber(summaryRow?.onboardingPending),
      openCases: toNumber(summaryRow?.openCases)
    }
  };
}
