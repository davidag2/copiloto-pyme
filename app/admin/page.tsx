import { AlertTriangle, Building2, CreditCard, FileText } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { adminRoles } from "@/lib/admin-roles";
import { requireAdminPageSession } from "@/lib/admin-page";

const adminModules = [
  {
    title: "Clientes registrados",
    description: "Empresas, usuarios, planes, estado de acceso y ultimo movimiento.",
    icon: Building2
  },
  {
    title: "Pagos y suscripciones",
    description: "Pruebas gratis, pagos pendientes, renovaciones y bloqueos por vencimiento.",
    icon: CreditCard
  },
  {
    title: "Facturacion SIIGO",
    description: "Facturas emitidas, errores de integracion, reintentos y trazabilidad.",
    icon: FileText
  },
  {
    title: "Monitoreo del sistema",
    description: "Alertas tecnicas, errores API, tiempos de respuesta y salud de servicios.",
    icon: AlertTriangle
  }
];

export default async function AdminPage() {
  const adminSession = await requireAdminPageSession("/admin");

  return (
    <AdminShell
      active="resumen"
      description="Centro de control para revisar clientes, pagos, facturas, alertas e integridad operativa de Copiloto Pyme."
      session={adminSession}
      title="Dashboard Administrativo"
    >
        <section className="admin-role-grid" aria-label="Roles administrativos">
          {adminRoles.map((role) => (
            <article key={role.value} data-active={role.value === adminSession.adminRole}>
              <strong>{role.label}</strong>
              <p>{role.description}</p>
              <span>{role.value}</span>
            </article>
          ))}
        </section>

        <section className="admin-kpi-grid" aria-label="Resumen administrativo">
          <article>
            <small>Clientes SaaS</small>
            <strong>0</strong>
            <span>Listo para conectar datos reales</span>
          </article>
          <article>
            <small>Pagos pendientes</small>
            <strong>$0</strong>
            <span>Wompi, Bold, Mercado Pago y Efecty</span>
          </article>
          <article>
            <small>Facturas SIIGO</small>
            <strong>0</strong>
            <span>Modulo pendiente de conexion</span>
          </article>
          <article>
            <small>Alertas servidor</small>
            <strong>0</strong>
            <span>Monitoreo operativo por integrar</span>
          </article>
        </section>

        <section className="admin-module-grid">
          {adminModules.map((module) => {
            const Icon = module.icon;
            return (
              <article key={module.title}>
                <Icon size={24} />
                <div>
                  <h2>{module.title}</h2>
                  <p>{module.description}</p>
                </div>
              </article>
            );
          })}
        </section>

        <AdminNextStep>
          <strong>Siguiente paso</strong>
          <p>Conectar el modulo de clientes para ver empresas registradas, plan actual, estado de pago y fecha de alta.</p>
        </AdminNextStep>
    </AdminShell>
  );
}
