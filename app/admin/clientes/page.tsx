import { Building2, CalendarDays, Clock3, Mail, MapPin, ShieldCheck, Trash2, Users } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { AdminRestoreClientButton } from "@/components/admin/AdminRestoreClientButton";
import { getAdminClients } from "@/lib/admin-clients";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminClientsPage() {
  const adminSession = await requireAdminPageSession("/admin/clientes");
  const { clients, deletedClients, summary, waitlistClients } = await getAdminClients();

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
        <article><small>Waitlist</small><strong>{summary.waitlist}</strong><span>Esperando activación</span></article>
        <article><small>Clientes activos</small><strong>{summary.active}</strong><span>Con suscripción vigente</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><Clock3 size={18} /> Lista de espera</span>
            <h2>Personas en waitlist</h2>
          </div>
          <a href="/admin/clientes">Actualizar</a>
        </header>
        <div className="admin-client-list">
          {waitlistClients.length ? waitlistClients.map((client) => (
            <article key={`${client.id}-waitlist`}>
              <i><Clock3 size={18} /></i>
              <div>
                <strong>{client.ownerName || client.name}</strong>
                <small><Building2 size={14} /> {client.name} - {client.planLabel} - Turno {client.waitlistTurn}</small>
                <small><Mail size={14} /> {client.ownerEmail || "Sin email principal"}</small>
              </div>
              <span data-status="Waitlist">Waitlist</span>
              <a href={`/admin/clientes/${client.id}`}>Ver ficha</a>
            </article>
          )) : (
            <p className="admin-empty-note">No hay personas en waitlist.</p>
          )}
        </div>
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
                <small><MapPin size={14} /> {client.country} - {client.businessType} - {client.planLabel}</small>
                <small><Mail size={14} /> {client.ownerEmail || "Sin email principal"}</small>
              </div>
              <span data-status={client.accessStage === "Waitlist" ? "Waitlist" : client.statusLabel}>
                {client.accessStage === "Waitlist" ? "Waitlist" : client.statusLabel}
              </span>
              <a href={`/admin/clientes/${client.id}`}>Ver ficha</a>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay empresas registradas.</p>
          )}
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><Trash2 size={18} /> Clientes borrados</span>
            <h2>Papelera restaurable</h2>
          </div>
          <a href="/admin/clientes">Actualizar</a>
        </header>
        <div className="admin-client-list">
          {deletedClients.length ? deletedClients.map((client) => (
            <article key={`${client.id}-deleted`}>
              <i><Trash2 size={18} /></i>
              <div>
                <strong>{client.name}</strong>
                <small>Eliminado: {client.deletedLabel} - {client.deletionReason || "Sin motivo"}</small>
                <small><Mail size={14} /> {client.ownerEmail || "Sin email principal"}</small>
              </div>
              <span data-status="Cancelado">Borrado</span>
              <AdminRestoreClientButton companyId={client.id} />
            </article>
          )) : (
            <p className="admin-empty-note">No hay clientes borrados.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid admin-client-insights">
        {clients.slice(0, 4).map((client) => (
          <article key={`${client.id}-insight`}>
            <ShieldCheck size={24} />
            <div>
              <h2>{client.name}</h2>
              <p>{client.ownerName || "Sin propietario registrado"} - {client.usersCount} usuario(s)</p>
              <p><CalendarDays size={14} /> Alta: {client.createdLabel} - Renovación/prueba: {client.renewalLabel}</p>
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
        <p>Conectar recordatorios a email/WhatsApp real y convertir el reenvío de link de pago en integración directa con la pasarela activa.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
