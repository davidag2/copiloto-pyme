export type PlanId = "go" | "basic" | "pro";
export type PlanModuleId =
  | "inicio"
  | "ventas"
  | "caja"
  | "inventario"
  | "clientes"
  | "proyecciones"
  | "equipo"
  | "datos"
  | "reportes"
  | "alertas"
  | "configuracion";

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

export type PlanSeatAccess = {
  masterSeats: number;
  invitedSeats: number;
  totalSeats: number;
  label: string;
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
      "Inicio",
      "Ventas",
      "Caja",
      "Equipo",
      "Datos",
      "Reportes",
      "Alertas",
      "Configuración",
      "Cuenta maestra incluida",
      "Sin invitados incluidos"
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
      "Todo lo de GO",
      "Inventario",
      "Clientes",
      "Cuenta maestra + 2 invitados",
      "Invitados con permiso para ver y editar"
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
      "Todo lo de BASIC",
      "Proyecciones",
      "Motor IA para tendencias y resultados esperados",
      "Cuenta maestra + 4 invitados",
      "Invitados con permiso para ver y editar",
      "Prioridad en soporte"
    ]
  }
];

export const planSeatAccess: Record<PlanId, PlanSeatAccess> = {
  go: {
    masterSeats: 1,
    invitedSeats: 0,
    totalSeats: 1,
    label: "Cuenta maestra incluida"
  },
  basic: {
    masterSeats: 1,
    invitedSeats: 2,
    totalSeats: 3,
    label: "Cuenta maestra + 2 invitados"
  },
  pro: {
    masterSeats: 1,
    invitedSeats: 4,
    totalSeats: 5,
    label: "Cuenta maestra + 4 invitados"
  }
};

export const planModuleAccess: Record<PlanId, PlanModuleId[]> = {
  go: ["inicio", "ventas", "caja", "equipo", "datos", "reportes", "alertas", "configuracion"],
  basic: ["inicio", "ventas", "caja", "equipo", "datos", "reportes", "alertas", "configuracion", "inventario", "clientes"],
  pro: ["inicio", "ventas", "caja", "equipo", "datos", "reportes", "alertas", "configuracion", "inventario", "clientes", "proyecciones"]
};

export function normalizePlanId(value: unknown): PlanId {
  const normalized = String(value || "").trim().toLowerCase();
  return commercialPlans.some((plan) => plan.id === normalized) ? normalized as PlanId : "go";
}

export function getPlanById(value: unknown) {
  const planId = normalizePlanId(value);
  return commercialPlans.find((plan) => plan.id === planId) ?? commercialPlans[0];
}

export function getPlanModuleAccess(value: unknown) {
  return planModuleAccess[normalizePlanId(value)];
}

export function getPlanSeatAccess(value: unknown) {
  return planSeatAccess[normalizePlanId(value)];
}

export function planIncludesModule(plan: unknown, moduleId: PlanModuleId) {
  return getPlanModuleAccess(plan).includes(moduleId);
}

export function getTrialEndsAt(startDate = new Date()) {
  const trialEnd = new Date(startDate);
  trialEnd.setDate(trialEnd.getDate() + trialDays);
  return trialEnd;
}
