export type PlanId = "go" | "basic" | "pro";

export type CommercialPlan = {
  id: PlanId;
  name: string;
  priceCop: number;
  priceLabel: string;
  trialDays: number;
  href: string;
  badge?: string;
  highlighted?: boolean;
  features: string[];
};

export const trialDays = 30;

export const commercialPlans: CommercialPlan[] = [
  {
    id: "go",
    name: "Go",
    priceCop: 20_000,
    priceLabel: "COP $20.000 / mes",
    trialDays,
    href: "/register?plan=go",
    features: [
      "1 mes gratis",
      "Acceso a Inicio",
      "Módulo Ventas",
      "Módulo Caja",
      "Dashboard simple con IA",
      "1 asiento para ver y editar información"
    ]
  },
  {
    id: "basic",
    name: "Basic",
    priceCop: 50_000,
    priceLabel: "COP $50.000 / mes",
    trialDays,
    href: "/register?plan=basic",
    badge: "Recomendado",
    highlighted: true,
    features: [
      "1 mes gratis",
      "Acceso a Inicio",
      "Módulo Ventas",
      "Módulo Caja",
      "Módulo Inventario",
      "Módulo Clientes",
      "Alertas básicas",
      "Reportes principales",
      "3 asientos para ver y editar información"
    ]
  },
  {
    id: "pro",
    name: "Pro",
    priceCop: 100_000,
    priceLabel: "COP $100.000 / mes",
    trialDays,
    href: "/register?plan=pro",
    features: [
      "1 mes gratis",
      "Acceso a todos los módulos",
      "Ventas, Caja, Inventario y Clientes",
      "Equipo, Datos, Reportes, Alertas y Configuración",
      "Alertas inteligentes",
      "Proyección de caja",
      "Decisiones y recomendaciones con IA",
      "Roles de equipo",
      "5 asientos para ver y editar información",
      "Prioridad en soporte"
    ]
  }
];

export function normalizePlanId(value: unknown): PlanId {
  const normalized = String(value || "").trim().toLowerCase();
  return commercialPlans.some((plan) => plan.id === normalized) ? normalized as PlanId : "go";
}

export function getPlanById(value: unknown) {
  const planId = normalizePlanId(value);
  return commercialPlans.find((plan) => plan.id === planId) ?? commercialPlans[0];
}

export function getTrialEndsAt(startDate = new Date()) {
  const trialEnd = new Date(startDate);
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  return trialEnd;
}
