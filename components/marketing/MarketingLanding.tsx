"use client";

import Image from "next/image";
import { AlertTriangle, ClipboardCheck, Eye, MessageSquareText } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { FeatureCard } from "./FeatureCard";
import { Footer } from "./Footer";
import { Header, type MarketingPageKey } from "./Header";
import { HomePage } from "./HomePage";
import { PricingCard } from "./PricingCard";
import { commercialPlans } from "@/lib/plans";

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
        {activePage === "inicio" && <HomePage />}

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
                <p>Copiloto Pyme une ventas, caja, inventario y alertas para que el propietario no tenga que perseguir datos en varias herramientas.</p>
              </div>
              <section className="mkt-infographic-section" aria-label="Infografía sobre cómo la IA entiende cada parte del negocio">
                <Image
                  alt="Infografía: la IA entiende ventas, caja, inventario y alertas para entregar una sola inteligencia de negocio"
                  height={1024}
                  quality={76}
                  sizes="(max-width: 768px) 94vw, (max-width: 1200px) 88vw, 1120px"
                  src="/images/infografia-ia-entiende-negocio-copiloto-pyme.png"
                  width={1536}
                />
              </section>

              <div className="mkt-section-heading">
                <span>Impacto real</span>
                <h2>Decisiones más rápidas, menos riesgo y mayor control</h2>
                <p>El valor no está solo en ver gráficas bonitas. Está en ahorrar tiempo, evitar pérdidas y convertir cada resumen diario en una acción.</p>
              </div>
              <section className="mkt-infographic-section" aria-label="Infografía sobre el impacto real de Copiloto Pyme">
                <Image
                  alt="Infografía: impacto real de Copiloto Pyme en ahorro de tiempo, reducción de pérdidas, control y crecimiento"
                  height={1024}
                  quality={76}
                  sizes="(max-width: 768px) 94vw, (max-width: 1200px) 88vw, 1120px"
                  src="/images/infografia-impacto-real-copiloto-pyme.png"
                  width={1536}
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
                  price={plan.priceLabel}
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
