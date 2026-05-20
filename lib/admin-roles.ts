export type AdminRole = "super_admin" | "soporte" | "finanzas" | "operaciones" | "lectura";

export const adminRoles: Array<{ value: AdminRole; label: string; description: string }> = [
  { value: "super_admin", label: "Superadmin", description: "Control total del panel administrativo y configuracion interna." },
  { value: "soporte", label: "Soporte", description: "Gestiona clientes, casos, accesos y acompanamiento operativo." },
  { value: "finanzas", label: "Finanzas", description: "Consulta pagos, suscripciones, cartera, facturas y conciliacion." },
  { value: "operaciones", label: "Operaciones", description: "Monitorea integraciones, salud del sistema, alertas y procesos." },
  { value: "lectura", label: "Lectura", description: "Acceso solo lectura para auditoria, seguimiento y reportes internos." }
];

const legacyAdminRoleMap: Record<string, AdminRole> = {
  admin: "super_admin",
  admin_soporte: "soporte",
  support: "soporte",
  finance: "finanzas",
  operations: "operaciones",
  operaciones_admin: "operaciones",
  viewer: "lectura",
  read_only: "lectura"
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole | null {
  const value = String(role || "").toLowerCase();
  if (adminRoles.some((item) => item.value === value)) return value as AdminRole;
  return legacyAdminRoleMap[value] || null;
}

export function adminRoleLabel(role: string | null | undefined) {
  const normalized = normalizeAdminRole(role);
  return adminRoles.find((item) => item.value === normalized)?.label || "Sin rol administrativo";
}

export function adminRoleCapabilities(role: string | null | undefined) {
  const normalized = normalizeAdminRole(role);
  return {
    canManageAdminUsers: normalized === "super_admin",
    canManageCustomers: normalized === "super_admin" || normalized === "soporte",
    canManageBilling: normalized === "super_admin" || normalized === "finanzas",
    canViewInvoices: normalized === "super_admin" || normalized === "finanzas" || normalized === "lectura",
    canViewMonitoring: normalized === "super_admin" || normalized === "operaciones" || normalized === "lectura",
    canManageIncidents: normalized === "super_admin" || normalized === "operaciones" || normalized === "soporte",
    canReadOnly: normalized === "lectura"
  };
}
