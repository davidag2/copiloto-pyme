"use client";

import type { LucideIcon } from "lucide-react";
import { ArrowRight, CheckCircle2, Clock3, Database, Sparkles, Target } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";

type HomeSuggestion = {
  id?: string;
  tone: string;
  label: string;
  icon: LucideIcon;
  title: string;
  text: string;
  impact: string;
};

type HomeKpi = {
  label: string;
  value: string;
  helper: string;
  delta: string;
  tone: string;
  icon: LucideIcon;
  trend: number[];
};

type ImpactSummaryCard = {
  type: string;
  value: number;
  label: string;
  helper: string;
  icon: LucideIcon;
  tone: string;
};

type ImpactCategory = {
  label: string;
  count: number;
  tag: string;
  tone: string;
  icon: LucideIcon;
  impactTotal: number;
  firstSuggestionId?: string;
};

type ActivityItem = {
  id: string;
  title: string;
  text: string;
  time: string;
  icon: LucideIcon;
  tone: string;
  href?: string;
};

type DashboardHomeProps = {
  isActive: boolean;
  overallStatusTone: string;
  dateRangeLabel: string;
  overallStatus: string;
  kpiSourceStatus: string;
  aiSuggestionsStatus: string;
  aiSuggestions: HomeSuggestion[];
  aiHomeKpis: HomeKpi[];
  aiImpactSummaryCards: ImpactSummaryCard[];
  aiImpactLift: number;
  hasRealAiSuggestions: boolean;
  hasBusinessData: boolean;
  aiImpactData: Array<Record<string, string | number>>;
  aiImpactCategories: ImpactCategory[];
  aiCategoryMaxImpact: number;
  aiActivity: ActivityItem[];
  activityStatus: string;
  companyId: string;
  tenantShortId: string;
  activeRoleLabel: string;
  currencyLabel: string;
  monthlyGoalLabel: string;
  persistenceStatus: string;
  microFeedback: string;
  microAction: string | null;
  onRefreshSuggestions: () => void;
  onShowAllCategories: () => void;
  onRefreshActivity: () => void;
  formatCopCompact: (value: number) => string;
  formatMoney: (value: number) => string;
};

function MiniSparkline({ data, tone }: { data: number[]; tone: string }) {
  const width = 112;
  const height = 42;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / Math.max(data.length - 1, 1)) * width;
    const y = height - ((value - min) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <svg className="mini-sparkline" data-tone={tone} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Tendencia del indicador">
      <polyline points={points} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      <circle cx={points.split(" ").at(-1)?.split(",")[0] ?? width} cy={points.split(" ").at(-1)?.split(",")[1] ?? height / 2} r="3.5" fill="currentColor" />
    </svg>
  );
}

