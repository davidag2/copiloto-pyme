"use client";

import { MailPlus, ShieldCheck, Users, UserRoundCheck } from "lucide-react";

type TeamModuleProps = {
  isActive: boolean;
};

const members: string[][] = [];

const roles = [
  ["Propietario", "Control total del negocio, pagos, usuarios y configuración."],
  ["Administrador", "Administra ventas, inventario, caja, reportes y equipo operativo."],
  ["Contador", "Consulta caja, reportes, facturación, impuestos y exportaciones."],
  ["Ventas", "Registra ventas, clientes y seguimiento comercial."]
];

export function TeamModule({ isActive }: TeamModuleProps) {
  return (
    <section className="team-command-center dashboard-module-section" data-active={isActive}>
      <header className="team-page-heading">
        <div>
          <h2>Equipo</h2>
          <p>Administra usuarios, roles, permisos e invitaciones de tu empresa.</p>
        </div>
        <button className="primary-button" type="button"><MailPlus aria-hidden="true" />Invitar usuario</button>
      </header>

      <div className="team-kpi-row">
        <article><Users aria-hidden="true" /><span>Usuarios activos</span><strong>0</strong><small>Sin invitaciones pendientes</small></article>
        <article><ShieldCheck aria-hidden="true" /><span>Roles disponibles</span><strong>{roles.length}</strong><small>Listos para asignar</small></article>
        <article><UserRoundCheck aria-hidden="true" /><span>Último acceso</span><strong>Sin accesos</strong><small>Invita usuarios para empezar</small></article>
      </div>

      <div className="team-command-layout">
        <section className="team-members-panel">
          <header><strong>Miembros del equipo</strong><button type="button">Ver todos</button></header>
          <div>
            {members.map(([name, role, email, status]) => (
              <article key={email}>
                <i>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i>
                <div><strong>{name}</strong><span>{email}</span></div>
                <b>{role}</b>
                <mark data-status={status}>{status}</mark>
              </article>
            ))}
            {!members.length ? <p className="module-empty-note">Sin miembros de equipo. Invita usuarios cuando quieras delegar ventas, caja, inventario o reportes.</p> : null}
          </div>
        </section>

        <aside className="team-roles-panel">
          <header><strong>Permisos por rol</strong></header>
          {roles.map(([role, description]) => (
            <article key={role}>
              <strong>{role}</strong>
              <p>{description}</p>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
