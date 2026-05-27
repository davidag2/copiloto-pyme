"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardCheck,
  Database,
  Sparkles,
  Target
} from "lucide-react";
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
  isGeneratingAi: boolean;
  onGenerateAiDecisions: () => void;
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
  aiImpactSummaryCards,
  aiImpactLift,
  hasRealAiSuggestions,
  hasBusinessData,
  aiImpactData,
  aiImpactCategories,
  aiCategoryMaxImpact,
  aiActivity,
  activityStatus,
  companyId,
  tenantShortId,
  activeRoleLabel,
  currencyLabel,
  monthlyGoalLabel,
  persistenceStatus,
  microFeedback,
  microAction,
  isGeneratingAi,
  onGenerateAiDecisions,
  onRefreshSuggestions,
  onShowAllCategories,
  onRefreshActivity,
  formatCopCompact,
  formatMoney
}: DashboardHomeProps) {
  const totalActiveCategories = aiImpactCategories.reduce((total, item) => total + item.count, 0);
  const primarySuggestion = aiSuggestions[0];
  const secondarySuggestions = aiSuggestions.slice(1, 4);
  const PrimaryIcon = primarySuggestion?.icon ?? Sparkles;
  const weekKpis = aiHomeKpis.slice(0, 4);
  const hasSuggestions = aiSuggestions.length > 0;
  const impactCards = aiImpactSummaryCards.slice(0, 4);
  const processSteps = [
    {
      title: "Conecta datos reales",
      text: "Ventas, caja, inventario y clientes alimentan la lectura diaria.",
      icon: Database
    },
    {
      title: "Genera sugerencias IA",
      text: "OpenAI cruza señales y detecta riesgos, oportunidades y prioridades.",
      icon: Sparkles
    },
    {
      title: "Ejecuta la decisión",
      text: "Abre la sugerencia, asígnala al equipo y mide el impacto real.",
      icon: CheckCircle2
    }
  ];
  const decisionChecklist = [
    {
      label: "Problema detectado",
      value: primarySuggestion?.text ?? "Aún no hay datos suficientes para detectar una prioridad."
    },
    {
      label: "Impacto esperado",
      value: primarySuggestion?.impact ?? formatCopCompact(aiImpactLift)
    },
    {
      label: "Siguiente acción",
      value: primarySuggestion?.id ? "Abrir la sugerencia, revisar evidencia y asignar responsable." : "Carga datos y genera tu primera lectura IA."
    }
  ];

  return (
    <>
      <section className="ai-command-home dashboard-module-section" data-active={isActive} aria-label="Inicio Copiloto AI">
        <div className="ai-command-main">
          <article className="ai-command-hero" data-status={overallStatusTone}>
            <div className="ai-command-copy">
              <span className="ai-command-eyebrow"><Sparkles aria-hidden="true" />Motor de sugerencias OpenAI</span>
              <h2>{hasSuggestions ? "Decide qué hacer hoy con evidencia de tu PYME" : "Activa tu primer centro de decisiones con IA"}</h2>
              <p>{hasSuggestions ? "Inicio reúne ventas, caja, inventario y clientes para convertirlos en una decisión priorizada, con impacto estimado y una acción concreta para ejecutar." : "Registra o importa datos reales y Copiloto Pyme usará OpenAI para detectar riesgos, oportunidades y decisiones importantes antes de que se vuelvan problemas."}</p>
              <div className="ai-command-meta">
                <span><Clock3 aria-hidden="true" />{dateRangeLabel}</span>
                <span data-status={overallStatusTone}>{overallStatus}</span>
                <span><Database aria-hidden="true" />{hasBusinessData ? hasRealAiSuggestions ? "Datos reales conectados" : "Datos cargados" : "Sin datos cargados"}</span>
              </div>
              <div className="ai-command-actions">
                <button className="primary-button ai-command-action" type="button" onClick={onGenerateAiDecisions} disabled={isGeneratingAi}>
                  {isGeneratingAi ? "Analizando datos..." : hasSuggestions ? "Generar nueva lectura IA" : "Generar sugerencias IA"} <ArrowRight aria-hidden="true" />
                </button>
                <button className="secondary-button ai-command-secondary" type="button" onClick={onRefreshSuggestions}>
                  Actualizar sugerencias
                </button>
              </div>
            </div>

            <div className="ai-decision-stack" aria-label="Flujo de decisión">
              <span className="ai-orb-mini"><Sparkles aria-hidden="true" /></span>
              <div>
                <small>Entrada</small>
                <strong>Ventas · Caja · Inventario · Clientes</strong>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <small>OpenAI analiza</small>
                <strong>Riesgo · Impacto · Prioridad</strong>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <small>Salida</small>
                <strong>Decisión clara para hoy</strong>
              </div>
            </div>

            <article className="ai-priority-card" data-tone={primarySuggestion?.tone ?? "priority"}>
              <span className="ai-priority-badge">{primarySuggestion?.label ?? "Esperando lectura IA"}</span>
              <div className="ai-priority-title">
                <span><PrimaryIcon aria-hidden="true" /></span>
                <div>
                  <strong>{primarySuggestion?.title ?? "Genera tu primera decisión inteligente"}</strong>
                  <small>{primarySuggestion?.text ?? "Copiloto Pyme necesita datos operativos para entregar recomendaciones accionables."}</small>
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
              {primarySuggestion?.id ? <a href={`/dashboard/suggestions/${primarySuggestion.id}`}>Abrir detalle y asignar</a> : null}
            </article>
          </article>

          <article className="ai-process-panel">
            <div className="ai-section-heading">
              <strong>Cómo sacar provecho al motor de sugerencias</strong>
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

          <section className="ai-decision-grid" aria-label="Lectura de la decisión recomendada">
            <article className="ai-decision-card">
              <div className="ai-section-heading">
                <strong>Lectura ejecutiva de la decisión</strong>
                <span>{aiSuggestionsStatus}</span>
              </div>
              <div className="ai-decision-checklist">
                {decisionChecklist.map((item, index) => (
                  <div key={item.label}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="ai-impact-summary-panel">
              <div className="ai-section-heading">
                <strong>Impacto por tipo de decisión</strong>
                <span>{hasRealAiSuggestions ? "Calculado desde sugerencias reales" : "Listo para medir cuando haya sugerencias"}</span>
              </div>
              <div className="ai-impact-summary-grid">
                {impactCards.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div className="ai-impact-summary-item" data-tone={item.tone} key={item.type}>
                      <span><Icon aria-hidden="true" /></span>
                      <div>
                        <strong>{formatCopCompact(item.value)}</strong>
                        <small>{item.label}</small>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          </section>
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

          <article className="ai-category-panel">
            <div className="ai-section-heading">
              <strong>Prioridades por módulo</strong>
              <span>Ventas, caja, inventario y clientes reportan aquí</span>
            </div>
            <div className="ai-category-list">
              {aiImpactCategories.length ? aiImpactCategories.map((category) => {
                const Icon = category.icon;
                const width = Math.max(8, Math.round((category.impactTotal / aiCategoryMaxImpact) * 100));
                return (
                  <button type="button" className="ai-category-row" data-tone={category.tone} key={category.label} onClick={onShowAllCategories}>
                    <span><Icon aria-hidden="true" /></span>
                    <div>
                      <strong>{category.label}</strong>
                      <small>{category.count} sugerencia(s) · {category.tag}</small>
                      <em style={{ width: `${width}%` }} />
                    </div>
                    <b>{formatCopCompact(category.impactTotal)}</b>
                  </button>
                );
              }) : (
                <div className="ai-category-empty">
                  <Target aria-hidden="true" />
                  <strong>Sin prioridades todavía</strong>
                  <small>Genera una lectura IA para ver qué módulo requiere acción primero.</small>
                </div>
              )}
            </div>
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

      <section className="ai-suggestion-board dashboard-module-section" data-active={isActive} aria-label="Decisiones listas para revisar">
        <div className="ai-section-heading ai-board-heading">
          <strong>Decisiones listas para revisar</strong>
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

      <section className="ai-activity-decision-panel dashboard-module-section" data-active={isActive} aria-label="Actividad reciente de sugerencias IA">
        <div className="ai-section-heading ai-board-heading">
          <strong>Actividad reciente del motor IA</strong>
          <button className="ghost-button" type="button" onClick={onRefreshActivity}>Actualizar actividad <ArrowRight aria-hidden="true" /></button>
        </div>
        <div className="ai-activity-decision-list">
          {aiActivity.length ? aiActivity.slice(0, 4).map((item) => {
            const Icon = item.icon;
            return (
              <a className="ai-activity-decision-item" data-tone={item.tone} href={item.href || "#"} key={item.id}>
                <span><Icon aria-hidden="true" /></span>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>
                <em>{item.time}</em>
              </a>
            );
          }) : (
            <div className="ai-activity-empty">
              <ClipboardCheck aria-hidden="true" />
              <strong>Sin actividad IA reciente</strong>
              <small>{activityStatus}</small>
            </div>
          )}
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
