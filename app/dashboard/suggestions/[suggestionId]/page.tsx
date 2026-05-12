import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Database,
  Sparkles,
  Target,
  UserCircle,
  WalletCards
} from "lucide-react";
import { query } from "@/lib/db";
import { validateRequestSession } from "@/lib/session";
import { getSubscriptionAccess } from "@/lib/subscription-access";

type SuggestionDetail = {
  id: string;
  companyId: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  recommendation: string;
  impactType: string;
  impactLabel: string;
  impactValueCop: string | null;
  confidence: string;
  status: string;
  evidence: Record<string, unknown>;
  metadata: Record<string, unknown>;
  suggestedForDate: string;
  generatedAt: string;
  assignedUserName: string | null;
  relatedAlertTitle: string | null;
  relatedDecisionText: string | null;
};

type PageProps = {
  params: Promise<{ suggestionId: string }>;
};

const statusLabels: Record<string, string> = {
  nueva: "Nueva",
  vista: "Vista",
  asignada: "Asignada",
  en_progreso: "En progreso",
  aplicada: "Aplicada",
  descartada: "Descartada"
};

const priorityLabels: Record<string, string> = {
  critical: "Prioridad alta",
  high: "Oportunidad",
  medium: "Atención",
  low: "Seguimiento"
};

function formatCop(value: string | null) {
  if (!value) return "Por estimar";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return "Por estimar";
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(parsed);
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SuggestionDetailPage({ params }: PageProps) {
  const { suggestionId } = await params;
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const session = await validateRequestSession(new Request("https://copiloto-pyme.local/dashboard/suggestions", { headers: { cookie } }));

  if (!session) redirect(`/login?next=/dashboard/suggestions/${suggestionId}`);

  const access = await getSubscriptionAccess(session.companyId);
  if (!access.allowed) redirect(access.redirectTo || "/billing");

  const suggestion = await query<SuggestionDetail>(
    `SELECT ai_suggestions.id,
            ai_suggestions.company_id AS "companyId",
            ai_suggestions.category,
            ai_suggestions.priority,
            ai_suggestions.title,
            ai_suggestions.description,
            ai_suggestions.recommendation,
            ai_suggestions.impact_type AS "impactType",
            ai_suggestions.impact_label AS "impactLabel",
            ai_suggestions.impact_value_cop AS "impactValueCop",
            ai_suggestions.confidence,
            ai_suggestions.status,
            ai_suggestions.evidence,
            ai_suggestions.metadata,
            ai_suggestions.suggested_for_date AS "suggestedForDate",
            ai_suggestions.generated_at AS "generatedAt",
            users.name AS "assignedUserName",
            alerts.title AS "relatedAlertTitle",
            decisions.text AS "relatedDecisionText"
     FROM ai_suggestions
     LEFT JOIN users ON users.id = ai_suggestions.assigned_to
     LEFT JOIN alerts ON alerts.id = ai_suggestions.related_alert_id
     LEFT JOIN decisions ON decisions.id = ai_suggestions.related_decision_id
     WHERE ai_suggestions.id = $1
       AND ai_suggestions.company_id = $2
     LIMIT 1`,
    [suggestionId, session.companyId]
  );

  const detail = suggestion.rows[0];
  if (!detail) notFound();

  if (detail.status === "nueva") {
    await query(
      `UPDATE ai_suggestions
       SET status = 'vista',
           updated_at = NOW()
       WHERE id = $1
         AND company_id = $2
         AND status = 'nueva'`,
      [detail.id, session.companyId]
    );
    detail.status = "vista";
  }

  const evidenceItems = Object.entries(detail.evidence || {});
  const metadataItems = Object.entries(detail.metadata || {});

  return (
    <main className="suggestion-detail-page">
      <header className="suggestion-detail-header">
        <a href="/dashboard"><ArrowLeft aria-hidden="true" />Volver al dashboard</a>
        <div className="brand"><div className="brand-mark">CP</div><div><strong>Copiloto Pyme</strong><span>Detalle de sugerencia IA</span></div></div>
      </header>

      <section className="suggestion-detail-hero" data-priority={detail.priority}>
        <div>
          <span className="suggestion-detail-eyebrow"><Sparkles aria-hidden="true" />{priorityLabels[detail.priority] || "Sugerencia IA"}</span>
          <h1>{detail.title}</h1>
          <p>{detail.description}</p>
          <div className="suggestion-detail-badges">
            <span>{statusLabels[detail.status] || detail.status}</span>
            <span>{detail.category}</span>
            <span>{Number(detail.confidence).toFixed(0)}% confianza</span>
          </div>
        </div>
        <aside>
          <span>Impacto estimado</span>
          <strong>{detail.impactLabel || formatCop(detail.impactValueCop)}</strong>
          <em>{detail.impactType.replaceAll("_", " ")}</em>
          <small>{formatCop(detail.impactValueCop)}</small>
        </aside>
      </section>

      <section className="suggestion-detail-grid">
        <article className="suggestion-detail-card suggestion-detail-main-card">
          <span><Target aria-hidden="true" />Recomendación</span>
          <h2>{detail.recommendation}</h2>
          <p>Esta recomendación fue generada para el {formatDate(detail.suggestedForDate)} y se actualiza con los datos conectados de la empresa.</p>
        </article>

        <article className="suggestion-detail-card">
          <span><Clock3 aria-hidden="true" />Seguimiento</span>
          <div className="suggestion-status-steps">
            {["nueva", "vista", "asignada", "en_progreso", "aplicada", "descartada"].map((status) => (
              <div data-active={detail.status === status} key={status}>
                <CheckCircle2 aria-hidden="true" />
                <strong>{statusLabels[status]}</strong>
              </div>
            ))}
          </div>
        </article>

        <article className="suggestion-detail-card">
          <span><UserCircle aria-hidden="true" />Responsable</span>
          <strong>{detail.assignedUserName || "Sin asignar"}</strong>
          <p>Cuando se asigne a un usuario del equipo, aparecerá aquí para controlar la ejecución.</p>
        </article>

        <article className="suggestion-detail-card">
          <span><AlertTriangle aria-hidden="true" />Origen</span>
          <strong>{detail.relatedAlertTitle || detail.relatedDecisionText || "Generada por Copiloto AI"}</strong>
          <p>La sugerencia puede venir de alertas, decisiones previas o señales detectadas en ventas, caja e inventario.</p>
        </article>

        <article className="suggestion-detail-card">
          <span><Database aria-hidden="true" />Evidencia</span>
          {evidenceItems.length ? (
            <dl className="suggestion-data-list">
              {evidenceItems.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{Array.isArray(value) ? value.join(", ") : String(value)}</dd></div>)}
            </dl>
          ) : <p>Sin evidencia estructurada registrada todavía.</p>}
        </article>

        <article className="suggestion-detail-card">
          <span><WalletCards aria-hidden="true" />Metadata</span>
          {metadataItems.length ? (
            <dl className="suggestion-data-list">
              {metadataItems.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}
            </dl>
          ) : <p>Sin metadata adicional.</p>}
        </article>
      </section>
    </main>
  );
}