export function DashboardHome({
  isActive,
  overallStatusTone,
  dateRangeLabel,
  overallStatus,
  kpiSourceStatus,
  aiSuggestionsStatus,
  aiSuggestions,
  aiHomeKpis,
  aiImpactLift,
  hasRealAiSuggestions,
  hasBusinessData,
  aiImpactData,
  aiImpactCategories,
  companyId,
  tenantShortId,
  activeRoleLabel,
  currencyLabel,
  monthlyGoalLabel,
  persistenceStatus,
  microFeedback,
  microAction,
  onRefreshSuggestions,
  onShowAllCategories,
  formatCopCompact,
  formatMoney
}: DashboardHomeProps) {
  const totalActiveCategories = aiImpactCategories.reduce((total, item) => total + item.count, 0);
  const primarySuggestion = aiSuggestions[0];
  const secondarySuggestions = aiSuggestions.slice(1, 4);
  const PrimaryIcon = primarySuggestion?.icon ?? Sparkles;
  const weekKpis = aiHomeKpis.slice(0, 4);
  const hasSuggestions = aiSuggestions.length > 0;
  const processSteps = [
    {
      title: "Detectamos oportunidades",
      text: "La IA analiza tus ventas, caja, inventario, precios y comportamiento de clientes.",
      icon: Sparkles
    },
    {
      title: "Generamos sugerencias",
      text: "Priorizamos las acciones con mayor impacto y factibilidad para tu equipo.",
      icon: Target
    },
    {
      title: "Obtienes mejores resultados",
      text: "Ejecutas la recomendación, mides el avance y mantienes el negocio bajo control.",
      icon: CheckCircle2
    }
  ];

  return (
    <>
      <section className="ai-command-home dashboard-module-section" data-active={isActive} aria-label="Inicio Copiloto AI">
        <div className="ai-command-main">
          <article className="ai-command-hero" data-status={overallStatusTone}>
            <div className="ai-command-copy">
              <span className="ai-command-eyebrow"><Sparkles aria-hidden="true" />Copiloto AI</span>
              <h2>{hasSuggestions ? "Tu IA encontró la mejor acción para impulsar tu negocio" : "Tu dashboard está listo para recibir tus datos"}</h2>
              <p>{hasSuggestions ? "Basado en ventas, caja e inventario, esta es la acción con mayor impacto para esta semana." : "Cuando importes información o registres ventas manuales, Copiloto Pyme mostrará KPIs, alertas y sugerencias reales."}</p>
              <div className="ai-command-meta">
                <span><Clock3 aria-hidden="true" />{dateRangeLabel}</span>
                <span data-status={overallStatusTone}>{overallStatus}</span>
                <span><Database aria-hidden="true" />{hasBusinessData ? hasRealAiSuggestions ? "Datos reales conectados" : "Datos cargados" : "Sin datos cargados"}</span>
              </div>
              <button className="primary-button ai-command-action" type="button" onClick={onRefreshSuggestions}>
                {hasSuggestions ? "Ver detalle de la sugerencia" : "Buscar sugerencias"} <ArrowRight aria-hidden="true" />
              </button>
            </div>

            <div className="ai-orb-stage" aria-hidden="true">
              <span className="ai-orb-ring" />
              <span className="ai-orb-core"><Sparkles /></span>
              <span className="ai-orb-shadow" />
            </div>

            <article className="ai-priority-card" data-tone={primarySuggestion?.tone ?? "priority"}>
              <span className="ai-priority-badge">{primarySuggestion?.label ?? "Sin prioridad activa"}</span>
              <div className="ai-priority-title">
                <span><PrimaryIcon aria-hidden="true" /></span>
                <div>
                  <strong>{primarySuggestion?.title ?? "Aún no hay sugerencias IA"}</strong>
                  <small>{primarySuggestion?.text ?? "Carga ventas, caja o inventario para que la IA analice tu negocio."}</small>
                </div>
              </div>
              <div className="ai-confidence-bars" aria-label="Confianza alta">
                <span />
                <span />
                <span />
                <span data-muted="true" />
                <span data-muted="true" />
              </div>
              <p><span>Impacto estimado</span><strong>{primarySuggestion?.impact ?? formatCopCompact(aiImpactLift)}</strong></p>
              {primarySuggestion?.id ? <a href={`/dashboard/suggestions/${primarySuggestion.id}`}>Abrir sugerencia</a> : null}
            </article>
          </article>

          <article className="ai-process-panel">
            <div className="ai-section-heading">
              <strong>Así impactarán las sugerencias en tu negocio</strong>
              <span>{kpiSourceStatus}</span>
            </div>
            <div className="ai-process-steps">
              {processSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <article className="ai-process-card" key={step.title}>
                    <span><Icon aria-hidden="true" /></span>
                    <strong>{index + 1}. {step.title}</strong>
                    <p>{step.text}</p>
                  </article>
                );
              })}
            </div>
          </article>
        </div>

        <aside className="ai-command-side">
          <article className="ai-potential-card">
            <div>
              <span>Impacto potencial total</span>
              <strong>{formatCopCompact(aiImpactLift)}</strong>
              <small>{hasBusinessData ? hasRealAiSuggestions ? "Calculado desde PostgreSQL" : "Datos listos para análisis" : "En cero hasta cargar información"}</small>
            </div>
            <div className="ai-potential-chart">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={aiImpactData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <Tooltip formatter={(value, name) => [formatMoney(Number(value ?? 0)), String(name)]} />
                  <Line type="monotone" dataKey="withAi" name="Con sugerencias AI" stroke="#6d5dfc" strokeWidth={3} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <button className="ai-side-link" type="button" onClick={onShowAllCategories}>
              <b>{totalActiveCategories}</b>
              <span>Sugerencias activas</span>
              <ArrowRight aria-hidden="true" />
            </button>
          </article>

          <article className="ai-week-card">
            <div className="ai-section-heading">
              <strong>Tu negocio esta semana</strong>
              <span>{aiSuggestionsStatus}</span>
            </div>
            <div className="ai-week-list">
              {weekKpis.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="ai-week-item" data-tone={item.tone} key={item.label}>
                    <span><Icon aria-hidden="true" /></span>
                    <div><strong>{item.label}</strong><small>{item.helper}</small></div>
                    <b>{item.value}</b>
                    <em>{item.delta}</em>
                    <MiniSparkline data={item.trend} tone={item.tone} />
                  </div>
                );
              })}
            </div>
          </article>
        </aside>
      </section>

      <section className="ai-suggestion-board dashboard-module-section" data-active={isActive} aria-label="Otras sugerencias para ti">
        <div className="ai-section-heading ai-board-heading">
          <strong>Otras sugerencias para ti</strong>
          <button className="ghost-button" type="button" onClick={onShowAllCategories}>Ver todas las sugerencias <ArrowRight aria-hidden="true" /></button>
        </div>
        <div className="ai-suggestion-board-grid">
          {(secondarySuggestions.length ? secondarySuggestions : aiSuggestions).map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <article className="ai-suggestion-card" data-tone={suggestion.tone} key={suggestion.title}>
                <div className="ai-suggestion-top">
                  <span className="ai-suggestion-icon"><Icon aria-hidden="true" /></span>
                  <span className="ai-suggestion-label">{suggestion.label}</span>
                </div>
                <strong>{suggestion.title}</strong>
                <p>{suggestion.text}</p>
                <small>Impacto estimado</small>
                <b>{suggestion.impact}</b>
                {suggestion.id ? <a className="ai-suggestion-detail-link" href={`/dashboard/suggestions/${suggestion.id}`}>Ver detalle</a> : null}
              </article>
            );
          })}
          {!aiSuggestions.length ? (
            <article className="ai-suggestion-card ai-suggestion-empty">
              <div className="ai-suggestion-top">
                <span className="ai-suggestion-icon"><Database aria-hidden="true" /></span>
                <span className="ai-suggestion-label">Sin datos</span>
              </div>
              <strong>No hay sugerencias todavía</strong>
              <p>Registra ventas o importa información para activar recomendaciones reales de IA.</p>
              <small>Impacto estimado</small>
              <b>{formatCopCompact(0)}</b>
            </article>
          ) : null}
        </div>
      </section>

      <section className="setup-summary dashboard-module-section home-context-summary" data-active={isActive}>
        <div><span>Empresa / tenant</span><strong>{companyId ? `ID ${tenantShortId}` : "Sin sesión"}</strong></div>
        <div><span>Rol activo</span><strong>{activeRoleLabel}</strong></div>
        <div><span>Moneda</span><strong>{currencyLabel}</strong></div>
        <div><span>Meta mensual</span><strong>{monthlyGoalLabel}</strong></div>
      </section>
      <p className="persistence-note dashboard-module-section" data-active={isActive}>{persistenceStatus}</p>
      {microFeedback && (
        <div className="micro-feedback" data-action={microAction ?? undefined}>
          <CheckCircle2 aria-hidden="true" />
          <span>{microFeedback}</span>
        </div>
      )}
    </>
  );
}
