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
    features: ["1 mes gratis", "Lectura diaria con IA", "Ventas, caja e inventario", "Alertas básicas"]
  },
  {
    id: "basic",
    name: "Basic",
    priceCop: 50_000,
    priceLabel: "COP $50.000 / mes",
    trialDays,
    href: "/register?plan=basic",
    badge: "Más popular",
    highlighted: true,
    features: ["1 mes gratis", "Todo lo del plan Go", "Proyección de caja", "Alertas inteligentes", "Soporte estándar"]
  },
  {
    id: "pro",
    name: "Pro",
    priceCop: 100_000,
    priceLabel: "COP $100.000 / mes",
    trialDays,
    href: "/register?plan=pro",
    features: ["1 mes gratis", "Todo lo del plan Basic", "Roles de equipo", "Reporte semanal", "Prioridad en soporte"]
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
