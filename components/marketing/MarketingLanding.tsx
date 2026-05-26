"use client";

import { AlertTriangle, Bell, Check, Clock3, ClipboardCheck, CreditCard, Eye, Headphones, MessageSquareText, ShieldCheck, Sparkles, Target, TrendingUp, WalletCards } from "lucide-react";
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
            <div className="mkt-feature-grid mkt-figma-feature-grid">
              <FeatureCard icon={Eye} title="Ve todo claro" text="Sabes cuánto vendes, cuánto tienes y qué está pasando." />
              <FeatureCard icon={Bell} title="Te avisa problemas" text="Te dice antes si algo se va a acabar o si algo va mal." />
              <FeatureCard icon={ClipboardCheck} title="Te dice qué hacer" text="No tienes que pensar mucho. Te dice la siguiente acción." />
            </div>

            <div className="mkt-advantages-story mkt-figma-advantages">
              <section className="mkt-business-intelligence">
                <div>
                  <span>Claridad operativa</span>
                  <h2>La IA entiende cada parte de tu negocio</h2>
                  <p>Analiza ventas, caja, inventario y alertas para darte claridad y control en un solo lugar.</p>
                </div>
                <div className="mkt-intelligence-grid">
                  <article className="green"><TrendingUp aria-hidden="true" /><strong>Ventas</strong><span>Producto líder y tendencia</span></article>
                  <article className="blue"><WalletCards aria-hidden="true" /><strong>Caja</strong><span>Flujo y proyección</span></article>
                  <article className="orange"><ClipboardCheck aria-hidden="true" /><strong>Inventario</strong><span>Stock y rotación</span></article>
                  <article className="purple"><AlertTriangle aria-hidden="true" /><strong>Alertas</strong><span>Riesgos antes de que pasen</span></article>
                </div>
              </section>

              <section className="mkt-impact-panel">
                <h2>La IA conecta las señales importantes de tu empresa</h2>
                <p>Copiloto Pyme une ventas, caja, inventario y alertas para que el propietario no tenga que perseguir datos en varias herramientas.</p>
                <h2>Decisiones más rápidas, menos riesgo y mayor control</h2>
                <div className="mkt-impact-grid">
                  <article className="blue"><Clock3 aria-hidden="true" /><strong>Ahorra tiempo</strong><span>Lectura diaria en 10 segundos</span></article>
                  <article className="green"><ShieldCheck aria-hidden="true" /><strong>Evita pérdidas</strong><span>Alertas tempranas</span></article>
                  <article className="purple"><Target aria-hidden="true" /><strong>Más control</strong><span>Datos confiables</span></article>
                  <article className="orange"><Sparkles aria-hidden="true" /><strong>Mejores decisiones</strong><span>Acciones que generan resultados</span></article>
                </div>
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
            <div className="mkt-price-assurance" aria-label="Beneficios incluidos">
              <span><Sparkles aria-hidden="true" />1 mes gratis</span>
              <span><CreditCard aria-hidden="true" />Sin tarjeta de crédito</span>
              <span><Clock3 aria-hidden="true" />Configuración en minutos</span>
              <span><Headphones aria-hidden="true" />Soporte humano</span>
              <span><Check aria-hidden="true" />100% seguro</span>
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
              <article className="mkt-demo-info">
                <div>CP</div>
                <section>
                  <h3>Demo para PYMES</h3>
                  <p>Implementación guiada, soporte inicial y acompañamiento para cargar tus primeros datos.</p>
                </section>
                <ul>
                  <li>Ventas, caja e inventario</li>
                  <li>Roles por equipo</li>
                  <li>IA accionable</li>
                </ul>
              </article>
            </div>
            <ContactForm />
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
