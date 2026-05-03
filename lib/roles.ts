export type CompanyRole = "dueno" | "administrador" | "contador" | "ventas" | "operaciones";

export const companyRoles: Array<{ value: CompanyRole; label: string; description: string }> = [
  { value: "dueno", label: "Propietario", description: "Control total de empresa, equipo, datos y facturacion." },
  { value: "administrador", label: "Administrador", description: "Gestiona operacion, reglas, integraciones y equipo." },
  { value: "contador", label: "Contador", description: "Acceso a caja, reportes, margen y datos financieros." },
  { value: "ventas", label: "Ventas", description: "Consulta ventas, clientes, metas y registra acciones comerciales." },
  { value: "operaciones", label: "Operaciones", description: "Gestiona inventario, integraciones y decisiones operativas." }
];

const legacyRoleMap: Record<string, CompanyRole> = {
  owner: "dueno",
  admin: "administrador",
  finance: "contador",
  sales: "ventas",
  operations: "operaciones",
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
  return normalized === "dueno" || normalized === "administrador";
}

export function roleCapabilities(role: string | null | undefined) {
  const normalized = normalizeRole(role);
  return {
    canManageTeam: canManageTeam(normalized),
    canManageBilling: normalized === "dueno",
    canManageIntegrations: normalized === "dueno" || normalized === "administrador" || normalized === "operaciones",
    canManageRules: normalized === "dueno" || normalized === "administrador",
    canImportData: normalized === "dueno" || normalized === "administrador" || normalized === "contador" || normalized === "operaciones",
    canGenerateReports: normalized === "dueno" || normalized === "administrador" || normalized === "contador",
    canRegisterDecisions: normalized !== "contador"
  };
}
