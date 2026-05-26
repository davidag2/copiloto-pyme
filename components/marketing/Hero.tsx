import { ArrowRight, BarChart3, Bot, CheckCircle2, Database, ShieldCheck, Users } from "lucide-react";
import { DashboardMockup } from "./DashboardMockup";
import { MetricCard } from "./MetricCard";

export function Hero() {
  const bullets = [
    "Registra la operación diaria de tu empresa",
    "Une ventas, caja, inventario y clientes en una sola vista",
    "Recibe decisiones claras con impacto estimado"
  ];

  return (
    <section className="mkt-hero">
      <div className="mkt-hero-copy">
        <span className="mkt-eyebrow"><Bot aria-hidden="true" />Sistema operativo con IA</span>
        <h1>El sistema operativo para administrar tu <span>PYME con IA</span></h1>
        <p>Copiloto Pyme reúne tus ventas, caja, inventario y clientes en un solo lugar. La IA revisa esos datos por ti y te dice qué problema atender, qué oportunidad aprovechar y qué hacer hoy para vender más y perder menos dinero.</p>
        <div className="mkt-bullets">
          {bullets.map((item) => (
            <span key={item}><CheckCircle2 aria-hidden="true" />{item}</span>
          ))}
        </div>
        <div className="mkt-hero-actions">
          <a className="mkt-button primary large" href="/register?plan=go"><ArrowRight aria-hidden="true" />Probar 1 mes gratis</a>
          <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
        </div>
        <small>Sin tarjeta · Configuración en minutos · Planes en COP</small>
        <div className="mkt-trust-pills">
          <span><Database aria-hidden="true" />Datos por empresa</span>
          <span><Users aria-hidden="true" />Roles por equipo</span>
          <span><ShieldCheck aria-hidden="true" />IA accionable</span>
        </div>
      </div>
      <div className="mkt-hero-visual">
        <DashboardMockup />
        <div className="mkt-metrics">
          <MetricCard value="10 seg" label="Lectura ejecutiva" />
          <MetricCard value="+12 días" label="Proyección de caja" />
          <MetricCard value="4 módulos" label="Operación conectada" />
        </div>
      </div>
    </section>
  );
}
