"use client";

import { MailPlus, ShieldCheck, Users, UserRoundCheck } from "lucide-react";
import { getPlanSeatAccess } from "@/lib/plans";

type TeamModuleProps = {
  isActive: boolean;
  plan: string;
};

const members: string[][] = [];

export function TeamModule({ isActive, plan }: TeamModuleProps) {
  const seatAccess = getPlanSeatAccess(plan);
  const seats = Array.from({ length: seatAccess.totalSeats }, (_, index) => {
    if (index === 0) {
      return ["Asiento maestro", "Reservado para la cuenta maestra que administra la empresa y entrega permisos."];
    }
    return [`Invitado ${index}`, "Disponible para un integrante con permiso para ver y editar información."];
  });

  return (
    <section className="team-command-center dashboard-module-section" data-active={isActive}>
      <header className="team-page-heading">
        <div>
          <h2>Equipo</h2>
          <p>Administra asientos, permisos e invitaciones según el plan activo de tu empresa.</p>
        </div>
        <button className="primary-button" type="button"><MailPlus aria-hidden="true" />Invitar usuario</button>
      </header>

      <div className="team-kpi-row">
        <article><Users aria-hidden="true" /><span>Usuarios activos</span><strong>0</strong><small>Sin invitaciones pendientes</small></article>
        <article><ShieldCheck aria-hidden="true" /><span>Asientos incluidos</span><strong>{seatAccess.totalSeats}</strong><small>{seatAccess.label}</small></article>
        <article><UserRoundCheck aria-hidden="true" /><span>Invitados incluidos</span><strong>{seatAccess.invitedSeats}</strong><small>{seatAccess.invitedSeats ? "Pueden ver y editar" : "Disponible desde Basic"}</small></article>
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
            {!members.length ? <p className="module-empty-note">Sin miembros de equipo. La cuenta maestra ya ocupa el primer asiento; invita usuarios cuando tu plan incluya asientos adicionales.</p> : null}
          </div>
        </section>

        <aside className="team-roles-panel">
          <header><strong>Asientos del plan {plan.toUpperCase()}</strong></header>
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
