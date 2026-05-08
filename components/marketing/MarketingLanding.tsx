"use client";

import { AlertTriangle, ArrowRight, BarChart3, Brain, ClipboardCheck, Database, Eye, LockKeyhole, MessageSquareText, ShieldCheck, Sparkles, Users } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { FeatureCard } from "./FeatureCard";
import { Footer } from "./Footer";
import { Header, type MarketingPageKey } from "./Header";
import { Hero } from "./Hero";
import { PricingCard } from "./PricingCard";

type MarketingLandingProps = {
  activePage?: MarketingPageKey;
  theme?: "light" | "dark";
  onToggleTheme?: () => void;
};

const commercialPlans = [
  {
    name: "Go",
    price: "COP $20.000 / mes",
    href: "/register?plan=go",
    features: ["1 mes gratis", "Lectura diaria con IA", "Ventas, caja e inventario", "Alertas básicas"]
  },
  {
    name: "Basic",
    price: "COP $50.000 / mes",
    href: "/register?plan=basic",
    badge: "Más popular",
    highlighted: true,
    features: ["1 mes gratis", "Todo lo del plan Go", "Proyección de caja", "Alertas inteligentes", "Soporte estándar"]
  },
  {
    name: "Pro",
    price: "COP $100.000 / mes",
    href: "/register?plan=pro",
    features: ["1 mes gratis", "Todo lo del plan Basic", "Roles de equipo", "Reporte semanal", "Prioridad en soporte"]
  }
];

