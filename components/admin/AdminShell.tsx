import type { ReactNode } from "react";
import { Activity, AlertTriangle, Building2, CreditCard, FileText, Gauge, ShieldCheck, TimerReset } from "lucide-react";
import { adminRoleLabel } from "@/lib/admin-roles";
import type { AdminRole } from "@/lib/admin-roles";
import { AdminLogoutButton } from "@/components/admin/AdminLogoutButton";

type AdminSession = {
  userName: string;
  userEmail: string;
  adminRole: AdminRole;
};

type AdminShellProps = {
  active: "resumen" | "clientes" | "pagos" | "suscripciones" | "facturas" | "monitoreo";
  children: ReactNode;
  description: string;
  session: AdminSession;
  title: string;
};

const navItems = [
  { id: "resumen", href: "/admin", label: "Resumen", icon: Gauge },
  { id: "clientes", href: "/admin/clientes", label: "Clientes", icon: Building2 },
  { id: "pagos", href: "/admin/pagos", label: "Pagos", icon: CreditCard },
  { id: "suscripciones", href: "/admin/suscripciones", label: "Suscripciones", icon: TimerReset },
  { id: "facturas", href: "/admin/facturas", label: "Facturas", icon: FileText },
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
