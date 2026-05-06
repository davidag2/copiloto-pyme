"use client";

import { AlertTriangle, BarChart3, ClipboardCheck, Eye, MessageSquareText, Sparkles } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { FeatureCard } from "./FeatureCard";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { Hero } from "./Hero";
import { PricingCard } from "./PricingCard";

type MarketingLandingProps = {
  theme: "light" | "dark";
  onToggleTheme: () => void;
};

export function MarketingLanding({ theme, onToggleTheme }: MarketingLandingProps) {
  return (
    <div className={`mkt-page theme-${theme}`}>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main>
        <Hero />

        <section id="ventajas" className="mkt-section">
          <div className="mkt-section-heading">
            <span>Ventajas</span>
            <h2>Así te ayuda Copiloto Pyme</h2>
          </div>
          <div className="mkt-feature-grid">
            <FeatureCard icon={Eye} title="Ve todo claro" text="Sabes cuánto vendes, cuánto tienes y qué está pasando." />
            <FeatureCard icon={AlertTriangle} title="Te avisa problemas" text="Te dice antes si algo se va a acabar o si algo va mal." />
            <FeatureCard icon={ClipboardCheck} title="Te dice qué hacer" text="No tienes que pensar mucho. Te dice la siguiente acción." />
          </div>
        </section>

        <section id="precio" className="mkt-section">
          <div className="mkt-section-heading">
            <span>Precio</span>
            <h2>Planes simples en pesos colombianos</h2>
            <p>Empieza gratis y escala a medida que tu negocio crece.</p>
          </div>
          <div className="mkt-pricing-grid">
            <PricingCard name="Gratis" price="COP $0" href="/register" cta="Empezar gratis" features={["1 empresa", "Lectura diaria básica", "Dashboard simple", "Features básicas"]} />
            <PricingCard name="Basic" price="COP $50.000 / mes" href="/register" cta="Elegir Basic" features={["Hasta 2 empresas", "Alertas básicas", "Resumen diario", "Datos de ventas, caja e inventario", "Soporte estándar"]} />
            <PricingCard highlighted badge="Recomendado" name="Pro" price="COP $100.000 / mes" href="/register" cta="Elegir Pro" features={["Hasta 5 empresas", "Alertas inteligentes", "Proyección de caja", "Reporte semanal", "Roles de equipo", "Prioridad en soporte"]} />
          </div>
          <p className="mkt-price-note">Precios en COP · No incluyen IVA</p>
        </section>

        <section id="contactenos" className="mkt-section mkt-contact-section">
          <div className="mkt-contact-copy">
            <span><MessageSquareText aria-hidden="true" />Contáctenos</span>
            <h2>Habla con nosotros</h2>
            <p>Déjanos tus datos y te mostramos cómo Copiloto Pyme puede ayudarte.</p>
          </div>
          <ContactForm />
        </section>

        <section className="mkt-final-cta">
          <span><Sparkles aria-hidden="true" />Listo para decidir mejor</span>
          <h2>Convierte los datos de tu PYME en decisiones diarias</h2>
          <div>
            <a className="mkt-button primary large" href="/register">Crear cuenta gratis</a>
            <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
