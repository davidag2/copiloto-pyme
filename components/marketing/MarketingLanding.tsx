"use client";

import { AlertTriangle, Bell, Check, Clock3, ClipboardCheck, CreditCard, Eye, Headphones, MessageSquareText, ShieldCheck, Sparkles, Target, TrendingUp, UserCheck, Users, WalletCards } from "lucide-react";
import { useState } from "react";
import { ContactForm } from "./ContactForm";
import { ChatbotWidget } from "./ChatbotWidget";
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
              <p>Un sistema operativo para administrar tu PYME con IA: menos revisión manual, más control diario y decisiones con contexto real.</p>
            </div>
            <div className="mkt-feature-grid mkt-figma-feature-grid">
              <FeatureCard icon={Eye} title="Todo tu negocio conectado" text="Ventas, caja, inventario y clientes dejan de vivir separados." />
              <FeatureCard icon={Clock3} title="Menos revisión manual" text="La IA detecta lo importante sin que tengas que cruzar hojas, reportes o chats." />
              <FeatureCard icon={ClipboardCheck} title="Decisiones con contexto" text="No solo ves números. Entiendes qué significan y qué hacer con ellos." />
              <FeatureCard icon={Bell} title="Alertas antes del problema" text="Copiloto te avisa si baja la caja, se agota un producto o un cliente importante deja de comprar." />
              <FeatureCard icon={UserCheck} title="Acciones para el equipo" text="Cada recomendación puede convertirse en una tarea clara para ventas, administración u operaciones." />
              <FeatureCard icon={Target} title="Control diario para crecer" text="Abres Inicio y sabes qué revisar, qué priorizar y qué decisión tomar." />
            </div>

            <div className="mkt-advantages-story mkt-figma-advantages">
              <section className="mkt-business-intelligence">
                <div>
                  <span>Claridad operativa</span>
                  <h2>La IA entiende cada parte de tu negocio</h2>
                  <p>Analiza ventas, caja, inventario, clientes y alertas para darte claridad y control en un solo lugar.</p>
                </div>
                <div className="mkt-intelligence-grid">
                  <article className="green"><TrendingUp aria-hidden="true" /><strong>Ventas</strong><span>Oportunidades, canales y pendientes por cobrar</span></article>
                  <article className="blue"><WalletCards aria-hidden="true" /><strong>Caja</strong><span>Ingresos, egresos y flujo disponible</span></article>
                  <article className="orange"><ClipboardCheck aria-hidden="true" /><strong>Inventario</strong><span>Stock, compras y productos críticos</span></article>
                  <article className="purple"><Users aria-hidden="true" /><strong>Clientes</strong><span>CRM, recompra y seguimiento comercial</span></article>
                </div>
              </section>

              <section className="mkt-impact-panel">
                <h2>La IA conecta las señales importantes de tu empresa</h2>
                <p>Copiloto Pyme une tus módulos operativos para que el propietario no tenga que perseguir datos en varias herramientas.</p>
                <h2>Decisiones más rápidas, menos riesgo y mayor control</h2>
                <div className="mkt-impact-grid">
                  <article className="blue"><Clock3 aria-hidden="true" /><strong>Ahorra tiempo</strong><span>Lectura diaria en 10 segundos</span></article>
                  <article className="green"><ShieldCheck aria-hidden="true" /><strong>Evita pérdidas</strong><span>Alertas tempranas con contexto</span></article>
                  <article className="purple"><Target aria-hidden="true" /><strong>Más control</strong><span>Métricas modernas y priorizadas</span></article>
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
              <h2>Planes simples para administrar tu PYME con IA</h2>
              <p>Empieza con 1 mes gratis y elige el nivel de operación que necesita tu equipo.</p>
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
              <h2>Hablemos de cómo administra hoy tu PYME</h2>
              <p>Cuéntanos cómo registras ventas, caja, inventario y clientes. Te mostramos cómo Copiloto Pyme puede convertir esa operación diaria en decisiones claras con IA.</p>
              <article className="mkt-demo-info">
                <div>CP</div>
                <section>
                  <h3>Demo para PYMES</h3>
                  <p>Revisamos tu flujo actual y te mostramos cómo se vería tu panel Inicio con módulos conectados.</p>
                </section>
                <ul>
                  <li>Identificamos qué módulos activar primero</li>
                  <li>Te ayudamos a preparar tus primeros datos</li>
                  <li>Construimos una ruta simple para administrar con IA</li>
                </ul>
              </article>
            </div>
            <ContactForm />
          </section>
        )}
      </main>
      <ChatbotWidget />
      <Footer />
    </div>
  );
}
