"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";

type SalePoint = { day: string; value: number };
type Product = { name: string; sales: string; stock: "Bajo" | "Normal" | "Critico" };
type Alert = { level: "positive" | "warning" | "danger"; title: string; text: string };
type Decision = {
  id: number;
  text: string;
  owner: string;
  impact: string;
  status: "Pendiente" | "En curso" | "Completada";
  date: string;
};
type Integration = {
  id: string;
  name: string;
  category: string;
  status: "Disponible" | "Conectado";
  sync: string;
};
type Metrics = {
  sales: number;
  cash: number;
  margin: number;
  criticalStock: number;
};

const initialWeeklySales: SalePoint[] = [
  { day: "Lun", value: 9.8 },
  { day: "Mar", value: 11.4 },
  { day: "Mie", value: 10.2 },
  { day: "Jue", value: 13.7 },
  { day: "Vie", value: 15.1 },
  { day: "Sab", value: 17.9 },
  { day: "Dom", value: 6.1 }
];

const initialProducts: Product[] = [
  { name: "Cafe Premium 500g", sales: "$18.4M", stock: "Bajo" },
  { name: "Chocolate Familiar", sales: "$12.7M", stock: "Normal" },
  { name: "Panela Organica", sales: "$9.8M", stock: "Critico" },
  { name: "Avena Instantanea", sales: "$7.9M", stock: "Normal" }
];

const initialIntegrations: Integration[] = [
  { id: "sheets", name: "Google Sheets", category: "Hojas de calculo", status: "Disponible", sync: "Manual" },
  { id: "siigo", name: "Siigo", category: "Facturacion y contabilidad", status: "Disponible", sync: "Cada 6 horas" },
  { id: "alegra", name: "Alegra", category: "Facturacion y contabilidad", status: "Disponible", sync: "Cada 6 horas" },
  { id: "mercadopago", name: "Mercado Pago", category: "Pagos", status: "Disponible", sync: "Cada hora" },
  { id: "shopify", name: "Shopify", category: "Ecommerce", status: "Disponible", sync: "Cada hora" },
  { id: "woocommerce", name: "WooCommerce", category: "Ecommerce", status: "Disponible", sync: "Cada hora" }
];

const formatMoney = (value: number) => `$${value.toFixed(1)}M`;
const formatGoal = (value: number) => `$${(value / 1_000_000).toFixed(1)}M`;
const cashDays = (cash: number) => Math.round(cash / 1.55);

function statusForSales(sales: number, goal: number) {
  const percent = goal ? (sales / (goal / 1_000_000)) * 100 : 0;
  return percent >= 80 ? "green" : percent >= 55 ? "yellow" : "red";
}

function statusClass(status: string) {
  return status === "green" ? "positive" : status === "yellow" ? "warning" : "danger";
}

