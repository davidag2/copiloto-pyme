import { query } from "@/lib/db";
import { currentLegalAcceptance } from "@/lib/legal";

function toNumber(value: unknown) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDateTimeLabel(value: string | null | undefined) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    admin_import: "Importación admin",
    login_update: "Actualización en login",
    registration: "Registro"
  };

  return labels[source] || source;
}

export async function getAdminLegalAudit() {
  try {
    const [summary, recentAcceptances, pendingCompanies] = await Promise.all([
      query<{
        total: string;
        currentVersion: string;
        registration: string;
        loginUpdate: string;
        last24h: string;
      }>(
        `SELECT COUNT(*)::text AS total,
                COUNT(*) FILTER (WHERE legal_version = $1)::text AS "currentVersion",
                COUNT(*) FILTER (WHERE source = 'registration')::text AS registration,
                COUNT(*) FILTER (WHERE source = 'login_update')::text AS "loginUpdate",
                COUNT(*) FILTER (WHERE accepted_at >= NOW() - INTERVAL '24 hours')::text AS "last24h"
         FROM legal_acceptances`,
        [currentLegalAcceptance.version]
      ),
      query<{
        id: string;
        companyId: string;
        companyName: string;
        userName: string | null;
        userEmail: string | null;
        legalVersion: string;
        source: string;
        ipAddress: string | null;
        userAgent: string | null;
        acceptedAt: string;
      }>(
        `SELECT legal_acceptances.id,
                companies.id AS "companyId",
                companies.name AS "companyName",
                users.name AS "userName",
                users.email AS "userEmail",
                legal_acceptances.legal_version AS "legalVersion",
                legal_acceptances.source,
                legal_acceptances.ip_address AS "ipAddress",
                legal_acceptances.user_agent AS "userAgent",
                legal_acceptances.accepted_at AS "acceptedAt"
         FROM legal_acceptances
         JOIN companies ON companies.id = legal_acceptances.company_id
         LEFT JOIN users ON users.id = legal_acceptances.user_id
         ORDER BY legal_acceptances.accepted_at DESC
         LIMIT 80`
      ),
      query<{
        companyId: string;
        companyName: string;
        plan: string;
        ownerName: string | null;
        ownerEmail: string | null;
        createdAt: string;
      }>(
        `SELECT companies.id AS "companyId",
                companies.name AS "companyName",
                companies.plan,
                owner.name AS "ownerName",
                owner.email AS "ownerEmail",
                companies.created_at AS "createdAt"
         FROM companies
         LEFT JOIN users owner
           ON owner.company_id = companies.id
          AND owner.role = 'propietario'
          AND owner.status <> 'disabled'
         WHERE companies.deleted_at IS NULL
           AND NOT EXISTS (
             SELECT 1
             FROM legal_acceptances
             WHERE legal_acceptances.company_id = companies.id
               AND legal_acceptances.legal_version = $1
           )
         ORDER BY companies.created_at DESC
         LIMIT 80`,
        [currentLegalAcceptance.version]
      )
    ]);

    const summaryRow = summary.rows[0];

    return {
      currentVersion: currentLegalAcceptance.version,
      pendingCompanies: pendingCompanies.rows.map((company) => ({
        ...company,
        createdLabel: toDateTimeLabel(company.createdAt)
      })),
      recentAcceptances: recentAcceptances.rows.map((acceptance) => ({
        ...acceptance,
        acceptedLabel: toDateTimeLabel(acceptance.acceptedAt),
        sourceLabel: sourceLabel(acceptance.source),
        statusLabel: acceptance.legalVersion === currentLegalAcceptance.version ? "Vigente" : "Anterior",
        userAgentLabel: acceptance.userAgent ? acceptance.userAgent.slice(0, 90) : "Sin user-agent"
      })),
      setupRequired: false,
      summary: {
        currentVersion: toNumber(summaryRow?.currentVersion),
        last24h: toNumber(summaryRow?.last24h),
        loginUpdate: toNumber(summaryRow?.loginUpdate),
        registration: toNumber(summaryRow?.registration),
        total: toNumber(summaryRow?.total)
      }
    };
  } catch (error) {
    return {
      currentVersion: currentLegalAcceptance.version,
      pendingCompanies: [],
      recentAcceptances: [],
      setupRequired: true,
      summary: {
        currentVersion: 0,
        last24h: 0,
        loginUpdate: 0,
        registration: 0,
        total: 0
      }
    };
  }
}
