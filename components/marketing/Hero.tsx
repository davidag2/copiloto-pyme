import { ArrowRight, BarChart3, Bot, CheckCircle2, Database, ShieldCheck, Users } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { MetricCard } from "./MetricCard";

export function Hero() {
  const bullets = [
    "Entiende tu negocio en segundos",
    "Detecta problemas antes de que crezcan",
    "Recibe una decisión clara cada día"
  ];

  return (
    <section className="mkt-hero">
      <div className="mkt-hero-copy">
        <span className="mkt-eyebrow"><Bot aria-hidden="true" />IA para PYMES</span>
        <h1>La IA que te ayuda a administrar y tomar decisiones en tu PYME</h1>
        <p>Copiloto Pyme analiza tus ventas, caja e inventario y te muestra qué está pasando, qué riesgo viene y qué acción debes tomar hoy para no perder dinero.</p>
        <div className="mkt-bullets">
          {bullets.map((item) => (
            <span key={item}><CheckCircle2 aria-hidden="true" />{item}</span>
          ))}
        </div>
        <div className="mkt-hero-actions">
          <a className="mkt-button primary large" href="/register"><ArrowRight aria-hidden="true" />Empezar gratis</a>
          <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
        </div>
        <small>Sin tarjeta · Configuración en minutos</small>
        <div className="mkt-trust-pills">
          <span><Database aria-hidden="true" />Datos por empresa</span>
          <span><Users aria-hidden="true" />Roles por equipo</span>
          <span><ShieldCheck aria-hidden="true" />IA accionable</span>
        </div>
      </div>
      <div className="mkt-hero-visual">
        <DashboardMockup />
        <div className="mkt-metrics">
          <MetricCard value="10 seg" label="Lectura diaria" />
          <MetricCard value="+12 días" label="Proyección de caja" />
          <MetricCard value="COP" label="Planes para Colombia" />
        </div>
      </div>
    </section>
  );
}
