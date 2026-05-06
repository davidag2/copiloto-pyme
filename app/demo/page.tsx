import { ArrowRight, BarChart3, ClipboardCheck, TrendingUp } from "lucide-react";
import { Footer } from "@/components/marketing/Footer";

const tabCards = [
  { title: "Ventas", text: "Café Premium subió 18% esta semana.", value: "$2.850.000" },
  { title: "Caja", text: "Hay 18 días de caja proyectada.", value: "+12 días" },
  { title: "Alertas", text: "2 productos están en nivel crítico.", value: "2" }
];

export default function DemoPage() {
  return (
    <div className="mkt-page">
      <main className="demo-page">
        <section className="demo-hero">
          <a className="mkt-brand" href="/"><span>CP</span><strong>Copiloto Pyme</strong></a>
          <div>
            <span className="mkt-eyebrow"><BarChart3 aria-hidden="true" />Demo sin login</span>
            <h1>Demo Copiloto Pyme</h1>
            <p>Así se ve tu negocio en segundos.</p>
          </div>
        </section>

        <section className="demo-dashboard">
          <div className="demo-main-card">
            <span>Decisión recomendada</span>
            <strong>Reponer Panela Orgánica hoy</strong>
            <p>Quedan pocas unidades y las ventas subieron. Si no compras hoy, puedes perder ventas mañana.</p>
            <div className="demo-impact-grid">
              <div><TrendingUp aria-hidden="true" /><span>Impacto</span><strong>Caja +12 días</strong></div>
              <div><ClipboardCheck aria-hidden="true" /><span>Acción</span><strong>Enviar orden a compras</strong></div>
            </div>
          </div>
          <div className="demo-tabs" aria-label="Vista de datos">
            <div className="demo-tab-nav"><button>Ventas</button><button>Caja</button><button>Alertas</button></div>
            <div className="demo-chart-placeholder">
              <span /><span /><span /><span /><span />
            </div>
            <div className="demo-tab-grid">
              {tabCards.map((card) => <article key={card.title}><span>{card.title}</span><strong>{card.value}</strong><p>{card.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="demo-cta">
          <a className="mkt-button primary large" href="/register"><ArrowRight aria-hidden="true" />Crear cuenta gratis</a>
          <a className="mkt-button secondary large" href="/#precio">Ver planes</a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
