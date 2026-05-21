import { Building2, CalendarDays, Mail, MapPin, ShieldCheck, Users } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { getAdminClients } from "@/lib/admin-clients";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminClientsPage() {
  const adminSession = await requireAdminPageSession("/admin/clientes");
  const { clients, summary } = await getAdminClients();

  return (
    <AdminShell
      active="clientes"
      description="Gestiona empresas registradas, usuarios, planes, estado de acceso y actividad comercial."
      session={adminSession}
      title="Clientes"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de clientes">
        <article><small>Empresas registradas</small><strong>{summary.total}</strong><span>{summary.users} usuario(s) creados</span></article>
        <article><small>Pruebas gratis</small><strong>{summary.trial}</strong><span>Primer mes incluido</span></article>
        <article><small>Clientes activos</small><strong>{summary.active}</strong><span>Con suscripción vigente</span></article>
        <article><small>Pago pendiente</small><strong>{summary.pastDue}</strong><span>Requieren seguimiento</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><Building2 size={18} /> Empresas SaaS</span>
            <h2>Clientes registrados</h2>
          </div>
          <a href="/admin/clientes">Actualizar</a>
        </header>
        <div className="admin-client-list">
          {clients.length ? clients.map((client) => (
            <article key={client.id}>
              <i><Building2 size={18} /></i>
              <div>
                <strong>{client.name}</strong>
                <small><MapPin size={14} /> {client.country} · {client.businessType} · {client.planLabel}</small>
                <small><Mail size={14} /> {client.ownerEmail || "Sin email principal"}</small>
              </div>
              <span data-status={client.statusLabel}>{client.statusLabel}</span>
              <a href={`/admin/clientes/${client.id}`}>Ver ficha</a>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay empresas registradas.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid admin-client-insights">
        {clients.slice(0, 4).map((client) => (
          <article key={`${client.id}-insight`}>
            <ShieldCheck size={24} />
            <div>
              <h2>{client.name}</h2>
              <p>{client.ownerName || "Sin propietario registrado"} · {client.usersCount} usuario(s)</p>
              <p><CalendarDays size={14} /> Alta: {client.createdLabel} · Renovación/prueba: {client.renewalLabel}</p>
              <p><Users size={14} /> Último acceso: {client.lastLoginLabel}</p>
            </div>
          </article>
        ))}
        {!clients.length ? (
          <>
            <article><ShieldCheck size={24} /><div><h2>Acceso</h2><p>Cuando haya clientes, aquí verás estado de dashboard, prueba gratis, plan activo y bloqueo por pago.</p></div></article>
            <article><Mail size={24} /><div><h2>Contacto</h2><p>Email principal, responsable, teléfono y canal de soporte.</p></div></article>
          </>
        ) : null}
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Crear ficha individual de cliente para ver usuarios, pagos, facturas SIIGO, historial de soporte y estado de acceso.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
