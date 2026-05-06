"use client";

import { AlertTriangle, BarChart3, ClipboardCheck, Eye, MessageSquareText, Sparkles } from "lucide-react";
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
            <section className="mkt-final-cta">
              <span><Sparkles aria-hidden="true" />Listo para decidir mejor</span>
              <h2>Convierte los datos de tu PYME en decisiones diarias</h2>
              <div>
                <a className="mkt-button primary large" href="/register">Crear cuenta gratis</a>
                <a className="mkt-button secondary large" href="/demo"><BarChart3 aria-hidden="true" />Ver demo</a>
              </div>
            </section>
          </>
        )}

        {activePage === "ventajas" && (
          <section className="mkt-section mkt-single-section">
            <div className="mkt-section-heading">
              <span>Ventajas</span>
              <h2>{"As\u00ed te ayuda Copiloto Pyme"}</h2>
            </div>
            <div className="mkt-feature-grid">
              <FeatureCard icon={Eye} title="Ve todo claro" text={"Sabes cu\u00e1nto vendes, cu\u00e1nto tienes y qu\u00e9 est\u00e1 pasando."} />
              <FeatureCard icon={AlertTriangle} title="Te avisa problemas" text="Te dice antes si algo se va a acabar o si algo va mal." />
              <FeatureCard icon={ClipboardCheck} title={"Te dice qu\u00e9 hacer"} text={"No tienes que pensar mucho. Te dice la siguiente acci\u00f3n."} />
            </div>
          </section>
        )}

        {activePage === "precio" && (
          <section className="mkt-section mkt-single-section">
            <div className="mkt-section-heading">
              <span>Precio</span>
              <h2>Planes simples en pesos colombianos</h2>
              <p>Empieza gratis y escala a medida que tu negocio crece.</p>
            </div>
            <div className="mkt-pricing-grid">
              <PricingCard name="Gratis" price="COP $0" href="/register" cta="Empezar gratis" features={["1 empresa", "Lectura diaria b\u00e1sica", "Dashboard simple", "Features b\u00e1sicas"]} />
              <PricingCard name="Basic" price="COP $50.000 / mes" href="/register" cta="Elegir Basic" features={["Hasta 2 empresas", "Alertas b\u00e1sicas", "Resumen diario", "Datos de ventas, caja e inventario", "Soporte est\u00e1ndar"]} />
              <PricingCard highlighted badge="Recomendado" name="Pro" price="COP $100.000 / mes" href="/register" cta="Elegir Pro" features={["Hasta 5 empresas", "Alertas inteligentes", "Proyecci\u00f3n de caja", "Reporte semanal", "Roles de equipo", "Prioridad en soporte"]} />
            </div>
            <p className="mkt-price-note">{"Precios en COP \u00b7 No incluyen IVA"}</p>
          </section>
        )}

        {activePage === "contactenos" && (
          <section className="mkt-section mkt-contact-section mkt-single-section">
            <div className="mkt-contact-copy">
              <span><MessageSquareText aria-hidden="true" />{"Cont\u00e1ctenos"}</span>
              <h2>Habla con nosotros</h2>
              <p>{"D\u00e9janos tus datos y te mostramos c\u00f3mo Copiloto Pyme puede ayudarte."}</p>
            </div>
            <ContactForm />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
