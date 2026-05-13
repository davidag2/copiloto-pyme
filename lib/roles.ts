export type CompanyRole = "propietario" | "administrador" | "contador" | "ventas";

export const companyRoles: Array<{ value: CompanyRole; label: string; description: string }> = [
  { value: "propietario", label: "Propietario", description: "Control total de empresa, equipo, datos y facturacion." },
  { value: "administrador", label: "Administrador", description: "Gestiona operacion, reglas, integraciones y equipo." },
  { value: "contador", label: "Contador", description: "Acceso a caja, reportes, margen y datos financieros." },
  { value: "ventas", label: "Ventas", description: "Consulta ventas, clientes, metas y registra acciones comerciales." }
];

const legacyRoleMap: Record<string, CompanyRole> = {
  dueno: "propietario",
  owner: "propietario",
  admin: "administrador",
  finance: "contador",
  sales: "ventas",
  operaciones: "administrador",
  operations: "administrador",
  viewer: "ventas"
};

export function normalizeRole(role: string | null | undefined): CompanyRole {
  const value = String(role || "").toLowerCase();
  if (companyRoles.some((item) => item.value === value)) return value as CompanyRole;
  return legacyRoleMap[value] || "ventas";
}

export function roleLabel(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return companyRoles.find((item) => item.value === normalized)?.label || "Ventas";
}

export function canManageTeam(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return normalized === "propietario" || normalized === "administrador";
}

export function roleCapabilities(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return {
    canManageTeam: canManageTeam(normalized),
    canManageBilling: normalized === "propietario",
    canManageIntegrations: normalized === "propietario" || normalized === "administrador",
    canManageRules: normalized === "propietario" || normalized === "administrador",
    canImportData: normalized === "propietario" || normalized === "administrador" || normalized === "contador",
    canGenerateReports: normalized === "propietario" || normalized === "administrador" || normalized === "contador",
    canRegisterSales: normalized === "propietario" || normalized === "administrador" || normalized === "ventas",
    canRegisterDecisions: normalized !== "contador"
  };
}
