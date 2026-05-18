"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Database,
  RefreshCw,
  Sparkles,
  Target
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

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
  aiImpactSummaryCards,
  aiImpactLift,
  hasRealAiSuggestions,
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
  onRefreshSuggestions,
  onShowAllCategories,
  onRefreshActivity,
  formatCopCompact,
  formatMoney
}: DashboardHomeProps) {
  const totalActiveCategories = aiImpactCategories.reduce((total, item) => total + item.count, 0);

  return (
    <>
      <section className="ai-home-hero dashboard-module-section" data-active={isActive} data-status={overallStatusTone} aria-label="Inicio Copiloto AI">
        <div className="ai-home-copy">
          <span className="ai-home-eyebrow"><Sparkles aria-hidden="true" />Copiloto AI</span>
          <h2>Tu negocio, mejor cada día.</h2>
          <strong>Sugerencias inteligentes para hoy</strong>
          <p>Analizamos ventas, caja e inventario para mostrarte la prioridad del día, el impacto esperado y la acción exacta que debe ejecutar tu equipo.</p>
          <div className="ai-home-meta">
            <span><Clock3 aria-hidden="true" />{dateRangeLabel}</span>
            <span data-status={overallStatusTone}>{overallStatus}</span>
            <span><Database aria-hidden="true" />{kpiSourceStatus}</span>
            <span><Database aria-hidden="true" />{aiSuggestionsStatus}</span>
          </div>
          <button className="primary-button ai-home-action" type="button" onClick={onRefreshSuggestions}>
            <Sparkles aria-hidden="true" />Actualizar sugerencias <ArrowRight aria-hidden="true" />
          </button>
        </div>
        <div className="ai-suggestion-grid">
          {aiSuggestions.map((suggestion) => {
            const Icon = suggestion.icon;
            return (
              <article className="ai-suggestion-card" data-tone={suggestion.tone} key={suggestion.title}>
                <div className="ai-suggestion-top">
                  <span className="ai-suggestion-icon"><Icon aria-hidden="true" /></span>
                  <span className="ai-suggestion-label">{suggestion.label}</span>
                  <ArrowRight aria-hidden="true" />
                </div>
                <strong>{suggestion.title}</strong>
                <p>{suggestion.text}</p>
                <small>Impacto estimado</small>
                <b>{suggestion.impact}</b>
                {suggestion.id ? <a className="ai-suggestion-detail-link" href={`/dashboard/suggestions/${suggestion.id}`}>Ver detalle</a> : null}
              </article>
            );
          })}
        </div>
        <div className="ai-home-kpi-row" aria-label="Datos rápidos de Inicio">
          {aiHomeKpis.map((item) => {
            const Icon = item.icon;
            return (
              <article className="ai-home-kpi-card" data-tone={item.tone} key={item.label}>
                <div>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.helper}</small>
                  <em>{item.delta}</em>
                </div>
                <Icon aria-hidden="true" />
                <MiniSparkline data={item.trend} tone={item.tone} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="ai-impact-section dashboard-module-section" data-active={isActive} aria-label="Impacto de las sugerencias AI">
        <article className="ai-impact-chart-card">
          <div className="panel-heading">
            <div>
              <span><Sparkles aria-hidden="true" />Impacto de las sugerencias AI</span>
              <h2>Si aplicas las sugerencias de alta prioridad, podrías lograr:</h2>
            </div>
          </div>
          <div className="ai-impact-summary">
            {aiImpactSummaryCards.map((item) => {
              const Icon = item.icon;
              return (
                <div data-tone={item.tone} key={item.type}>
                  <Icon aria-hidden="true" />
                  <strong>{item.value ? formatCopCompact(item.value) : "$0"}</strong>
                  <span>{item.label}</span>
                  <small>{item.helper}</small>
                </div>
              );
            })}
          </div>
          <div className="ai-impact-total">
            <span>Impacto total estimado</span>
            <strong>{formatCopCompact(aiImpactLift)}</strong>
            <small>{hasRealAiSuggestions ? "Calculado desde PostgreSQL" : "Estimado demo hasta conectar datos"}</small>
          </div>
          <div className="ai-impact-chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={aiImpactData} margin={{ top: 8, right: 18, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value}M`} />
                <Tooltip formatter={(value, name) => [formatMoney(Number(value ?? 0)), String(name)]} />
                <Line type="monotone" dataKey="actual" name="Ventas actuales" stroke="#6d5dfc" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="withAi" name="Con sugerencias AI" stroke="#22c55e" strokeWidth={3} strokeDasharray="6 6" dot={false} />
                <Legend />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ai-impact-side-card">
          <div className="panel-heading">
            <div><span><Target aria-hidden="true" />Sugerencias por categoría</span><h2>Prioriza dónde actuar</h2></div>
            <button className="ghost-button" type="button" onClick={onShowAllCategories}>Ver todas</button>
          </div>
          <div className="ai-category-panel-summary">
            <strong>{totalActiveCategories}</strong>
            <span>categorías con sugerencias activas</span>
            <small>{hasRealAiSuggestions ? "Datos desde PostgreSQL" : "Vista demo sin datos cargados"}</small>
          </div>
          <div className="ai-category-list" aria-label="Sugerencias agrupadas por categoría">
            {aiImpactCategories.map((category) => {
              const Icon = category.icon;
              return (
                <div className="ai-category-row" data-tone={category.tone} key={category.label}>
                  <div className="ai-category-main">
                    <span><Icon aria-hidden="true" />{category.label}</span>
                    <strong>{category.count} sugerencia(s)</strong>
                    <small>{category.tag}</small>
                  </div>
                  <div className="ai-category-impact">
                    <strong>{formatCopCompact(category.impactTotal)}</strong>
                    <em>impacto</em>
                  </div>
                  <div className="ai-category-progress" aria-hidden="true">
                    <span style={{ width: `${Math.max(8, (category.impactTotal / aiCategoryMaxImpact) * 100)}%` }} />
                  </div>
                  {category.firstSuggestionId ? <a href={`/dashboard/suggestions/${category.firstSuggestionId}`}>Abrir</a> : null}
                </div>
              );
            })}
          </div>
          <div className="ai-impact-footnote">
            <Sparkles aria-hidden="true" />
            <span>{totalActiveCategories} sugerencias activas</span>
            <small>Actualizadas hoy a las 8:30 a. m.</small>
          </div>
        </article>

        <article className="ai-impact-side-card">
          <div className="panel-heading">
            <div><span><Clock3 aria-hidden="true" />Actividad reciente de AI</span><h2>Últimas señales</h2></div>
            <button className="secondary-button compact-button" type="button" onClick={onRefreshActivity}>
              <RefreshCw aria-hidden="true" />Actualizar
            </button>
          </div>
          <div className="ai-activity-list">
            {aiActivity.map((activity) => {
              const Icon = activity.icon;
              return (
                <div className="ai-activity-item" data-tone={activity.tone} key={activity.id}>
                  <span><Icon aria-hidden="true" /></span>
                  <div><strong>{activity.title}</strong><small>{activity.text}</small></div>
                  <div className="ai-activity-meta">
                    <time>{activity.time}</time>
                    {activity.href ? <a href={activity.href}>Ver</a> : null}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="ai-activity-status">{activityStatus}</p>
        </article>
      </section>

      <section className="setup-summary dashboard-module-section" data-active={isActive}>
        <div><span>Empresa / tenant</span><strong>{companyId ? `ID ${tenantShortId}` : "Demo local"}</strong></div>
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
