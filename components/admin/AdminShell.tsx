import type { ReactNode } from "react";
import { Activity, AlertTriangle, BarChart3, BellRing, Building2, CreditCard, FileText, Gauge, Headphones, LockKeyhole, Search, ShieldCheck, TimerReset } from "lucide-react";
import { adminRoleLabel } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

type AdminSession = {
  userName: string;
  userEmail: string;
  adminRole: AdminRole;
};

type AdminShellProps = {
  active: "resumen" | "busqueda" | "clientes" | "pagos" | "suscripciones" | "metricas" | "facturas" | "soporte" | "actividad" | "auditoria" | "alertas-sistema" | "monitoreo";
  children: ReactNode;
  description: string;
  session: AdminSession;
  title: string;
};

const navItems = [
  { id: "resumen", href: "/admin", label: "Resumen", icon: Gauge },
  { id: "busqueda", href: "/admin/busqueda", label: "Búsqueda", icon: Search },
  { id: "clientes", href: "/admin/clientes", label: "Clientes", icon: Building2 },
  { id: "pagos", href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { id: "suscripciones", href: "/admin/suscripciones", label: "Suscripciones", icon: TimerReset },
  { id: "metricas", href: "/admin/metricas", label: "Métricas SaaS", icon: BarChart3 },
  { id: "facturas", href: "/admin/facturas", label: "Facturas", icon: FileText },
  { id: "soporte", href: "/admin/soporte", label: "Soporte", icon: Headphones },
  { id: "actividad", href: "/admin/actividad", label: "Actividad", icon: Activity },
  { id: "auditoria", href: "/admin/auditoria", label: "Auditoría", icon: LockKeyhole },
  { id: "alertas-sistema", href: "/admin/alertas-sistema", label: "Alertas sistema", icon: BellRing },
  { id: "monitoreo", href: "/admin/monitoreo", label: "Monitoreo", icon: AlertTriangle }
] as const;

export function AdminShell({ active, children, description, session, title }: AdminShellProps) {
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <a aria-current={active === item.id ? "page" : undefined} href={item.href} key={item.id}>
                <Icon size={18} />
                {item.label}
              </a>
            );
          })}
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-hero">
          <div>
            <span><ShieldCheck size={18} /> Acceso interno protegido</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <div className="admin-session-card">
            <small>Sesion activa</small>
            <strong>{session.userName}</strong>
            <span>{session.userEmail}</span>
            <em>{adminRoleLabel(session.adminRole)}</em>
            <AdminLogoutButton />
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function AdminNextStep({ children }: { children: ReactNode }) {
  return (
    <section className="admin-next-step">
      <Activity size={22} />
      <div>{children}</div>
    </section>
  );
}
