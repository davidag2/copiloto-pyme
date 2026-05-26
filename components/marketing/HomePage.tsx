import { BarChart3, Brain, CheckCircle2, ClipboardCheck, Database, PackageCheck, Sparkles, Users, WalletCards, Zap } from "lucide-react";
import { Hero } from "./Hero";
import { PricingCard } from "./PricingCard";
import { commercialPlans } from "@/lib/plans";

const clients = ["Café Oriente", "Marketú", "Ferremax", "Dulce Hogar", "AgroAndes", "Punto Clean"];

const steps = [
  {
    icon: Database,
    label: "Paso 1",
    title: "Registras lo que pasa",
    text: "Ventas, movimientos de caja, inventario, clientes y pagos."
  },
  {
    icon: Brain,
    label: "Paso 2",
    title: "La IA cruza la información",
    text: "Detecta patrones, riesgos, oportunidades y cambios importantes."
  },
  {
    icon: ClipboardCheck,
    label: "Paso 3",
    title: "Inicio te dice qué hacer",
    text: "Recibes una decisión clara, con prioridad, impacto y acción recomendada."
  }
];

const modules = [
  {
    icon: BarChart3,
    title: "Ventas",
    text: "Registra ventas, productos, canales, vendedores, descuentos, pagos pendientes y comportamiento comercial."
  },
  {
    icon: WalletCards,
    title: "Caja",
    text: "Controla ingresos, egresos, cuentas por cobrar, pagos próximos, bancos y flujo disponible."
  },
  {
    icon: PackageCheck,
    title: "Inventario",
    text: "Administra productos, stock, bodegas, movimientos, compras y riesgos de quiebre."
  },
  {
    icon: Users,
    title: "Clientes",
    text: "Un CRM simple para gestionar contactos, seguimiento, recompra, clientes frecuentes e inactivos."
  }
];

const benefits = [
  "Menos tiempo cruzando hojas y reportes",
  "Riesgos visibles antes de perder dinero",
  "Acciones claras para ventas, administración y operaciones",
  "Un panel diario para tomar mejores decisiones"
];

export function HomePage() {
  return (
    <>
      <Hero />

      <section className="mkt-logo-strip" aria-label="Clientes">
        <p>PYMES que ya administran mejor su operación con Copiloto Pyme</p>
        <div>
          {clients.map((client) => <span key={client}>{client}</span>)}
        </div>
      </section>

      <section className="mkt-process-section">
        <div className="mkt-process-copy">
          <span><Zap aria-hidden="true" />Cómo funciona</span>
          <h2>De operación diaria a decisiones inteligentes</h2>
          <p>Los módulos operativos alimentan Inicio. Copiloto Pyme cruza la información y convierte los datos de tu empresa en riesgo, impacto, prioridad y siguiente acción.</p>
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
          <span>Operación conectada</span>
          <h2>Cada módulo administra una parte de tu empresa</h2>
          <p>Ventas, Caja, Inventario y Clientes no son módulos aislados. Cada dato registrado alimenta a Inicio, donde la IA convierte la operación de tu PYME en decisiones diarias.</p>
        </div>
        <div className="mkt-module-grid">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title}>
                <Icon aria-hidden="true" />
                <strong>{module.title}</strong>
                <p>{module.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mkt-home-features">
        <div className="mkt-section-heading">
          <span>Resultado</span>
          <h2>Inicio es el centro de decisiones de tu PYME</h2>
          <p>Abres el panel, ves las métricas importantes y recibes una recomendación accionable para el día: qué revisar, qué riesgo atender y a quién asignarlo.</p>
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
          <p>Antes revisábamos datos por horas. Ahora Copiloto Pyme nos dice qué acción tomar, qué riesgo atender primero y cómo mantener la operación bajo control.</p>
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
          <span>Planes para operar mejor</span>
          <h2>Empieza con 1 mes gratis y escala el acceso de tu equipo</h2>
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
        <span><Sparkles aria-hidden="true" />Listo para administrar con IA</span>
        <h2>Convierte tu PYME en un negocio administrado con IA</h2>
        <p>Deja de perseguir datos sueltos. Registra tu operación, conecta tus módulos y recibe decisiones diarias desde Inicio.</p>
        <div>
          <a className="mkt-button primary large" href="/register?plan=go">Probar 1 mes gratis</a>
          <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
        </div>
      </section>
    </>
  );
}
