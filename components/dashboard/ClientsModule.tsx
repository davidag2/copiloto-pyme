"use client";

import type { FormEvent } from "react";
import { Link2 } from "lucide-react";
import { companyRoles, roleCapabilities, roleLabel } from "@/lib/roles";

type AuthUser = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

type TeamMember = {
  id: string;
  companyId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLoginAt?: string | null;
  createdAt: string;
};

type InviteForm = {
  email: string;
  role: string;
};

type ClientsModuleProps = {
  isActive: boolean;
  companyName: string;
  tenantShortId: string;
  authUser: AuthUser | null;
  activeRoleLabel: string;
  permissions: {
    canManageTeam: boolean;
    canImportData: boolean;
    canManageIntegrations: boolean;
    canGenerateReports: boolean;
    canManageRules: boolean;
    canRegisterDecisions: boolean;
  };
  inviteForm: InviteForm;
  inviteLink: string;
  teamMembers: TeamMember[];
  invitations: Invitation[];
  onRefreshTeam: () => void;
  onLogout: () => void;
  onInviteFormChange: (form: InviteForm) => void;
  onInviteTeamMember: (event: FormEvent<HTMLFormElement>) => void;
};

export function ClientsModule({
  isActive,
  companyName,
  tenantShortId,
  authUser,
  activeRoleLabel,
  permissions,
  inviteForm,
  inviteLink,
  teamMembers,
  invitations,
  onRefreshTeam,
  onLogout,
  onInviteFormChange,
  onInviteTeamMember
}: ClientsModuleProps) {
  return (
    <section className="team-panel dashboard-module-section" data-active={isActive}>
      <div className="panel-heading">
        <div><span><Link2 aria-hidden="true" />Autenticacion y equipo</span><h2>Roles por empresa</h2></div>
        <button className="secondary-button" type="button" onClick={onRefreshTeam}>Actualizar equipo</button>
      </div>
      <div className="tenant-scope-banner">
        <strong>{companyName}</strong>
        <span>Todos los usuarios, invitaciones, reportes, decisiones, integraciones y datos importados quedan filtrados por <b>company_id</b>: {tenantShortId}.</span>
      </div>
      <div className="team-layout">
        <div className="session-card">
          <span>Sesion activa</span>
          <strong>{authUser ? authUser.name : "Demo sin login"}</strong>
          <small>{authUser ? `${authUser.email} · ${activeRoleLabel}` : "Crea una cuenta o inicia sesion para activar roles reales."}</small>
          <div className="permission-list">
            <span data-enabled={permissions.canManageTeam}>Equipo</span>
            <span data-enabled={permissions.canImportData}>Importar</span>
            <span data-enabled={permissions.canManageIntegrations}>Integraciones</span>
            <span data-enabled={permissions.canGenerateReports}>Reportes</span>
            <span data-enabled={permissions.canManageRules}>Reglas</span>
          </div>
          <button className="ghost-button" type="button" onClick={onLogout}>Cerrar sesion</button>
        </div>
        <form className="invite-form" onSubmit={onInviteTeamMember}>
          <label>
            Email del invitado
            <input type="email" value={inviteForm.email} onChange={(event) => onInviteFormChange({ ...inviteForm, email: event.target.value })} required />
          </label>
          <label>
            Rol
            <select value={inviteForm.role} onChange={(event) => onInviteFormChange({ ...inviteForm, role: event.target.value })}>
              {companyRoles.filter((role) => role.value !== "propietario").map((role) => <option value={role.value} key={role.value}>{role.label}</option>)}
            </select>
          </label>
          <button className="primary-button" type="submit" disabled={!permissions.canManageTeam}>Invitar</button>
          {inviteLink && <small>Link demo: {inviteLink}</small>}
        </form>
      </div>
      <div className="role-matrix" aria-label="Permisos por rol">
        {companyRoles.map((role) => {
          const capability = roleCapabilities(role.value);
          return (
            <article key={role.value}>
              <strong>{role.label}</strong>
              <span>{role.description}</span>
              <small>{[
                capability.canManageTeam && "equipo",
                capability.canImportData && "datos",
                capability.canManageIntegrations && "integraciones",
                capability.canGenerateReports && "reportes",
                capability.canRegisterDecisions && "decisiones"
              ].filter(Boolean).join(" · ")}</small>
            </article>
          );
        })}
      </div>
      <div className="team-grid">
        {teamMembers.map((member) => (
          <article className="team-member-card" data-status={member.status} key={member.id}>
            <strong>{member.name}</strong>
            <span>{member.email}</span>
            <small>{roleLabel(member.role)} · {member.status}</small>
          </article>
        ))}
        {invitations.map((invitation) => (
          <article className="team-member-card" data-status={invitation.status} key={invitation.id}>
            <strong>Invitacion pendiente</strong>
            <span>{invitation.email}</span>
            <small>{roleLabel(invitation.role)} · expira {new Date(invitation.expiresAt).toLocaleDateString("es-CO")}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
