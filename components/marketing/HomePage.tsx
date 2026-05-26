import { BarChart3, Brain, CheckCircle2, ClipboardCheck, Database, Sparkles, Zap } from "lucide-react";
import { Hero } from "./Hero";
import { PricingCard } from "./PricingCard";
import { commercialPlans } from "@/lib/plans";

const clients = ["Café Oriente", "Marketú", "Ferremax", "Dulce Hogar", "AgroAndes", "Punto Clean"];

const steps = [
  {
    icon: Database,
    label: "Paso 1",
    title: "Conectas tus datos",
    text: "Ventas, caja e inventario en un solo lugar."
  },
  {
    icon: Brain,
    label: "Paso 2",
    title: "La IA analiza",
    text: "Detecta cambios importantes, riesgos y oportunidades."
  },
  {
    icon: ClipboardCheck,
    label: "Paso 3",
    title: "Recibes una decisión",
    text: "Te dice qué hacer hoy y cuál será el impacto."
  }
];

const benefits = [
  "Menos tiempo revisando reportes",
  "Alertas antes de perder dinero",
  "Decisiones claras para el equipo",
  "Planes hechos para Colombia"
];

export function HomePage() {
  return (
    <>
      <Hero />

      <section className="mkt-logo-strip" aria-label="Clientes">
        <p>PYMES que ya toman mejores decisiones con Copiloto Pyme</p>
        <div>
          {clients.map((client) => <span key={client}>{client}</span>)}
        </div>
      </section>

      <section className="mkt-process-section">
        <div className="mkt-process-copy">
          <span><Zap aria-hidden="true" />Cómo funciona</span>
          <h2>De tus datos a decisiones claras, en 3 simples pasos</h2>
          <p>La plataforma toma la información diaria de tu negocio y la convierte en acciones concretas para vender más, cuidar la caja y evitar quiebres de inventario.</p>
        </div>
        <div className="mkt-process-grid">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.title}>
                <div><Icon aria-hidden="true" /></div>
                <small>{step.label}</small>
                <strong>{step.title}</strong>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mkt-home-features">
        <div className="mkt-section-heading">
          <span>Todo lo que necesitas</span>
          <h2>Una forma más simple de administrar tu PYME</h2>
          <p>Copiloto Pyme une la lectura ejecutiva, las alertas y las acciones sugeridas en una experiencia clara para dueños y equipos pequeños.</p>
        </div>
        <div className="mkt-benefit-grid">
          {benefits.map((benefit) => (
            <article key={benefit}>
              <CheckCircle2 aria-hidden="true" />
              <span>{benefit}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="mkt-testimonial-section">
        <div className="mkt-quote-card">
          <span>“</span>
          <p>Antes revisábamos datos por horas. Ahora Copiloto Pyme nos dice qué acción tomar y qué riesgo atender primero.</p>
          <strong>Andrés Vélez</strong>
          <small>Gerente, Café Oriente</small>
        </div>
        <div className="mkt-testimonial-dashboard">
          <div><span>Ventas</span><strong>$2.850.000</strong><i className="bars blue" /></div>
          <div><span>Caja</span><strong>18 días</strong><i className="line green" /></div>
          <p>Decisión recomendada: <strong>Reponer Panela Orgánica hoy</strong></p>
        </div>
      </section>

      <section className="mkt-home-pricing">
        <div className="mkt-section-heading">
          <span>Planes que se adaptan a tu negocio</span>
          <h2>Empieza con 1 mes gratis y escala cuando lo necesites</h2>
        </div>
        <div className="mkt-pricing-grid">
          {commercialPlans.map((plan) => (
            <PricingCard
              badge={plan.badge}
              cta="Probar 1 mes gratis"
              features={plan.features}
              highlighted={plan.highlighted}
              href={plan.href}
              key={plan.name}
              name={plan.name}
              price={plan.priceLabel}
            />
          ))}
        </div>
      </section>

      <section className="mkt-final-cta">
        <span><Sparkles aria-hidden="true" />Listo para decidir mejor</span>
        <h2>Convierte los datos de tu PYME en decisiones diarias</h2>
        <div>
          <a className="mkt-button primary large" href="/register?plan=go">Probar 1 mes gratis</a>
          <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
        </div>
      </section>
    </>
  );
}
