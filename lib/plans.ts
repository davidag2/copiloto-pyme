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
    features: ["1 empresa", "1 mes gratis", "Dashboard simple", "Lectura diaria con IA"]
  },
  {
    id: "basic",
    name: "Basic",
    priceCop: 50_000,
    priceLabel: "COP $50.000 / mes",
    trialDays,
    href: "/register?plan=basic",
    features: ["Hasta 2 empresas", "Alertas básicas", "Ventas, caja e inventario", "Soporte estándar"]
  },
  {
    id: "pro",
    name: "Pro",
    priceCop: 100_000,
    priceLabel: "COP $100.000 / mes",
    trialDays,
    href: "/register?plan=pro",
    badge: "Recomendado",
    highlighted: true,
    features: ["Hasta 5 empresas", "Alertas inteligentes", "Proyección de caja", "Roles de equipo"]
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
