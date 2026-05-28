"use client";

import { Brain, CalendarDays, ChevronRight, Clock3, LineChart, Sparkles, Target, TrendingUp, WalletCards } from "lucide-react";

type Metrics = {
  sales: number;
  cash: number;
  margin: number;
  criticalStock: number;
};

type ProjectionPoint = {
  day: string;
  actual: number;
  cash: number;
  margin: number;
  criticalStock: number;
};

type ProjectionsModuleProps = {
  isActive: boolean;
  hasBusinessData: boolean;
  dateRangeLabel: string;
  metrics: Metrics;
  chartData: ProjectionPoint[];
  isGeneratingAi: boolean;
  onGenerateProjection: () => void;
  formatMoney: (value: number) => string;
};

function projectionPath(values: number[], height = 88) {
  const max = Math.max(...values, 1);
  const step = 220 / Math.max(values.length - 1, 1);
  return values.map((value, index) => {
    const x = 12 + index * step;
    const y = height - (value / max) * (height - 18) + 8;
    return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

export function ProjectionsModule({
  isActive,
  hasBusinessData,
  dateRangeLabel,
  metrics,
  chartData,
  isGeneratingAi,
  onGenerateProjection,
  formatMoney
}: ProjectionsModuleProps) {
  const salesProjection = hasBusinessData ? Math.round(metrics.sales * 1.08) : 0;
  const cashProjection = hasBusinessData ? Math.max(0, Math.round((metrics.cash / 1_000_000) * 1.04)) : 0;
  const marginProjection = hasBusinessData ? Number((metrics.margin + 1.2).toFixed(1)) : 0;
  const stockRiskProjection = hasBusinessData ? Math.max(0, metrics.criticalStock - 1) : 0;
  const values = hasBusinessData && chartData.length ? chartData.map((point) => point.actual) : [0, 0, 0, 0, 0, 0, 0];
  const projectedValues = hasBusinessData ? values.map((value, index) => Number((value * (1.03 + index * 0.015)).toFixed(1))) : values;

  return (
    <section className="projections-command-center dashboard-module-section" data-active={isActive}>
      <header className="projections-page-heading">
        <div>
          <h2>Proyecciones</h2>
          <p>Usa la IA para anticipar tendencias, riesgos y resultados esperados de tu PYME.</p>
        </div>
        <button className="primary-button" type="button" onClick={onGenerateProjection} disabled={isGeneratingAi}>
          <Sparkles aria-hidden="true" />
          {isGeneratingAi ? "Analizando..." : "Generar proyección IA"}
        </button>
      </header>

      <div className="projections-hero-grid">
        <article className="projections-ai-card">
          <span><Brain aria-hidden="true" /> Motor predictivo OpenAI</span>
          <h3>{hasBusinessData ? "La IA puede proyectar qué pasará si mantienes el ritmo actual." : "Proyecciones empieza en cero: carga datos para activar predicciones reales."}</h3>
          <p>
            Copiloto cruza ventas, caja, inventario y clientes para estimar escenarios probables,
            detectar desviaciones y recomendar acciones antes de que el resultado se vea en el cierre.
          </p>
          <div>
            <small><CalendarDays aria-hidden="true" /> Base: {dateRangeLabel}</small>
            <small><Clock3 aria-hidden="true" /> Horizonte: próximos 30 días</small>
          </div>
        </article>

        <article className="projections-chart-card">
          <header>
            <strong>Tendencia esperada</strong>
            <span>{hasBusinessData ? "Basada en datos actuales" : "Sin datos cargados"}</span>
          </header>
          <svg viewBox="0 0 260 110" aria-label="Gráfico de proyección">
            <path d={projectionPath(values)} fill="none" stroke="#94a3b8" strokeDasharray="7 8" strokeWidth="4" />
            <path d={projectionPath(projectedValues)} fill="none" stroke="#2563eb" strokeWidth="5" />
            <circle cx="236" cy={hasBusinessData ? 24 : 88} r="7" fill="#22c55e" />
          </svg>
          <p className="module-empty-note">
            {hasBusinessData ? "La curva azul muestra el escenario esperado si se mantiene el comportamiento reciente." : "El gráfico se activará cuando cargues ventas, caja, inventario o clientes."}
          </p>
        </article>
      </div>

      <div className="projections-kpi-grid">
        <article><TrendingUp aria-hidden="true" /><small>Ventas proyectadas</small><strong>{formatMoney(salesProjection)}</strong><span>Próximos 30 días</span></article>
        <article><WalletCards aria-hidden="true" /><small>Caja estimada</small><strong>{cashProjection} días</strong><span>Cobertura esperada</span></article>
        <article><Target aria-hidden="true" /><small>Margen esperado</small><strong>{marginProjection}%</strong><span>Resultado probable</span></article>
        <article><LineChart aria-hidden="true" /><small>Riesgos de stock</small><strong>{stockRiskProjection}</strong><span>Productos a vigilar</span></article>
      </div>

      <div className="projections-bottom-grid">
        <section className="projections-scenarios-card">
          <header><strong>Escenarios que evaluará la IA</strong></header>
          <article><b>Conservador</b><p>Qué pasa si ventas bajan, caja se ajusta o inventario rota más lento.</p></article>
          <article><b>Esperado</b><p>Resultado probable si el negocio mantiene el comportamiento actual.</p></article>
          <article><b>Optimista</b><p>Potencial si ejecutas las mejores recomendaciones de Copiloto.</p></article>
        </section>

        <section className="projections-actions-card">
          <header><strong>Acciones recomendadas</strong></header>
          <p className="module-empty-note">
            {hasBusinessData ? "Genera una proyección IA para convertir las tendencias en decisiones accionables." : "Primero carga información en Ventas, Caja, Inventario o Clientes para recibir acciones reales."}
          </p>
          <button className="secondary-button" type="button" onClick={onGenerateProjection} disabled={isGeneratingAi}>
            Ver decisiones proyectadas <ChevronRight aria-hidden="true" />
          </button>
        </section>
      </div>
    </section>
  );
}
