const businessData = {
  weeklySales: [
    { day: "Lun", value: 9.8 },
    { day: "Mar", value: 11.4 },
    { day: "Mie", value: 10.2 },
    { day: "Jue", value: 13.7 },
    { day: "Vie", value: 15.1 },
    { day: "Sab", value: 17.9 },
    { day: "Dom", value: 6.1 },
  ],
  products: [
    { name: "Cafe Premium 500g", sales: "$18.4M", stock: "Bajo" },
    { name: "Chocolate Familiar", sales: "$12.7M", stock: "Normal" },
    { name: "Panela Organica", sales: "$9.8M", stock: "Critico" },
    { name: "Avena Instantanea", sales: "$7.9M", stock: "Normal" },
  ],
  alerts: [
    {
      level: "danger",
      title: "Inventario critico en Panela Organica",
      text: "Quedan 2 dias de stock al ritmo actual de ventas.",
    },
    {
      level: "warning",
      title: "Gasto de transporte subio 23%",
      text: "El incremento supera el promedio de las ultimas 4 semanas.",
    },
    {
      level: "positive",
      title: "Ventas de fin de semana aceleradas",
      text: "Sabado tuvo el mejor resultado del mes con $17.9M.",
    },
  ],
};

const formatMoney = (value) => `$${value.toFixed(1)}M`;

const customerState = {
  ownerName: "",
  ownerEmail: "",
  companyName: "Distribuidora Andina",
  country: "Colombia",
  plan: "Crecimiento",
  paid: false,
  businessType: "Distribuidora",
  currency: "COP - Peso colombiano",
  monthlyGoal: 100000000,
  minimumStock: 10,
  dataSource: "Excel/CSV",
};

const metricsState = {
  sales: 84.2,
  cash: 27.6,
  margin: 31.8,
  criticalStock: 7,
};

const importState = {
  rows: [],
  errors: [],
};

const dashboardPreferences = {
  focus: "owner",
  kpis: {
    sales: true,
    cash: true,
    margin: true,
    stock: true,
  },
  panels: {
    importer: true,
    products: true,
    copilot: true,
    decisions: true,
    integrations: true,
    reports: true,
  },
};

const reportsState = {
  frequency: "Semanal",
  channel: "Email",
  recipient: "gerencia@empresa.com",
  lastReport: "",
};

const integrationsState = [
  {
    id: "sheets",
    name: "Google Sheets",
    category: "Hojas de calculo",
    status: "Disponible",
    sync: "Manual",
  },
  {
    id: "siigo",
    name: "Siigo",
    category: "Facturacion y contabilidad",
    status: "Disponible",
    sync: "Cada 6 horas",
  },
  {
    id: "alegra",
    name: "Alegra",
    category: "Facturacion y contabilidad",
    status: "Disponible",
    sync: "Cada 6 horas",
  },
  {
    id: "mercadopago",
    name: "Mercado Pago",
    category: "Pagos",
    status: "Disponible",
    sync: "Cada hora",
  },
  {
    id: "shopify",
    name: "Shopify",
    category: "Ecommerce",
    status: "Disponible",
    sync: "Cada hora",
  },
  {
    id: "woocommerce",
    name: "WooCommerce",
    category: "Ecommerce",
    status: "Disponible",
    sync: "Cada hora",
  },
];

const decisionsState = [
  {
    id: 1,
    text: "Reponer Panela Organica antes del viernes",
    owner: "Operaciones",
    impact: "Inventario",
    status: "En curso",
    date: "2026-04-29",
  },
  {
    id: 2,
    text: "Revisar gasto de transporte con proveedor",
    owner: "Administrador",
    impact: "Margen",
    status: "Pendiente",
    date: "2026-04-29",
  },
];

const alertRules = {
  sales: { enabled: true, threshold: 70 },
  cash: { enabled: true, threshold: 14 },
  margin: { enabled: true, threshold: 30 },
  stock: { enabled: true, threshold: 3 },
};

