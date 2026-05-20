import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, AlertTriangle, Building2, CreditCard, FileText, ShieldCheck } from "lucide-react";
import { adminRoleLabel, adminRoles } from "@/lib/admin-roles";
import { validateAdminSession } from "@/lib/admin-access";

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
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const adminSession = await validateAdminSession(new Request("https://copiloto-pyme.local/admin", { headers: { cookie } }));

  if (!adminSession) redirect("/login?next=/admin");

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a className="mkt-brand" href="/admin">
          <span>CP</span>
          <div>
            <strong>Copiloto Pyme</strong>
            <small>Admin Tecnotitan</small>
          </div>
        </a>
        <nav aria-label="Modulos administrativos">
          <a aria-current="page" href="/admin">Resumen</a>
          <a href="/admin/clientes">Clientes</a>
          <a href="/admin/pagos">Pagos</a>
          <a href="/admin/facturas">Facturas</a>
          <a href="/admin/monitoreo">Monitoreo</a>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-hero">
          <div>
            <span><ShieldCheck size={18} /> Acceso interno protegido</span>
            <h1>Dashboard Administrativo</h1>
            <p>Centro de control para revisar clientes, pagos, facturas, alertas e integridad operativa de Copiloto Pyme.</p>
          </div>
          <div className="admin-session-card">
            <small>Sesion activa</small>
            <strong>{adminSession.userName}</strong>
            <span>{adminSession.userEmail}</span>
            <em>{adminRoleLabel(adminSession.adminRole)}</em>
          </div>
        </header>

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

        <section className="admin-next-step">
          <Activity size={22} />
          <div>
            <strong>Siguiente paso</strong>
            <p>Conectar el modulo de clientes para ver empresas registradas, plan actual, estado de pago y fecha de alta.</p>
          </div>
        </section>
      </section>
    </main>
  );
}
