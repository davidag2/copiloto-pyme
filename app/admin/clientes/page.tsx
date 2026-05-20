import { Building2, Mail, MapPin, ShieldCheck } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";

const sampleClients = [
  ["Distribuidora Andina", "Plan GO", "Activo", "Bogota"],
  ["Cafe Oriente", "Plan Pro", "Prueba gratis", "Medellin"],
  ["Mercado La 80", "Basic", "Pago pendiente", "Cali"]
];

export default async function AdminClientsPage() {
  const adminSession = await requireAdminPageSession("/admin/clientes");

  return (
    <AdminShell
      active="clientes"
      description="Gestiona empresas registradas, usuarios, planes, estado de acceso y actividad comercial."
      session={adminSession}
      title="Clientes"
    >
      <section className="admin-table-card">
        <header>
          <div>
            <span><Building2 size={18} /> Empresas SaaS</span>
            <h2>Clientes registrados</h2>
          </div>
          <button type="button">Exportar</button>
        </header>
        <div className="admin-client-list">
          {sampleClients.map(([name, plan, status, city]) => (
            <article key={name}>
              <i><Building2 size={18} /></i>
              <div>
                <strong>{name}</strong>
                <small><MapPin size={14} /> {city} · {plan}</small>
              </div>
              <span data-status={status}>{status}</span>
              <a href={`/admin/clientes?empresa=${encodeURIComponent(name)}`}>Ver ficha</a>
            </article>
          ))}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><ShieldCheck size={24} /><div><h2>Acceso</h2><p>Estado del dashboard, prueba gratis, plan activo y bloqueo por pago.</p></div></article>
        <article><Mail size={24} /><div><h2>Contacto</h2><p>Email principal, responsable, telefono y canal de soporte.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar esta vista a `companies`, `users`, `subscriptions` y ultimo acceso real.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