const requiredCsvColumns = ["fecha", "producto", "ventas", "stock"];
const optionalCsvColumns = ["caja", "gastos", "margen"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function compactCurrency(currency) {
  return currency.split(" - ")[0];
}

function formatGoal(value) {
  return `$${(Number(value) / 1000000).toFixed(1)}M`;
}

function setStatusClass(element, status) {
  element.classList.remove("positive", "warning", "danger");
  element.classList.add(status === "green" ? "positive" : status === "yellow" ? "warning" : "danger");
}

function setMetricStatus(cardKey, status, text) {
  const card = document.querySelector(`[data-kpi-card="${cardKey}"]`);
  const label = document.querySelector(`#${cardKey}StatusText`);

  if (card) card.dataset.status = status;
  if (label) {
    label.textContent = text;
    setStatusClass(label, status);
  }
}

function updateGoalCard(goalKey, status, text, percent) {
  const card = document.querySelector(`[data-goal-card="${goalKey}"]`);
  const light = document.querySelector(`#${goalKey}GoalLight`);
  const label = document.querySelector(`#${goalKey}GoalText`);
  const progress = document.querySelector(`#${goalKey}GoalProgress`);
  const width = Math.max(0, Math.min(percent, 100));

  if (card) card.dataset.status = status;
  if (light) light.dataset.status = status;
  if (label) label.textContent = text;
  if (progress) {
    progress.style.width = `${width}%`;
    progress.dataset.status = status;
  }
}

function updateGoalSemaphores() {
  const monthlyGoalInMillions = customerState.monthlyGoal / 1000000;
  const salesPercent = monthlyGoalInMillions ? (metricsState.sales / monthlyGoalInMillions) * 100 : 0;
  const salesStatus = salesPercent >= 80 ? "green" : salesPercent >= 55 ? "yellow" : "red";
  const cashDays = Math.round(metricsState.cash / 1.55);
  const cashStatus = cashDays >= 20 ? "green" : cashDays >= 12 ? "yellow" : "red";
  const marginStatus = metricsState.margin >= 30 ? "green" : metricsState.margin >= 24 ? "yellow" : "red";
  const stockStatus = metricsState.criticalStock <= 2 ? "green" : metricsState.criticalStock <= 6 ? "yellow" : "red";

  updateGoalCard("sales", salesStatus, `${formatMoney(metricsState.sales)} de ${formatGoal(customerState.monthlyGoal)}`, salesPercent);
  updateGoalCard("cash", cashStatus, `${cashDays} dias de cobertura estimada`, Math.min((cashDays / 25) * 100, 100));
  updateGoalCard("margin", marginStatus, `${metricsState.margin.toFixed(1)}% contra meta de 30%`, Math.min((metricsState.margin / 35) * 100, 100));
  updateGoalCard("stock", stockStatus, `${metricsState.criticalStock} SKU requieren atencion`, Math.max(0, 100 - metricsState.criticalStock * 12));

  setMetricStatus("sales", salesStatus, `${Math.round(salesPercent)}% de la meta mensual`);
  setMetricStatus("cash", cashStatus, `Alcanza para ${cashDays} dias`);
  setMetricStatus("margin", marginStatus, `${(metricsState.margin - 30).toFixed(1)} pts vs meta`);
  setMetricStatus("stock", stockStatus, stockStatus === "green" ? "Inventario controlado" : "Requiere atencion hoy");
}

function getCashDays() {
  return Math.round(metricsState.cash / 1.55);
}

function syncAlertRulesFromForm() {
  alertRules.sales.enabled = document.querySelector("#ruleSalesEnabled").checked;
  alertRules.sales.threshold = Number(document.querySelector("#ruleSalesThreshold").value);
  alertRules.cash.enabled = document.querySelector("#ruleCashEnabled").checked;
  alertRules.cash.threshold = Number(document.querySelector("#ruleCashThreshold").value);
  alertRules.margin.enabled = document.querySelector("#ruleMarginEnabled").checked;
  alertRules.margin.threshold = Number(document.querySelector("#ruleMarginThreshold").value);
  alertRules.stock.enabled = document.querySelector("#ruleStockEnabled").checked;
  alertRules.stock.threshold = Number(document.querySelector("#ruleStockThreshold").value);
}

function evaluateAlertRules() {
  const monthlyGoalInMillions = customerState.monthlyGoal / 1000000;
  const salesPercent = monthlyGoalInMillions ? Math.round((metricsState.sales / monthlyGoalInMillions) * 100) : 0;
  const cashDays = getCashDays();
  const alerts = [];

  if (alertRules.sales.enabled && salesPercent < alertRules.sales.threshold) {
    alerts.push({
      level: "danger",
      title: `Ventas bajo regla configurada`,
      text: `Avance actual ${salesPercent}%. La regla exige minimo ${alertRules.sales.threshold}% de la meta mensual.`,
    });
  }

  if (alertRules.cash.enabled && cashDays < alertRules.cash.threshold) {
    alerts.push({
      level: cashDays < 8 ? "danger" : "warning",
      title: "Caja por debajo del minimo",
      text: `Cobertura estimada ${cashDays} dias. La regla exige ${alertRules.cash.threshold} dias.`,
    });
  }

  if (alertRules.margin.enabled && metricsState.margin < alertRules.margin.threshold) {
    alerts.push({
      level: metricsState.margin < alertRules.margin.threshold - 5 ? "danger" : "warning",
      title: "Margen bruto bajo",
      text: `Margen actual ${metricsState.margin.toFixed(1)}%. La regla exige ${alertRules.margin.threshold}%.`,
    });
  }

  if (alertRules.stock.enabled && metricsState.criticalStock > alertRules.stock.threshold) {
    alerts.push({
      level: "danger",
      title: "Inventario critico supera el limite",
      text: `${metricsState.criticalStock} SKU en riesgo. La regla permite hasta ${alertRules.stock.threshold}.`,
    });
  }

  if (!alerts.length) {
    alerts.push({
      level: "positive",
      title: "Reglas dentro de rango",
      text: "No hay alertas activas segun los umbrales configurados.",
    });
  }

  businessData.alerts = alerts;
}

function applyAlertRules() {
  syncAlertRulesFromForm();
  evaluateAlertRules();
  renderAlerts();
  renderSummary();
  document.querySelector("#mainRecommendation").textContent = "Reglas de alerta actualizadas. Revisa el panel de atencion requerida para priorizar acciones.";
}

function showPortal() {
  document.querySelector("#portalView").classList.remove("is-hidden");
  document.querySelector("#appView").classList.add("is-hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showApp() {
  document.querySelector("#portalView").classList.add("is-hidden");
  document.querySelector("#appView").classList.remove("is-hidden");
  document.querySelector("#activeCompanyText").textContent = customerState.companyName || "tu PYME";
  document.querySelector("#tenantCompany").textContent = customerState.companyName || "Distribuidora Andina";
  document.querySelector("#mobileCompanyText").textContent = customerState.companyName || "Distribuidora Andina";
  document.querySelector("#tenantMeta").textContent = `${customerState.businessType}, ${customerState.country}`;
  document.querySelector("#summaryBusinessType").textContent = customerState.businessType;
  document.querySelector("#summaryCurrency").textContent = compactCurrency(customerState.currency);
  document.querySelector("#summaryGoal").textContent = formatGoal(customerState.monthlyGoal);
  document.querySelector("#summarySource").textContent = customerState.dataSource;
  updateGoalSemaphores();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function selectPlan(plan) {
  customerState.plan = plan;
  document.querySelector("#planSelect").value = plan;
  document.querySelector("#checkoutSummary").textContent = `Plan ${plan}, cobro mensual. Pago simulado para el prototipo.`;
  document.querySelector("#registro").scrollIntoView({ behavior: "smooth", block: "start" });
}

function handleSignup(event) {
  event.preventDefault();

  customerState.ownerName = document.querySelector("#ownerName").value.trim();
  customerState.ownerEmail = document.querySelector("#ownerEmail").value.trim();
  customerState.companyName = document.querySelector("#companyName").value.trim();
  customerState.country = document.querySelector("#countrySelect").value;
  customerState.plan = document.querySelector("#planSelect").value;

  document.querySelector("#checkoutSummary").textContent = `${customerState.companyName} quedara en el plan ${customerState.plan}. Pago simulado mensual para ${customerState.country}.`;
  document.querySelector("#paymentStatus").textContent = "Usuario creado. Ya puedes pagar la suscripcion.";
  document.querySelector("#payButton").disabled = false;
}

function handlePayment() {
  customerState.paid = true;
  document.querySelector("#paymentStatus").textContent = "Pago aprobado. Suscripcion activa y onboarding disponible.";
  document.querySelector("#payButton").textContent = "Suscripcion activa";
  document.querySelector("#payButton").disabled = true;
  document.querySelector("#startOnboardingButton").disabled = false;
  document.querySelectorAll("#onboardingForm input, #onboardingForm select").forEach((field) => {
    field.disabled = false;
  });
}

function startOnboarding(event) {
  event.preventDefault();

  customerState.businessType = document.querySelector("#businessType").value;
  customerState.currency = document.querySelector("#currencySelect").value;
  customerState.monthlyGoal = Number(document.querySelector("#monthlyGoal").value);
  customerState.minimumStock = Number(document.querySelector("#minimumStock").value);
  customerState.dataSource = document.querySelector("#dataSource").value;

  document.querySelector("#mainRecommendation").textContent = `Bienvenido ${customerState.ownerName || "equipo"}. Siguiente paso: cargar datos desde ${customerState.dataSource} y monitorear productos bajo ${customerState.minimumStock} unidades.`;
  updateGoalSemaphores();
  showApp();
}

function getFocusRecommendation() {
  const recommendations = {
    owner: "Vista gerencial activa: prioriza ventas, caja, margen e inventario para decidir que revisar hoy.",
    finance: "Vista de finanzas activa: revisa caja disponible, margen y gastos antes de aprobar pagos grandes.",
    sales: "Vista de ventas activa: enfocate en tendencia comercial, productos mas vendidos y cumplimiento de meta mensual.",
    operations: "Vista de operaciones activa: prioriza inventario critico, rotacion de productos y fuente de datos actualizada.",
  };

  return recommendations[dashboardPreferences.focus];
}

function applyDashboardPreferences() {
  Object.entries(dashboardPreferences.kpis).forEach(([key, isVisible]) => {
    const card = document.querySelector(`[data-kpi-card="${key}"]`);
    const toggle = document.querySelector(`[data-kpi-toggle="${key}"]`);
    if (card) card.classList.toggle("is-hidden", !isVisible);
    if (toggle) toggle.checked = isVisible;
  });

  Object.entries(dashboardPreferences.panels).forEach(([key, isVisible]) => {
    const panel = document.querySelector(`[data-panel-card="${key}"]`);
    const toggle = document.querySelector(`[data-panel-toggle="${key}"]`);
    if (panel) panel.classList.toggle("is-hidden", !isVisible);
    if (toggle) toggle.checked = isVisible;
  });

  document.querySelector("#dashboardFocus").value = dashboardPreferences.focus;
  document.querySelector("#mainRecommendation").textContent = getFocusRecommendation();
}

function updateDashboardFocus(event) {
  dashboardPreferences.focus = event.target.value;

  if (dashboardPreferences.focus === "finance") {
    dashboardPreferences.kpis.cash = true;
    dashboardPreferences.kpis.margin = true;
  }

  if (dashboardPreferences.focus === "sales") {
    dashboardPreferences.kpis.sales = true;
    dashboardPreferences.panels.products = true;
  }

  if (dashboardPreferences.focus === "operations") {
    dashboardPreferences.kpis.stock = true;
    dashboardPreferences.panels.importer = true;
  }

  applyDashboardPreferences();
}

function updateKpiPreference(event) {
  dashboardPreferences.kpis[event.target.dataset.kpiToggle] = event.target.checked;
  applyDashboardPreferences();
}

function updatePanelPreference(event) {
  dashboardPreferences.panels[event.target.dataset.panelToggle] = event.target.checked;
  applyDashboardPreferences();
}

function renderChart() {
  const chart = document.querySelector("#barChart");
  const max = Math.max(...businessData.weeklySales.map((item) => item.value), 1);

  chart.innerHTML = businessData.weeklySales
    .map((item) => {
      const height = Math.round((item.value / max) * 100);
      return `
        <div class="bar-wrap" title="${item.day}: ${formatMoney(item.value)}">
          <div class="bar" style="height:${height}%"></div>
          <div class="bar-label">${item.day}</div>
        </div>
      `;
    })
    .join("");
}

function updateDashboardMetrics({ sales, cash, margin, criticalStock }) {
  metricsState.sales = sales;
  metricsState.cash = cash;
  metricsState.margin = margin;
  metricsState.criticalStock = criticalStock;
  document.querySelector("#salesMetric").textContent = formatMoney(sales);
  document.querySelector("#cashMetric").textContent = formatMoney(cash);
  document.querySelector("#marginMetric").textContent = `${margin.toFixed(1)}%`;
  document.querySelector("#stockMetric").textContent = `${criticalStock} SKU`;
  updateGoalSemaphores();
  evaluateAlertRules();
  renderAlerts();
  renderSummary();
}

function renderAlerts() {
  const alerts = document.querySelector("#alertsList");

  alerts.innerHTML = businessData.alerts
    .map(
      (alert) => `
        <div class="alert-item">
          <strong class="${alert.level}">${alert.title}</strong>
          <p>${alert.text}</p>
        </div>
      `
    )
    .join("");
}

function renderProducts() {
  const table = document.querySelector("#productsTable");

  table.innerHTML = businessData.products
    .map(
      (product) => `
        <div class="table-row">
          <div>
            <strong>${escapeHtml(product.name)}</strong>
            <span>Stock: ${escapeHtml(product.stock)}</span>
          </div>
          <strong>${product.sales}</strong>
        </div>
      `
    )
    .join("");
}

function renderDecisions() {
  const list = document.querySelector("#decisionsList");

  list.innerHTML = decisionsState
    .map(
      (decision) => `
        <div class="decision-item" data-status="${escapeHtml(decision.status)}">
          <div>
            <strong>${escapeHtml(decision.text)}</strong>
            <span>${escapeHtml(decision.impact)} · ${escapeHtml(decision.owner)} · ${escapeHtml(decision.date)}</span>
          </div>
          <select data-decision-status="${decision.id}" aria-label="Estado de decision">
            <option ${decision.status === "Pendiente" ? "selected" : ""}>Pendiente</option>
            <option ${decision.status === "En curso" ? "selected" : ""}>En curso</option>
            <option ${decision.status === "Completada" ? "selected" : ""}>Completada</option>
          </select>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-decision-status]").forEach((select) => {
    select.addEventListener("change", updateDecisionStatus);
  });
}

function renderIntegrations() {
  const grid = document.querySelector("#integrationsGrid");

  grid.innerHTML = integrationsState
    .map(
      (integration) => `
        <article class="integration-card" data-status="${escapeHtml(integration.status)}">
          <div>
            <span>${escapeHtml(integration.category)}</span>
            <strong>${escapeHtml(integration.name)}</strong>
            <small>${escapeHtml(integration.sync)}</small>
          </div>
          <button class="secondary-button" type="button" data-integration-id="${escapeHtml(integration.id)}">
            ${integration.status === "Conectado" ? "Reconectar" : "Conectar"}
          </button>
        </article>
      `
    )
    .join("");

  document.querySelectorAll("[data-integration-id]").forEach((button) => {
    button.addEventListener("click", connectIntegration);
  });
}

function connectIntegration(event) {
  const integration = integrationsState.find((item) => item.id === event.currentTarget.dataset.integrationId);

  if (!integration) return;

  integration.status = "Conectado";
  integration.sync = "Sincronizado ahora";
  customerState.dataSource = integration.name;
  document.querySelector("#summarySource").textContent = integration.name;
  updateDashboardMetrics({
    sales: metricsState.sales * 1.04,
    cash: metricsState.cash * 1.02,
    margin: metricsState.margin + 0.4,
    criticalStock: Math.max(0, metricsState.criticalStock - 1),
  });
  renderIntegrations();
  document.querySelector("#mainRecommendation").textContent = `${integration.name} conectado. Datos sincronizados y panel actualizado con una muestra demo.`;
}

function syncIntegrations() {
  const connected = integrationsState.filter((integration) => integration.status === "Conectado");

  if (!connected.length) {
    document.querySelector("#mainRecommendation").textContent = "Conecta al menos una fuente antes de sincronizar integraciones.";
    return;
  }

  connected.forEach((integration) => {
    integration.sync = "Sincronizado ahora";
  });
  updateDashboardMetrics({
    sales: metricsState.sales * 1.02,
    cash: metricsState.cash * 1.01,
    margin: metricsState.margin,
    criticalStock: metricsState.criticalStock,
  });
  renderIntegrations();
  document.querySelector("#mainRecommendation").textContent = `${connected.length} integracion(es) sincronizadas. Revisa alertas y decisiones sugeridas.`;
}

function buildReportText() {
  const context = buildBusinessContext();
  const connectedNames = integrationsState
    .filter((integration) => integration.status === "Conectado")
    .map((integration) => integration.name)
    .join(", ") || "Sin integraciones conectadas";
  const openDecisionList = decisionsState
    .filter((decision) => decision.status !== "Completada")
    .slice(0, 3)
    .map((decision) => `- ${decision.text} (${decision.owner}, ${decision.status})`)
    .join("\n") || "- Sin decisiones abiertas";
  const alertList = businessData.alerts
    .slice(0, 4)
    .map((alert) => `- ${alert.title}: ${alert.text}`)
    .join("\n");

  return `Reporte ${reportsState.frequency} - ${customerState.companyName}
Canal: ${reportsState.channel}
Destinatario: ${reportsState.recipient}

Resumen ejecutivo
- Ventas: ${formatMoney(metricsState.sales)} (${context.salesPercent}% de la meta ${formatGoal(customerState.monthlyGoal)})
- Caja: ${formatMoney(metricsState.cash)} (${context.cashDays} dias estimados)
- Margen: ${metricsState.margin.toFixed(1)}%
- Inventario critico: ${metricsState.criticalStock} SKU
- Integraciones: ${connectedNames}

Alertas
${alertList}

Decisiones abiertas
${openDecisionList}

Accion recomendada
${buildRecommendedAction()}`;
}

function generateReport() {
  reportsState.frequency = document.querySelector("#reportFrequency").value;
  reportsState.channel = document.querySelector("#reportChannel").value;
  reportsState.recipient = document.querySelector("#reportRecipient").value.trim() || "gerencia@empresa.com";
  reportsState.lastReport = buildReportText();

  document.querySelector("#reportPreview").textContent = reportsState.lastReport;
  document.querySelector("#reportStatus").textContent = `Programado ${reportsState.frequency.toLowerCase()} por ${reportsState.channel}`;
  document.querySelector("#mainRecommendation").textContent = `Reporte ${reportsState.frequency.toLowerCase()} listo para ${reportsState.recipient}.`;
}

function downloadReport() {
  if (!reportsState.lastReport) generateReport();

  const blob = new Blob([reportsState.lastReport], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reporte-copiloto-pyme-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function addDecision(event) {
  event.preventDefault();

  const textInput = document.querySelector("#decisionText");
  const text = textInput.value.trim();

  if (!text) return;

  decisionsState.unshift({
    id: Date.now(),
    text,
    owner: document.querySelector("#decisionOwner").value,
    impact: document.querySelector("#decisionImpact").value,
    status: "Pendiente",
    date: new Date().toISOString().slice(0, 10),
  });

  textInput.value = "";
  renderDecisions();
  renderSummary();
  document.querySelector("#mainRecommendation").textContent = "Decision registrada. Dale seguimiento desde el historial para medir si genera resultado.";
}

function updateDecisionStatus(event) {
  const decisionId = Number(event.target.dataset.decisionStatus);
  const decision = decisionsState.find((item) => item.id === decisionId);

  if (!decision) return;

  decision.status = event.target.value;
  renderDecisions();
  renderSummary();
}

function renderSummary() {
  const summary = document.querySelector("#aiSummary");
  const bestDay = businessData.weeklySales.reduce((best, item) => (item.value > best.value ? item : best));
  const monthlyGoalInMillions = customerState.monthlyGoal / 1000000;
  const salesPercent = monthlyGoalInMillions ? Math.round((metricsState.sales / monthlyGoalInMillions) * 100) : 0;
  const activeAlerts = businessData.alerts.filter((alert) => alert.level !== "positive");
  const topProduct = businessData.products[0]?.name || "producto principal";
  const cashDays = getCashDays();
  const priority = activeAlerts[0]?.title || (metricsState.criticalStock ? "Inventario critico" : "Mantener seguimiento diario");

  summary.innerHTML = `
    <div class="summary-card">
      <strong>Lectura de hoy</strong>
      <p>${customerState.companyName} va en ${salesPercent}% de la meta mensual. El mejor dia reciente fue ${bestDay.day} con ${formatMoney(bestDay.value)} y el producto lider es ${escapeHtml(topProduct)}.</p>
    </div>
    <div class="summary-card">
      <strong>Prioridad detectada</strong>
      <p>${escapeHtml(priority)}. Caja estimada para ${cashDays} dias, margen actual ${metricsState.margin.toFixed(1)}% e inventario critico en ${metricsState.criticalStock} SKU.</p>
    </div>
    <div class="summary-card">
      <strong>Accion sugerida</strong>
      <p>${buildRecommendedAction()} Hay ${decisionsState.filter((decision) => decision.status !== "Completada").length} decisiones abiertas por seguimiento.</p>
    </div>
  `;
}

function buildRecommendedAction() {
  const monthlyGoalInMillions = customerState.monthlyGoal / 1000000;
  const salesPercent = monthlyGoalInMillions ? Math.round((metricsState.sales / monthlyGoalInMillions) * 100) : 0;

  if (metricsState.criticalStock > alertRules.stock.threshold) {
    return `Reponer los SKU criticos antes de lanzar promociones. El limite configurado es ${alertRules.stock.threshold} y hoy hay ${metricsState.criticalStock}.`;
  }

  if (getCashDays() < alertRules.cash.threshold) {
    return `Priorizar cobros y aplazar pagos no urgentes. La caja cubre ${getCashDays()} dias y la regla pide ${alertRules.cash.threshold}.`;
  }

  if (metricsState.margin < alertRules.margin.threshold) {
    return `Revisar descuentos, costos y productos de bajo margen. El margen esta en ${metricsState.margin.toFixed(1)}%.`;
  }

  if (salesPercent < alertRules.sales.threshold) {
    return `Activar ventas sobre ${businessData.products[0]?.name || "productos lideres"} para cerrar la brecha de meta mensual.`;
  }

  return "Mantener seguimiento diario, revisar productos lideres y preparar reporte semanal para el equipo.";
}

function buildBusinessContext() {
  const monthlyGoalInMillions = customerState.monthlyGoal / 1000000;
  const salesPercent = monthlyGoalInMillions ? Math.round((metricsState.sales / monthlyGoalInMillions) * 100) : 0;
  const alertSummary = businessData.alerts.map((alert) => `${alert.title}: ${alert.text}`).join(" ");
  const topProducts = businessData.products
    .slice(0, 3)
    .map((product) => `${product.name} (${product.sales}, stock ${product.stock})`)
    .join("; ");
  const connectedIntegrations = integrationsState.filter((integration) => integration.status === "Conectado").length;

  return {
    salesPercent,
    cashDays: getCashDays(),
    alertSummary,
    topProducts,
    openDecisions: decisionsState.filter((decision) => decision.status !== "Completada").length,
    connectedIntegrations,
  };
}

function refreshMetrics() {
  const multiplier = 0.94 + Math.random() * 0.14;
  const sales = 84.2 * multiplier;
  const cash = 27.6 * (0.96 + Math.random() * 0.1);
  const margin = 31.8 + (Math.random() * 1.6 - 0.8);
  const stock = Math.round(5 + Math.random() * 5);

  updateDashboardMetrics({ sales, cash, margin, criticalStock: stock });
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

function normalizeHeader(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function parseNumeric(value) {
  if (!value) return 0;
  let cleaned = String(value).replace(/[$\s]/g, "");

  if (cleaned.includes(".") && cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(",", ".");
  } else if (/\.\d{3}(\D|$)/.test(cleaned)) {
    cleaned = cleaned.replace(/\./g, "");
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) {
    return { rows: [], errors: ["El archivo debe tener encabezados y al menos una fila de datos."] };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  const missingColumns = requiredCsvColumns.filter((column) => !headers.includes(column));

  if (missingColumns.length) {
    return {
      rows: [],
      errors: [`Faltan columnas requeridas: ${missingColumns.join(", ")}.`],
    };
  }

  const errors = [];
  const rows = lines.slice(1).map((line, rowIndex) => {
    const values = parseCsvLine(line);
    const row = {};

    headers.forEach((header, index) => {
      row[header] = values[index] || "";
    });

    row.fecha = row.fecha.trim();
    row.producto = row.producto.trim();
    row.ventas = parseNumeric(row.ventas);
    row.stock = parseNumeric(row.stock);
    row.caja = parseNumeric(row.caja);
    row.gastos = parseNumeric(row.gastos);
    row.margen = parseNumeric(row.margen);

    if (!row.fecha) errors.push(`Fila ${rowIndex + 2}: falta fecha.`);
    if (!row.producto) errors.push(`Fila ${rowIndex + 2}: falta producto.`);
    if (row.ventas <= 0) errors.push(`Fila ${rowIndex + 2}: ventas debe ser mayor a 0.`);
    if (row.stock < 0) errors.push(`Fila ${rowIndex + 2}: stock no puede ser negativo.`);

    return row;
  });

  return { rows, errors };
}

function renderImportPreview() {
  const status = document.querySelector("#importStatus");
  const validation = document.querySelector("#importValidation");
  const preview = document.querySelector("#importPreview");
  const applyButton = document.querySelector("#applyImportButton");
  const validRows = importState.rows.length;

  status.textContent = validRows ? `${validRows} filas leidas` : "Sin archivo cargado";
  validation.textContent = importState.errors.length
    ? importState.errors.slice(0, 4).join(" ")
    : `Archivo valido. Columnas soportadas: ${requiredCsvColumns.concat(optionalCsvColumns).join(", ")}.`;
  validation.classList.toggle("has-errors", importState.errors.length > 0);
  applyButton.disabled = !validRows || importState.errors.length > 0;

  if (!validRows) {
    preview.textContent = "Aun no hay datos para mostrar.";
    return;
  }

  preview.innerHTML = `
    <table>
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Producto</th>
          <th>Ventas</th>
          <th>Stock</th>
        </tr>
      </thead>
      <tbody>
        ${importState.rows
          .slice(0, 5)
          .map(
            (row) => `
              <tr>
                <td>${escapeHtml(row.fecha)}</td>
                <td>${escapeHtml(row.producto)}</td>
                <td>${formatMoney(row.ventas / 1000000)}</td>
                <td>${row.stock}</td>
              </tr>
            `
          )
          .join("")}
      </tbody>
    </table>
  `;
}

function applyImportedRows() {
  if (!importState.rows.length || importState.errors.length) return;

  const totalSales = importState.rows.reduce((sum, row) => sum + row.ventas, 0) / 1000000;
  const cashRows = importState.rows.filter((row) => row.caja > 0);
  const cash = cashRows.length ? cashRows[cashRows.length - 1].caja / 1000000 : 27.6;
  const marginRows = importState.rows.filter((row) => row.margen > 0);
  const margin = marginRows.length
    ? marginRows.reduce((sum, row) => sum + row.margen, 0) / marginRows.length
    : 31.8;
  const criticalStock = importState.rows.filter((row) => row.stock <= customerState.minimumStock).length;

  const byDate = importState.rows.reduce((acc, row) => {
    acc[row.fecha] = (acc[row.fecha] || 0) + row.ventas / 1000000;
    return acc;
  }, {});

  businessData.weeklySales = Object.entries(byDate)
    .slice(-7)
    .map(([date, value]) => ({ day: date.slice(5) || date, value }));

  const byProduct = importState.rows.reduce((acc, row) => {
    if (!acc[row.producto]) acc[row.producto] = { sales: 0, stock: row.stock };
    acc[row.producto].sales += row.ventas;
    acc[row.producto].stock = Math.min(acc[row.producto].stock, row.stock);
    return acc;
  }, {});

  businessData.products = Object.entries(byProduct)
    .sort((a, b) => b[1].sales - a[1].sales)
    .slice(0, 5)
    .map(([name, data]) => ({
      name,
      sales: formatMoney(data.sales / 1000000),
      stock: data.stock <= customerState.minimumStock ? "Critico" : "Normal",
    }));

  updateDashboardMetrics({ sales: totalSales, cash, margin, criticalStock });
  renderChart();
  renderProducts();
  renderSummary();
  document.querySelector("#mainRecommendation").textContent = `Datos importados desde CSV. Revisa ${criticalStock} SKU bajo minimo y valida la meta mensual de ${formatGoal(customerState.monthlyGoal)}.`;
}

function answerQuestion() {
  const input = document.querySelector("#questionInput");
  const answer = document.querySelector("#answerBox");
  const question = input.value.trim().toLowerCase();
  const context = buildBusinessContext();

  if (!question) {
    answer.textContent = "Escribe una pregunta sobre ventas, caja, inventario o gastos.";
    return;
  }

  if (question.includes("hoy") || question.includes("revisar") || question.includes("hacer")) {
    answer.textContent = `Hoy revisaria primero: ${buildRecommendedAction()} Alertas activas: ${context.alertSummary}`;
  } else if (question.includes("meta") || question.includes("venta")) {
    answer.textContent = `La meta mensual va en ${context.salesPercent}%. Ventas acumuladas: ${formatMoney(metricsState.sales)} contra ${formatGoal(customerState.monthlyGoal)}. Enfoque sugerido: empujar los productos lideres y controlar inventario antes de promocionar.`;
  } else if (question.includes("inventario") || question.includes("stock")) {
    answer.textContent = `Hay ${metricsState.criticalStock} SKU criticos frente a un limite de regla de ${alertRules.stock.threshold}. Productos destacados: ${context.topProducts}.`;
  } else if (question.includes("margen") || question.includes("gasto") || question.includes("rentabilidad")) {
    answer.textContent = `El margen actual es ${metricsState.margin.toFixed(1)}% y la regla minima es ${alertRules.margin.threshold}%. Si baja, revisa descuentos, costos logisticos y productos con poca rotacion.`;
  } else if (question.includes("caja")) {
    answer.textContent = `La caja disponible es ${formatMoney(metricsState.cash)} y cubre cerca de ${context.cashDays} dias. La regla configurada exige ${alertRules.cash.threshold} dias.`;
  } else if (question.includes("alerta") || question.includes("riesgo")) {
    answer.textContent = `Riesgos detectados: ${context.alertSummary}`;
  } else if (question.includes("decision") || question.includes("decisiones")) {
    answer.textContent = `Hay ${context.openDecisions} decisiones abiertas. La mas reciente es: ${decisionsState[0]?.text || "sin decisiones registradas"}. Recomiendo cerrar cada decision con responsable, impacto esperado y estado.`;
  } else if (question.includes("integracion") || question.includes("integraciones") || question.includes("conectar")) {
    answer.textContent = `Hay ${context.connectedIntegrations} integraciones conectadas. Para PYMES en Latinoamerica priorizaria Google Sheets para empezar, Siigo/Alegra para facturacion y Mercado Pago para caja.`;
  } else if (question.includes("reporte") || question.includes("reportes")) {
    answer.textContent = `El reporte ${reportsState.frequency.toLowerCase()} esta preparado para enviarse por ${reportsState.channel} a ${reportsState.recipient}. Incluye ventas, caja, margen, alertas, decisiones e integraciones.`;
  } else if (question.includes("reporte") || question.includes("resumen")) {
    answer.textContent = `Brief ejecutivo: ventas ${formatMoney(metricsState.sales)} (${context.salesPercent}% de meta), caja ${formatMoney(metricsState.cash)} (${context.cashDays} dias), margen ${metricsState.margin.toFixed(1)}%, inventario critico ${metricsState.criticalStock} SKU, decisiones abiertas ${context.openDecisions}, integraciones conectadas ${context.connectedIntegrations}. Accion: ${buildRecommendedAction()}`;
  } else {
    answer.textContent = `Con los datos actuales, mi recomendacion es: ${buildRecommendedAction()}`;
  }
}

function generateExecutiveBrief() {
  const answer = document.querySelector("#answerBox");
  const context = buildBusinessContext();
  answer.textContent = `Brief para gerencia: ${customerState.companyName} registra ${formatMoney(metricsState.sales)} en ventas, equivalente al ${context.salesPercent}% de la meta mensual. Caja: ${formatMoney(metricsState.cash)} (${context.cashDays} dias). Margen: ${metricsState.margin.toFixed(1)}%. Inventario critico: ${metricsState.criticalStock} SKU. Decisiones abiertas: ${context.openDecisions}. Integraciones conectadas: ${context.connectedIntegrations}. Siguiente accion: ${buildRecommendedAction()}`;
}

function askQuickQuestion(event) {
  const question = event.currentTarget.dataset.question;
  document.querySelector("#questionInput").value = question;
  answerQuestion();
}

function handleCsvUpload(event) {
  const file = event.target.files[0];
  const recommendation = document.querySelector("#mainRecommendation");

  if (!file) return;

  if (!file.name.toLowerCase().endsWith(".csv")) {
    importState.rows = [];
    importState.errors = ["Por ahora el importador acepta archivos .csv."];
    renderImportPreview();
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const result = parseCsv(String(reader.result || ""));
    importState.rows = result.rows;
    importState.errors = result.errors;
    recommendation.textContent = importState.errors.length
      ? `Archivo ${file.name} tiene errores por corregir antes de aplicarlo.`
      : `Archivo ${file.name} validado. Puedes aplicar los datos al dashboard.`;
    renderImportPreview();
  };
  reader.readAsText(file);
}

function downloadTemplate() {
  const rows = [
    "fecha,producto,ventas,stock,caja,gastos,margen",
    "2026-04-23,Cafe Premium 500g,18400000,8,27600000,2200000,32",
    "2026-04-24,Chocolate Familiar,12700000,24,28900000,1800000,29",
    "2026-04-25,Panela Organica,9800000,3,27100000,1600000,35",
  ];
  const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "plantilla-copiloto-pyme.csv";
  link.click();
  URL.revokeObjectURL(url);
}

document.querySelector("#refreshButton").addEventListener("click", refreshMetrics);
document.querySelector("#recalculateGoalsButton").addEventListener("click", updateGoalSemaphores);
document.querySelector("#applyAlertRulesButton").addEventListener("click", applyAlertRules);
document.querySelector("#downloadTemplateButton").addEventListener("click", downloadTemplate);
document.querySelector("#applyImportButton").addEventListener("click", applyImportedRows);
document.querySelector("#decisionForm").addEventListener("submit", addDecision);
document.querySelector("#syncIntegrationsButton").addEventListener("click", syncIntegrations);
document.querySelector("#generateReportButton").addEventListener("click", generateReport);
document.querySelector("#downloadReportButton").addEventListener("click", downloadReport);
document.querySelector("#askButton").addEventListener("click", answerQuestion);
document.querySelector("#generateBriefButton").addEventListener("click", generateExecutiveBrief);
document.querySelector("#questionInput").addEventListener("keydown", (event) => {
  if (event.key === "Enter") answerQuestion();
});
document.querySelectorAll("[data-question]").forEach((button) => {
  button.addEventListener("click", askQuickQuestion);
});
document.querySelector("#csvInput").addEventListener("change", handleCsvUpload);
document.querySelector("#signupForm").addEventListener("submit", handleSignup);
document.querySelector("#payButton").addEventListener("click", handlePayment);
document.querySelector("#onboardingForm").addEventListener("submit", startOnboarding);
document.querySelectorAll("[data-show-app]").forEach((button) => button.addEventListener("click", showApp));
document.querySelectorAll("[data-show-portal]").forEach((button) => button.addEventListener("click", showPortal));
document.querySelectorAll("[data-plan]").forEach((button) => {
  button.addEventListener("click", () => selectPlan(button.dataset.plan));
});
document.querySelector("#planSelect").addEventListener("change", (event) => selectPlan(event.target.value));
document.querySelector("#dashboardFocus").addEventListener("change", updateDashboardFocus);
document.querySelectorAll("[data-kpi-toggle]").forEach((toggle) => {
  toggle.addEventListener("change", updateKpiPreference);
});
document.querySelectorAll("[data-panel-toggle]").forEach((toggle) => {
  toggle.addEventListener("change", updatePanelPreference);
});

renderChart();
evaluateAlertRules();
renderAlerts();
renderProducts();
renderDecisions();
renderIntegrations();
renderSummary();
generateReport();
applyDashboardPreferences();
updateGoalSemaphores();