export function MarketingLanding({ activePage = "inicio", theme, onToggleTheme }: MarketingLandingProps) {
  const [localTheme, setLocalTheme] = useState<"light" | "dark">("light");
  const activeTheme = theme ?? localTheme;
  const toggleTheme = onToggleTheme ?? (() => setLocalTheme((value) => value === "dark" ? "light" : "dark"));

  return (
    <div className={`mkt-page theme-${activeTheme}`}>
      <Header activePage={activePage} theme={activeTheme} onToggleTheme={toggleTheme} />
      <main>
        {activePage === "inicio" && (
          <>
            <Hero />
            <section className="mkt-logo-strip" aria-label="Clientes">
              <p>PYMES que ya toman mejores decisiones con Copiloto Pyme</p>
              <div>
                {["Café Oriente", "Marketú", "Ferremax Soluciones", "Dulce Hogar", "AgroAndes", "Punto Clean"].map((logo) => <span key={logo}>{logo}</span>)}
              </div>
            </section>

            <section className="mkt-process-section">
              <div className="mkt-process-copy">
                <span>Así funciona</span>
                <h2>De tus datos a decisiones claras, en 3 simples pasos</h2>
              </div>
              <div className="mkt-process-grid">
                {[
                  { title: "Conectas tus datos", text: "Trae tus ventas, caja e inventario a un solo lugar.", icon: Database },
                  { title: "La IA analiza", text: "Detecta patrones, riesgos y oportunidades.", icon: Brain },
                  { title: "Recibes una decisión", text: "Te dice qué hacer hoy y cuál será el impacto.", icon: ClipboardCheck }
                ].map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <article key={step.title}>
                      <div><Icon aria-hidden="true" /></div>
                      <strong>{index + 1}. {step.title}</strong>
                      <p>{step.text}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mkt-infographic-section" aria-label="Infografía de cómo funciona Copiloto Pyme">
              <img
                alt="Infografía: así funciona Copiloto Pyme en tres pasos, conectas tus datos, la IA analiza y recibes una decisión"
                src="/images/infografia-como-funciona-copiloto-pyme.png"
              />
            </section>

            <section className="mkt-infographic-section" aria-label="Infografía antes y después de usar Copiloto Pyme">
              <img
                alt="Infografía: de revisar datos a tomar decisiones con Copiloto Pyme, comparando antes y después"
                src="/images/infografia-antes-despues-copiloto-pyme.png"
              />
            </section>

            <section className="mkt-home-features">
              <div className="mkt-section-heading">
                <span>Todo lo que necesitas</span>
                <h2>Una plataforma diseñada para PYMES que quieren crecer</h2>
              </div>
              <div className="mkt-feature-grid">
                <FeatureCard icon={BarChart3} title="Visión completa" text="Ventas, caja e inventario en un solo lugar." />
                <FeatureCard icon={ShieldCheck} title="Alertas inteligentes" text="Detecta riesgos antes de que afecten tu negocio." />
                <FeatureCard icon={Users} title="Acciones claras" text="La IA te dice qué hacer y a quién asignarlo." />
                <FeatureCard icon={LockKeyhole} title="Seguridad y privacidad" text="Tus datos están separados por empresa y protegidos." />
              </div>
            </section>

            <section className="mkt-testimonial-section">
              <div className="mkt-quote-card">
                <span>“</span>
                <p>Copiloto Pyme nos cambió la forma de trabajar. Ahora sabemos qué hacer cada día y nuestras decisiones son mucho mejores.</p>
                <strong>Andrés Vélez</strong>
                <small>Gerente, Café Oriente</small>
              </div>
              <div className="mkt-testimonial-dashboard">
                <div><span>Ventas</span><strong>$2.850.000</strong><i className="bars blue" /></div>
                <div><span>Caja</span><strong>18 días</strong><i className="line green" /></div>
                <p><ShieldCheck aria-hidden="true" />Decisión recomendada: <strong>Reponer Panela Orgánica hoy</strong></p>
              </div>
            </section>

            <section className="mkt-home-pricing">
              <div className="mkt-section-heading">
                <span>Precios simples y justos</span>
                <h2>Elige el plan que se adapta a tu PYME</h2>
                <p>Todos los planes incluyen 1 mes gratis. Cancelas cuando quieras. Sin letras pequeñas.</p>
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
                    price={plan.price}
                  />
                ))}
              </div>
              <a className="mkt-link-button" href="/precio">Ver todos los planes <ArrowRight aria-hidden="true" /></a>
            </section>

            <section className="mkt-assurance-strip" aria-label="Garantías">
              <span>1 mes gratis en todos los planes</span>
              <span>Sin tarjeta de crédito</span>
              <span>Configuración en minutos</span>
              <span>Soporte humano</span>
              <span>100% seguro</span>
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
        )}

        {activePage === "ventajas" && (
          <section className="mkt-section mkt-single-section">
            <div className="mkt-section-heading">
              <span>Ventajas</span>
              <h2>Así te ayuda Copiloto Pyme</h2>
            </div>
            <div className="mkt-feature-grid">
              <FeatureCard icon={Eye} title="Ve todo claro" text="Sabes cuánto vendes, cuánto tienes y qué está pasando." />
              <FeatureCard icon={AlertTriangle} title="Te avisa problemas" text="Te dice antes si algo se va a acabar o si algo va mal." />
              <FeatureCard icon={ClipboardCheck} title="Te dice qué hacer" text="No tienes que pensar mucho. Te dice la siguiente acción." />
            </div>
            <div className="mkt-advantages-story">
              <div className="mkt-section-heading">
                <span>Claridad operativa</span>
                <h2>La IA conecta las señales importantes de tu empresa</h2>
                <p>Copiloto Pyme une ventas, caja, inventario y alertas para que el propietario no tenga que perseguir datos en varias herramientas. La ventaja es simple: menos revisión manual y más decisiones correctas en el momento adecuado.</p>
              </div>
              <section className="mkt-infographic-section" aria-label="Infografía sobre cómo la IA entiende cada parte del negocio">
                <img
                  alt="Infografía: la IA entiende ventas, caja, inventario y alertas para entregar una sola inteligencia de negocio"
                  src="/images/infografia-ia-entiende-negocio-copiloto-pyme.png"
                />
              </section>
              <div className="mkt-section-heading">
                <span>Impacto real</span>
                <h2>Decisiones más rápidas, menos riesgo y mayor control</h2>
                <p>El valor no está solo en ver gráficas bonitas. Está en ahorrar tiempo, evitar pérdidas, mantener el negocio bajo control y convertir cada resumen diario en una acción que mejora los resultados.</p>
              </div>
              <section className="mkt-infographic-section" aria-label="Infografía sobre el impacto real de Copiloto Pyme">
                <img
                  alt="Infografía: impacto real de Copiloto Pyme en ahorro de tiempo, reducción de pérdidas, control y crecimiento"
                  src="/images/infografia-impacto-real-copiloto-pyme.png"
                />
              </section>
            </div>
          </section>
        )}

        {activePage === "precio" && (
          <section className="mkt-section mkt-single-section">
            <div className="mkt-section-heading">
              <span>Precio</span>
              <h2>Elige el plan que se adapta a tu PYME</h2>
              <p>Todos los planes incluyen 1 mes gratis. Cancelas cuando quieras. Sin letras pequeñas.</p>
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
                  price={plan.price}
                />
              ))}
            </div>
            <p className="mkt-price-note">Todos los planes incluyen 1 mes gratis · Precios en COP · No incluyen IVA</p>
          </section>
        )}

        {activePage === "contactenos" && (
          <section className="mkt-section mkt-contact-section mkt-single-section">
            <div className="mkt-contact-copy">
              <span><MessageSquareText aria-hidden="true" />Contáctenos</span>
              <h2>Habla con nosotros</h2>
              <p>Déjanos tus datos y te mostramos cómo Copiloto Pyme puede ayudarte.</p>
            </div>
            <ContactForm />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
