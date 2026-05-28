"use client";

import { MailPlus, ShieldCheck, Users, UserRoundCheck } from "lucide-react";

type TeamModuleProps = {
  isActive: boolean;
};

const members: string[][] = [];

const seats = [
  ["Asiento 1", "Disponible para el administrador maestro o propietario de la empresa."],
  ["Asiento 2", "Disponible para asignar a administración, operaciones o gerencia."],
  ["Asiento 3", "Disponible para asignar a contabilidad o finanzas."],
  ["Asiento 4", "Disponible para asignar al equipo comercial o ventas."],
  ["Asiento 5", "Disponible para asignar a otro integrante clave de la PYME."]
];

export function TeamModule({ isActive }: TeamModuleProps) {
  return (
    <section className="team-command-center dashboard-module-section" data-active={isActive}>
      <header className="team-page-heading">
        <div>
          <h2>Equipo</h2>
          <p>Administra usuarios, asientos, permisos e invitaciones de tu empresa.</p>
        </div>
        <button className="primary-button" type="button"><MailPlus aria-hidden="true" />Invitar usuario</button>
      </header>

      <div className="team-kpi-row">
        <article><Users aria-hidden="true" /><span>Usuarios activos</span><strong>0</strong><small>Sin invitaciones pendientes</small></article>
        <article><ShieldCheck aria-hidden="true" /><span>Asientos disponibles</span><strong>{seats.length}</strong><small>Listos para asignar</small></article>
        <article><UserRoundCheck aria-hidden="true" /><span>Último acceso</span><strong>Sin accesos</strong><small>Invita usuarios para empezar</small></article>
      </div>

      <div className="team-command-layout">
        <section className="team-members-panel">
          <header><strong>Miembros del equipo</strong><button type="button">Ver todos</button></header>
          <div>
            {members.map(([name, seat, email, status]) => (
              <article key={email}>
                <i>{name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</i>
                <div><strong>{name}</strong><span>{email}</span></div>
                <b>{seat}</b>
                <mark data-status={status}>{status}</mark>
              </article>
            ))}
            {!members.length ? <p className="module-empty-note">Sin miembros de equipo. Invita usuarios cuando quieras asignar asientos para ventas, caja, inventario o reportes.</p> : null}
          </div>
        </section>

        <aside className="team-roles-panel">
          <header><strong>Asientos</strong></header>
          {seats.map(([seat, description]) => (
            <article key={seat}>
              <strong>{seat}</strong>
              <p>{description}</p>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