export default function Home() {
  const [view, setView] = useState<"portal" | "app">("portal");
  const [customer, setCustomer] = useState({
    ownerName: "",
    ownerEmail: "",
    companyName: "Distribuidora Andina",
    country: "Colombia",
    plan: "Crecimiento",
    businessType: "Distribuidora",
    currency: "COP - Peso colombiano",
    monthlyGoal: 100_000_000,
    minimumStock: 10,
    dataSource: "Excel/CSV"
  });
  const [paid, setPaid] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>({ sales: 84.2, cash: 27.6, margin: 31.8, criticalStock: 7 });
  const [weeklySales, setWeeklySales] = useState(initialWeeklySales);
  const [products, setProducts] = useState(initialProducts);
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [decisions, setDecisions] = useState<Decision[]>([
    { id: 1, text: "Reponer Panela Organica antes del viernes", owner: "Operaciones", impact: "Inventario", status: "En curso", date: "2026-04-29" },
    { id: 2, text: "Revisar gasto de transporte con proveedor", owner: "Administrador", impact: "Margen", status: "Pendiente", date: "2026-04-29" }
  ]);
  const [rules, setRules] = useState({ sales: 70, cash: 14, margin: 30, stock: 3 });
  const [visible, setVisible] = useState({
    sales: true,
    cash: true,
    margin: true,
    stock: true,
    importer: true,
    products: true,
    copilot: true,
    decisions: true,
    integrations: true,
    reports: true
  });
  const [focus, setFocus] = useState("owner");
  const [recommendation, setRecommendation] = useState("Reponer inventario de Cafe Premium antes del viernes y revisar el gasto de transporte.");
  const [answer, setAnswer] = useState("");
  const [question, setQuestion] = useState("");
  const [importStatus, setImportStatus] = useState("Sin archivo cargado");
  const [importPreview, setImportPreview] = useState("Aun no hay datos para mostrar.");
  const [report, setReport] = useState("");
  const [reportSettings, setReportSettings] = useState({ frequency: "Semanal", channel: "Email", recipient: "gerencia@empresa.com" });

  const salesPercent = Math.round((metrics.sales / (customer.monthlyGoal / 1_000_000)) * 100);
  const connectedIntegrations = integrations.filter((integration) => integration.status === "Conectado").length;
  const openDecisions = decisions.filter((decision) => decision.status !== "Completada").length;

  const alerts = useMemo<Alert[]>(() => {
    const nextAlerts: Alert[] = [];
    if (salesPercent < rules.sales) {
      nextAlerts.push({ level: "danger", title: "Ventas bajo regla configurada", text: `Avance actual ${salesPercent}%. La regla exige minimo ${rules.sales}%.` });
    }
    if (cashDays(metrics.cash) < rules.cash) {
      nextAlerts.push({ level: "warning", title: "Caja por debajo del minimo", text: `Cobertura estimada ${cashDays(metrics.cash)} dias. La regla exige ${rules.cash} dias.` });
    }
    if (metrics.margin < rules.margin) {
      nextAlerts.push({ level: "warning", title: "Margen bruto bajo", text: `Margen actual ${metrics.margin.toFixed(1)}%. La regla exige ${rules.margin}%.` });
    }
    if (metrics.criticalStock > rules.stock) {
      nextAlerts.push({ level: "danger", title: "Inventario critico supera el limite", text: `${metrics.criticalStock} SKU en riesgo. La regla permite hasta ${rules.stock}.` });
    }
    return nextAlerts.length ? nextAlerts : [{ level: "positive", title: "Reglas dentro de rango", text: "No hay alertas activas segun los umbrales configurados." }];
  }, [metrics, rules, salesPercent]);

  const bestDay = weeklySales.reduce((best, item) => (item.value > best.value ? item : best), weeklySales[0]);

  function recommendedAction() {
    if (metrics.criticalStock > rules.stock) return `Reponer los SKU criticos antes de lanzar promociones. Hay ${metrics.criticalStock} SKU en riesgo.`;
    if (cashDays(metrics.cash) < rules.cash) return `Priorizar cobros y aplazar pagos no urgentes. La caja cubre ${cashDays(metrics.cash)} dias.`;
    if (metrics.margin < rules.margin) return `Revisar descuentos, costos y productos de bajo margen. Margen actual ${metrics.margin.toFixed(1)}%.`;
    if (salesPercent < rules.sales) return `Activar ventas sobre ${products[0]?.name ?? "productos lideres"} para cerrar la brecha de meta mensual.`;
    return "Mantener seguimiento diario, revisar productos lideres y preparar reporte semanal para el equipo.";
  }

  function updateMetrics(next: Metrics) {
    setMetrics(next);
  }

  function refreshMetrics() {
    const multiplier = 0.94 + Math.random() * 0.14;
    updateMetrics({
      sales: 84.2 * multiplier,
      cash: 27.6 * (0.96 + Math.random() * 0.1),
      margin: 31.8 + (Math.random() * 1.6 - 0.8),
      criticalStock: Math.round(5 + Math.random() * 5)
    });
  }

  function completeSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaid(false);
    setRecommendation("Usuario creado. Ya puedes pagar la suscripcion y continuar el onboarding.");
  }

  function completeOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRecommendation(`Bienvenido ${customer.ownerName || "equipo"}. Siguiente paso: cargar datos desde ${customer.dataSource}.`);
    setView("app");
  }

  function connectIntegration(id: string) {
    const selected = integrations.find((integration) => integration.id === id);
    if (!selected) return;
    setIntegrations((current) => current.map((integration) => (integration.id === id ? { ...integration, status: "Conectado", sync: "Sincronizado ahora" } : integration)));
    setCustomer((current) => ({ ...current, dataSource: selected.name }));
    updateMetrics({ sales: metrics.sales * 1.04, cash: metrics.cash * 1.02, margin: metrics.margin + 0.4, criticalStock: Math.max(0, metrics.criticalStock - 1) });
    setRecommendation(`${selected.name} conectado. Datos sincronizados y panel actualizado con una muestra demo.`);
  }

  function syncIntegrations() {
    const connected = integrations.filter((integration) => integration.status === "Conectado");
    if (!connected.length) {
      setRecommendation("Conecta al menos una fuente antes de sincronizar integraciones.");
      return;
    }
    setIntegrations((current) => current.map((integration) => (integration.status === "Conectado" ? { ...integration, sync: "Sincronizado ahora" } : integration)));
    updateMetrics({ ...metrics, sales: metrics.sales * 1.02, cash: metrics.cash * 1.01 });
    setRecommendation(`${connected.length} integracion(es) sincronizadas. Revisa alertas y decisiones sugeridas.`);
  }

  function addDecision(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("decision") || "").trim();
    if (!text) return;
    setDecisions((current) => [
      { id: Date.now(), text, owner: String(form.get("owner")), impact: String(form.get("impact")), status: "Pendiente", date: new Date().toISOString().slice(0, 10) },
      ...current
    ]);
    event.currentTarget.reset();
    setRecommendation("Decision registrada. Dale seguimiento desde el historial para medir si genera resultado.");
  }

  function generateReport() {
    const text = `Reporte ${reportSettings.frequency} - ${customer.companyName}
Canal: ${reportSettings.channel}
Destinatario: ${reportSettings.recipient}

Resumen ejecutivo
- Ventas: ${formatMoney(metrics.sales)} (${salesPercent}% de la meta ${formatGoal(customer.monthlyGoal)})
- Caja: ${formatMoney(metrics.cash)} (${cashDays(metrics.cash)} dias estimados)
- Margen: ${metrics.margin.toFixed(1)}%
- Inventario critico: ${metrics.criticalStock} SKU
- Integraciones conectadas: ${connectedIntegrations}
- Decisiones abiertas: ${openDecisions}

Alertas
${alerts.map((alert) => `- ${alert.title}: ${alert.text}`).join("\n")}

Accion recomendada
${recommendedAction()}`;
    setReport(text);
    setRecommendation(`Reporte ${reportSettings.frequency.toLowerCase()} listo para ${reportSettings.recipient}.`);
  }

  function downloadReport() {
    const text = report || `Reporte Copiloto Pyme\n\n${recommendedAction()}`;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reporte-copiloto-pyme-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadTemplate() {
    const rows = [
      "fecha,producto,ventas,stock,caja,gastos,margen",
      "2026-04-23,Cafe Premium 500g,18400000,8,27600000,2200000,32",
      "2026-04-24,Chocolate Familiar,12700000,24,28900000,1800000,29",
      "2026-04-25,Panela Organica,9800000,3,27100000,1600000,35"
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-copiloto-pyme.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function answerQuestion() {
    const normalized = question.toLowerCase();
    if (!normalized) {
      setAnswer("Escribe una pregunta sobre ventas, caja, inventario, decisiones, integraciones o reportes.");
      return;
    }
    if (normalized.includes("caja")) setAnswer(`Caja disponible: ${formatMoney(metrics.cash)}, cobertura estimada ${cashDays(metrics.cash)} dias.`);
    else if (normalized.includes("decision")) setAnswer(`Hay ${openDecisions} decisiones abiertas. La mas reciente es: ${decisions[0]?.text ?? "sin decisiones registradas"}.`);
    else if (normalized.includes("integracion")) setAnswer(`Hay ${connectedIntegrations} integraciones conectadas. Prioriza Google Sheets, Siigo/Alegra y Mercado Pago.`);
    else if (normalized.includes("reporte")) setAnswer(`El reporte ${reportSettings.frequency.toLowerCase()} esta preparado para ${reportSettings.channel} a ${reportSettings.recipient}.`);
    else if (normalized.includes("meta") || normalized.includes("venta")) setAnswer(`La meta mensual va en ${salesPercent}%. Ventas acumuladas: ${formatMoney(metrics.sales)} contra ${formatGoal(customer.monthlyGoal)}.`);
    else setAnswer(`Mi recomendacion: ${recommendedAction()}`);
  }

  function handleCsvUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportStatus(`${file.name} listo para validar`);
    setImportPreview("CSV cargado en el navegador. La version de produccion conectara este flujo a una API persistente.");
    setRecommendation(`Archivo ${file.name} validado para el flujo de importacion.`);
  }

  if (view === "portal") {
    return (
      <div id="portalView" className="portal-view">
        <header className="marketing-nav">
          <div className="brand dark-brand">
            <div className="brand-mark">CP</div>
            <div>
              <strong>Copiloto Pyme</strong>
              <span>Decisiones para PYMES</span>
            </div>
          </div>
          <nav aria-label="Producto">
            <a href="#beneficios">Beneficios</a>
            <a href="#planes">Planes</a>
            <a href="#registro">Registro</a>
          </nav>
          <button className="ghost-button" type="button" onClick={() => setView("app")}>Ver demo</button>
        </header>

        <main>
          <section className="hero-section">
            <div className="hero-copy">
              <p className="eyebrow">SaaS para PYMES en Latinoamerica</p>
              <h1>Tu negocio claro cada mañana: ventas, caja, inventario y alertas en un solo panel.</h1>
              <p>Copiloto Pyme ayuda a dueños y gerentes a dejar de perseguir reportes en Excel, WhatsApp y sistemas separados.</p>
              <div className="hero-actions">
                <a className="primary-button" href="#registro">Crear cuenta</a>
                <button className="secondary-button" type="button" onClick={() => setView("app")}>Entrar al dashboard</button>
              </div>
            </div>
            <div className="hero-product">
              <div className="mini-dashboard">
                <div className="mini-header"><span>{customer.companyName}</span><strong>Decision de hoy</strong></div>
                <div className="mini-kpis">
                  <div><span>Ventas</span><strong>{formatMoney(metrics.sales)}</strong></div>
                  <div><span>Caja</span><strong>{cashDays(metrics.cash)} dias</strong></div>
                  <div><span>Stock critico</span><strong>{metrics.criticalStock} SKU</strong></div>
                </div>
                <div className="mini-alert"><strong>Reponer inventario</strong><span>{recommendedAction()}</span></div>
              </div>
            </div>
          </section>

          <section id="beneficios" className="benefits-section">
            {["Conecta datos simples", "Recibe alertas accionables", "Decide con contexto"].map((item, index) => (
              <article key={item}><span>{index + 1}</span><strong>{item}</strong><p>Convierte datos dispersos en acciones claras para el equipo.</p></article>
            ))}
          </section>

          <section id="planes" className="pricing-section">
            <div className="section-heading"><p className="eyebrow">Planes iniciales</p><h2>Precios pensados para PYMES</h2></div>
            <div className="pricing-grid">
              {["Inicial", "Crecimiento", "Pro"].map((plan) => (
                <article className={`price-card ${plan === "Crecimiento" ? "featured" : ""}`} key={plan}>
                  <span>{plan}</span><strong>{plan === "Inicial" ? "$29" : plan === "Crecimiento" ? "$79" : "$149"} USD/mes</strong>
                  <p>Panel, alertas, reportes y copiloto para decisiones diarias.</p>
                  <button className={plan === "Crecimiento" ? "primary-button" : "secondary-button"} type="button" onClick={() => setCustomer({ ...customer, plan })}>Elegir {plan}</button>
                </article>
              ))}
            </div>
          </section>

          <section id="registro" className="signup-section">
            <div className="section-heading"><p className="eyebrow">Inicio del cliente</p><h2>Registro, pago y onboarding</h2></div>
            <div className="signup-layout">
              <form className="signup-form" onSubmit={completeSignup}>
                <div className="step-label">Paso 1 de 4</div>
                <label>Nombre completo<input value={customer.ownerName} onChange={(event) => setCustomer({ ...customer, ownerName: event.target.value })} required /></label>
                <label>Email empresarial<input type="email" value={customer.ownerEmail} onChange={(event) => setCustomer({ ...customer, ownerEmail: event.target.value })} required /></label>
                <label>Nombre de la empresa<input value={customer.companyName} onChange={(event) => setCustomer({ ...customer, companyName: event.target.value })} required /></label>
                <label>Pais<select value={customer.country} onChange={(event) => setCustomer({ ...customer, country: event.target.value })}><option>Colombia</option><option>Mexico</option><option>Peru</option><option>Chile</option></select></label>
                <button className="primary-button" type="submit">Crear usuario y continuar</button>
              </form>
              <div className="checkout-card">
                <div className="step-label">Paso 2 de 4</div><strong>Pago de suscripcion</strong>
                <p>{customer.companyName} quedara en el plan {customer.plan}.</p>
                <button className="primary-button" type="button" onClick={() => setPaid(true)}>Pagar suscripcion</button>
                <small>{paid ? "Pago aprobado. Onboarding disponible." : "Completa el registro para activar el pago."}</small>
              </div>
              <form className="onboarding-card" onSubmit={completeOnboarding}>
                <div className="step-label">Paso 3 de 4</div><strong>Configura tu primera vista</strong>
                <div className="onboarding-fields">
                  <label>Tipo de negocio<select disabled={!paid} value={customer.businessType} onChange={(event) => setCustomer({ ...customer, businessType: event.target.value })}><option>Comercio minorista</option><option>Distribuidora</option><option>Restaurante</option><option>Ecommerce</option></select></label>
                  <label>Meta mensual<input disabled={!paid} type="number" value={customer.monthlyGoal} onChange={(event) => setCustomer({ ...customer, monthlyGoal: Number(event.target.value) })} /></label>
                  <label>Inventario minimo<input disabled={!paid} type="number" value={customer.minimumStock} onChange={(event) => setCustomer({ ...customer, minimumStock: Number(event.target.value) })} /></label>
                  <label>Primera fuente<select disabled={!paid} value={customer.dataSource} onChange={(event) => setCustomer({ ...customer, dataSource: event.target.value })}><option>Excel/CSV</option><option>Google Sheets</option><option>Siigo</option><option>Alegra</option><option>Mercado Pago</option></select></label>
                </div>
                <button className="secondary-button" type="submit" disabled={!paid}>Completar onboarding</button>
              </form>
            </div>
          </section>
        </main>
        <footer className="site-footer"><span>Copiloto Pyme</span><strong>Un producto Tecnotitan S.A.S</strong></footer>
      </div>
    );
  }

  return (
    <div id="appView" className="app-shell">
      <header className="mobile-app-bar">
        <div className="brand"><div className="brand-mark">CP</div><div><strong>Copiloto Pyme</strong><span>{customer.companyName}</span></div></div>
        <button className="secondary-button" type="button" onClick={() => setView("portal")}>Portal</button>
      </header>

      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">CP</div><div><strong>Copiloto Pyme</strong><span>PYME Command Center</span></div></div>
        <nav className="nav-list" aria-label="Principal">
          {["Panel diario", "Ventas", "Caja", "Inventario", "Clientes", "Decisiones", "Integraciones", "Reportes"].map((item, index) => (
            <button className={`nav-item ${index === 0 ? "active" : ""}`} type="button" key={item}>{item}</button>
          ))}
        </nav>
        <div className="tenant-card"><span>Empresa activa</span><strong>{customer.companyName}</strong><small>{customer.businessType}, {customer.country}</small></div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div><p className="eyebrow">Panel de decisiones en tiempo real</p><h1>Que debe revisar <span>{customer.companyName}</span> hoy</h1></div>
          <div className="topbar-actions">
            <label className="upload-button"><input type="file" accept=".csv" onChange={handleCsvUpload} />Importar CSV</label>
            <button className="secondary-button" type="button" onClick={downloadTemplate}>Plantilla CSV</button>
            <button className="primary-button" type="button" onClick={refreshMetrics}>Actualizar datos</button>
            <button className="secondary-button" type="button" onClick={() => setView("portal")}>Portal</button>
          </div>
        </header>

        <section className="decision-strip"><div><span className="status-dot" /><strong>Decision recomendada</strong></div><p>{recommendation}</p></section>

        <section className="setup-summary">
          <div><span>Tipo de negocio</span><strong>{customer.businessType}</strong></div>
          <div><span>Moneda</span><strong>{customer.currency.split(" - ")[0]}</strong></div>
          <div><span>Meta mensual</span><strong>{formatGoal(customer.monthlyGoal)}</strong></div>
          <div><span>Fuente inicial</span><strong>{customer.dataSource}</strong></div>
        </section>

        <section className="customizer-panel">
          <div className="panel-heading"><div><span>Dashboard personalizable</span><h2>Elige que ve cada usuario</h2></div>
            <select value={focus} onChange={(event) => setFocus(event.target.value)}><option value="owner">Dueño / Gerencia</option><option value="finance">Finanzas</option><option value="sales">Ventas</option><option value="operations">Operaciones</option></select>
          </div>
          <div className="customizer-grid">
            {Object.keys(visible).map((key) => (
              <label key={key}><input type="checkbox" checked={visible[key as keyof typeof visible]} onChange={(event) => setVisible({ ...visible, [key]: event.target.checked })} /> {key}</label>
            ))}
          </div>
        </section>

        {visible.integrations && (
          <section id="mobileIntegrationsAnchor" className="integrations-panel">
            <div className="panel-heading"><div><span>Integraciones latinoamericanas</span><h2>Conecta tus fuentes de datos</h2></div><button className="primary-button" type="button" onClick={syncIntegrations}>Sincronizar</button></div>
            <div className="integrations-grid">
              {integrations.map((integration) => (
                <article className="integration-card" data-status={integration.status} key={integration.id}>
                  <div><span>{integration.category}</span><strong>{integration.name}</strong><small>{integration.sync}</small></div>
                  <button className="secondary-button" type="button" onClick={() => connectIntegration(integration.id)}>{integration.status === "Conectado" ? "Reconectar" : "Conectar"}</button>
                </article>
              ))}
            </div>
          </section>
        )}

        {visible.reports && (
          <section id="mobileReportsAnchor" className="reports-panel">
            <div className="panel-heading"><div><span>Reportes automaticos</span><h2>Envios para gerencia</h2></div><button className="primary-button" type="button" onClick={generateReport}>Generar reporte</button></div>
            <div className="reports-layout">
              <form className="report-settings">
                <label>Frecuencia<select value={reportSettings.frequency} onChange={(event) => setReportSettings({ ...reportSettings, frequency: event.target.value })}><option>Diario</option><option>Semanal</option><option>Mensual</option></select></label>
                <label>Canal<select value={reportSettings.channel} onChange={(event) => setReportSettings({ ...reportSettings, channel: event.target.value })}><option>Email</option><option>WhatsApp</option><option>Email y WhatsApp</option></select></label>
                <label>Destinatario<input value={reportSettings.recipient} onChange={(event) => setReportSettings({ ...reportSettings, recipient: event.target.value })} /></label>
                <button className="secondary-button" type="button" onClick={downloadReport}>Descargar TXT</button>
              </form>
              <div className="report-preview"><div className="preview-heading"><span>Vista previa</span><strong>Programado {reportSettings.frequency.toLowerCase()}</strong></div><pre>{report || "Genera un reporte para ver el resumen ejecutivo."}</pre></div>
            </div>
          </section>
        )}

        <section id="mobileGoalsAnchor" className="goals-panel">
          <div className="panel-heading"><div><span>Metas y semaforos</span><h2>Avance contra objetivos</h2></div><button className="secondary-button" type="button">Recalcular</button></div>
          <div className="goals-grid">
            {[
              ["sales", "Meta mensual de ventas", `${formatMoney(metrics.sales)} de ${formatGoal(customer.monthlyGoal)}`, salesPercent],
              ["cash", "Caja disponible", `${cashDays(metrics.cash)} dias de cobertura`, Math.min((cashDays(metrics.cash) / 25) * 100, 100)],
              ["margin", "Margen minimo", `${metrics.margin.toFixed(1)}% contra meta de ${rules.margin}%`, Math.min((metrics.margin / 35) * 100, 100)],
              ["stock", "Inventario critico", `${metrics.criticalStock} SKU requieren atencion`, Math.max(0, 100 - metrics.criticalStock * 12)]
            ].map(([key, title, text, percent]) => (
              <article className="goal-card" data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} key={String(key)}>
                <div className="goal-topline"><span className="traffic-light" data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} /><strong>{title}</strong></div>
                <p>{text}</p><div className="progress-track"><span data-status={key === "sales" ? statusForSales(metrics.sales, customer.monthlyGoal) : "yellow"} style={{ width: `${percent}%` }} /></div>
              </article>
            ))}
          </div>
        </section>

        <section className="rules-panel">
          <div className="panel-heading"><div><span>Alertas configurables</span><h2>Reglas de riesgo del negocio</h2></div><button className="primary-button" type="button" onClick={() => setRecommendation("Reglas de alerta actualizadas.")}>Aplicar reglas</button></div>
          <div className="rules-grid">
            <label><span>Ventas bajo meta</span><input type="number" value={rules.sales} onChange={(event) => setRules({ ...rules, sales: Number(event.target.value) })} /><small>% minimo de avance mensual</small></label>
            <label><span>Caja insuficiente</span><input type="number" value={rules.cash} onChange={(event) => setRules({ ...rules, cash: Number(event.target.value) })} /><small>Dias minimos de cobertura</small></label>
            <label><span>Margen bajo</span><input type="number" value={rules.margin} onChange={(event) => setRules({ ...rules, margin: Number(event.target.value) })} /><small>% minimo de margen bruto</small></label>
            <label><span>Inventario critico</span><input type="number" value={rules.stock} onChange={(event) => setRules({ ...rules, stock: Number(event.target.value) })} /><small>SKU maximos en riesgo</small></label>
          </div>
        </section>

        {visible.importer && (
          <section className="importer-panel">
            <div className="panel-heading"><div><span>Importador real CSV</span><h2>Ventas, caja, gastos e inventario</h2></div><strong>{importStatus}</strong></div>
            <div className="importer-grid"><div><p>Columnas requeridas: <strong>fecha</strong>, <strong>producto</strong>, <strong>ventas</strong>, <strong>stock</strong>.</p><div className="import-validation">{importPreview}</div></div><div className="preview-box"><div className="preview-heading"><span>Vista previa</span><button className="primary-button" type="button">Aplicar al dashboard</button></div><div className="preview-table">{importPreview}</div></div></div>
          </section>
        )}

        <section id="kpiGrid" className="kpi-grid">
          {visible.sales && <article className="metric-card" data-status={statusForSales(metrics.sales, customer.monthlyGoal)}><span>Ventas del mes</span><strong>{formatMoney(metrics.sales)}</strong><small className={statusClass(statusForSales(metrics.sales, customer.monthlyGoal))}>{salesPercent}% de la meta mensual</small></article>}
          {visible.cash && <article className="metric-card" data-status={cashDays(metrics.cash) >= 14 ? "green" : "yellow"}><span>Caja disponible</span><strong>{formatMoney(metrics.cash)}</strong><small className="warning">Alcanza para {cashDays(metrics.cash)} dias</small></article>}
          {visible.margin && <article className="metric-card" data-status={metrics.margin >= rules.margin ? "green" : "yellow"}><span>Margen bruto</span><strong>{metrics.margin.toFixed(1)}%</strong><small className="positive">{(metrics.margin - rules.margin).toFixed(1)} pts vs meta</small></article>}
          {visible.stock && <article className="metric-card" data-status={metrics.criticalStock > rules.stock ? "red" : "green"}><span>Inventario critico</span><strong>{metrics.criticalStock} SKU</strong><small className="danger">Requiere atencion hoy</small></article>}
        </section>

        <section className="content-grid">
          <article className="panel chart-panel"><div className="panel-heading"><div><span>Ventas recientes</span><h2>Tendencia semanal</h2></div><select><option>Ultimos 7 dias</option></select></div><div className="bar-chart">{weeklySales.map((item) => <div className="bar-wrap" key={item.day}><div className="bar" style={{ height: `${Math.round((item.value / Math.max(...weeklySales.map((sale) => sale.value), 1)) * 100)}%` }} /><div className="bar-label">{item.day}</div></div>)}</div></article>
          <article id="mobileAlertsAnchor" className="panel alerts-panel"><div className="panel-heading"><div><span>Atencion requerida</span><h2>Alertas inteligentes</h2></div></div><div className="alerts-list">{alerts.map((alert) => <div className="alert-item" key={alert.title}><strong className={alert.level}>{alert.title}</strong><p>{alert.text}</p></div>)}</div></article>
          {visible.products && <article className="panel"><div className="panel-heading"><div><span>Productos</span><h2>Mas vendidos</h2></div></div><div className="table-list">{products.map((product) => <div className="table-row" key={product.name}><div><strong>{product.name}</strong><span>Stock: {product.stock}</span></div><strong>{product.sales}</strong></div>)}</div></article>}
          {visible.decisions && <article id="mobileDecisionsAnchor" className="panel decisions-panel"><div className="panel-heading"><div><span>Historial</span><h2>Decisiones tomadas</h2></div></div><form className="decision-form" onSubmit={addDecision}><input name="decision" required placeholder="Ej. Reponer Panela Organica esta semana" /><select name="owner"><option>Dueño</option><option>Administrador</option><option>Contador</option><option>Ventas</option><option>Operaciones</option></select><select name="impact"><option>Inventario</option><option>Caja</option><option>Ventas</option><option>Margen</option></select><button className="primary-button" type="submit">Registrar</button></form><div className="decisions-list">{decisions.map((decision) => <div className="decision-item" data-status={decision.status} key={decision.id}><div><strong>{decision.text}</strong><span>{decision.impact} · {decision.owner} · {decision.date}</span></div><select value={decision.status} onChange={(event) => setDecisions((current) => current.map((item) => item.id === decision.id ? { ...item, status: event.target.value as Decision["status"] } : item))}><option>Pendiente</option><option>En curso</option><option>Completada</option></select></div>)}</div></article>}
          {visible.copilot && <article id="mobileCopilotAnchor" className="panel copilot-panel"><div className="panel-heading"><div><span>Copiloto IA</span><h2>Resumen ejecutivo</h2></div><button className="secondary-button" type="button" onClick={() => setAnswer(`Brief para gerencia: ventas ${formatMoney(metrics.sales)}, caja ${formatMoney(metrics.cash)}, margen ${metrics.margin.toFixed(1)}%, decisiones abiertas ${openDecisions}. ${recommendedAction()}`)}>Generar brief</button></div><div className="ai-summary"><div className="summary-card"><strong>Lectura de hoy</strong><p>{customer.companyName} va en {salesPercent}% de la meta mensual. El mejor dia reciente fue {bestDay.day} con {formatMoney(bestDay.value)}.</p></div><div className="summary-card"><strong>Accion sugerida</strong><p>{recommendedAction()} Hay {openDecisions} decisiones abiertas.</p></div></div><div className="quick-prompts">{["Que debo revisar hoy?", "Como va la meta mensual?", "Que productos necesitan atencion?", "Que riesgo tiene la caja?"].map((prompt) => <button type="button" key={prompt} onClick={() => { setQuestion(prompt); setAnswer(`Mi recomendacion: ${recommendedAction()}`); }}>{prompt.replace("?", "")}</button>)}</div><div className="prompt-box"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Pregunta: que debo revisar hoy?" /><button type="button" onClick={answerQuestion}>Preguntar</button></div><p className="answer-box">{answer}</p></article>}
        </section>
      </main>

      <nav className="mobile-quick-nav">
        <a href="#kpiGrid">KPIs</a>
        <a href="#mobileGoalsAnchor">Metas</a>
        <a href="#mobileIntegrationsAnchor">Datos</a>
        <a href="#mobileReportsAnchor">Reporte</a>
      </nav>
    </div>
  );
}
