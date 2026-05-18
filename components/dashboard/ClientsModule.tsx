"use client";

import type { FormEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  CalendarDays,
  ChevronRight,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Sparkles,
  TrendingUp,
  TriangleAlert,
  UserPlus,
  Users
} from "lucide-react";

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

const importantClients = [
  ["CO", "Café Oriente", "cafeoriente@correo.com", "300 123 4567", "Hace 12 días", "$3.850.000", "Activo"],
  ["DH", "Dulce Hogar", "contacto@dulcehogar.com", "300 765 4321", "Hace 5 días", "$2.450.000", "Cliente frecuente"],
  ["ML", "Mercado La 80", "mercado80@correo.com", "301 456 7890", "Hace 28 días", "$1.250.000", "Inactivo"]
];

const pipeline = [
  ["Prospectos", "12", "clientes", ["Panadería Central", "Tienda El Buen Precio", "Distribuciones MG", "+ 9 más"], "purple"],
  ["Contactados", "8", "clientes", ["Supermercado del Café", "Dulces del Valle", "Mercado Express", "+ 5 más"], "blue"],
  ["Negociación", "4", "clientes", ["Café San Alberto", "Almacenes La 14", "Tienda Doña María", "+ 1 más"], "orange"],
  ["Cerrados", "18", "ventas", ["Café Oriente", "Dulce Hogar", "Mercado La 80", "+ 15 más"], "green"]
];

const followUps = [
  ["Enviar catálogo a Café Oriente", "WhatsApp", "Hoy, 10:00 a.m.", MessageCircle],
  ["Llamar a Dulce Hogar", "Llamada", "Hoy, 2:30 p.m.", Phone],
  ["Reunión con Mercado La 80", "Reunión", "Mañana, 9:00 a.m.", CalendarDays],
  ["Dar seguimiento a Tienda Express", "Pendiente", "23 may, 11:00 a.m.", Bell]
] satisfies Array<[string, string, string, LucideIcon]>;

const insights = [
  ["Oportunidad", "Café Oriente está listo para una nueva compra.", "Probabilidad alta de venta.", TrendingUp, "green"],
  ["Riesgo", "Mercado La 80 no compra hace 28 días.", "Requiere seguimiento.", TriangleAlert, "red"],
  ["Acción recomendada", "Envía promoción de Café Premium a 3 clientes frecuentes esta semana.", "", Megaphone, "blue"]
] satisfies Array<[string, string, string, LucideIcon, string]>;

const clientKpis: Array<{ label: string; value: string; helper: string; icon: LucideIcon; tone: string }> = [
  { label: "Clientes activos", value: "248", helper: "+12 este mes", icon: Users, tone: "purple" },
  { label: "Clientes nuevos", value: "18", helper: "Este mes", icon: UserPlus, tone: "green" },
  { label: "Clientes inactivos", value: "12", helper: "Requieren seguimiento", icon: Users, tone: "red" },
  { label: "Ticket promedio", value: "$185.000", helper: "Este mes", icon: CalendarDays, tone: "blue" }
];

const followUpItems: Array<{ title: string; channel: string; time: string; icon: LucideIcon }> = followUps.map(([title, channel, time, icon]) => ({
  title,
  channel,
  time,
  icon
}));

export function ClientsModule({ isActive }: ClientsModuleProps) {
  return (
    <section className="clients-command-center dashboard-module-section" data-active={isActive}>
      <header className="clients-page-heading">
        <div>
          <h2>Clientes</h2>
          <p>Gestiona relaciones, aumenta ventas y fideliza clientes con la ayuda de la IA.</p>
        </div>
        <div className="clients-page-actions">
          <button className="clients-icon-button" aria-label="Buscar cliente" type="button"><Search aria-hidden="true" /></button>
          <button className="clients-date-button" type="button"><CalendarDays aria-hidden="true" />14 may - 20 may, 2026</button>
          <button className="clients-icon-button" aria-label="Notificaciones" type="button"><Bell aria-hidden="true" /></button>
          <button className="primary-button" type="button"><Plus aria-hidden="true" />Nuevo cliente</button>
        </div>
      </header>

      <div className="clients-hero-grid">
        <article className="clients-ai-card">
          <div className="clients-ai-orb"><Sparkles aria-hidden="true" /></div>
          <div>
            <span>Copiloto de clientes</span>
            <h3>La IA encontró 3 clientes listos para volver a comprar.</h3>
            <p>Contacta Café Oriente y Dulce Hogar esta semana.</p>
            <footer><small>Posibles ventas:</small><b>+$2.800.000</b></footer>
          </div>
        </article>

        {clientKpis.map(({ label, value, helper, icon: KpiIcon, tone }) => {
          return (
            <article className="clients-kpi-card" data-tone={tone} key={String(label)}>
              <span><KpiIcon aria-hidden="true" /></span>
              <small>{label}</small>
              <strong>{value}</strong>
              <em>{helper}</em>
            </article>
          );
        })}
      </div>

      <div className="clients-main-layout">
        <section className="clients-important-panel">
          <header><strong>Clientes importantes</strong><button type="button">Ver todos</button></header>
          <div>
            {importantClients.map(([initials, name, email, phone, lastBuy, total, status]) => (
              <article key={email}>
                <i>{initials}</i>
                <div><strong>{name}</strong><span>{email}</span><small><MessageCircle aria-hidden="true" />{phone}</small></div>
                <div><span>Última compra</span><b>{lastBuy}</b><mark data-status={status}>{status}</mark></div>
                <div><span>Total compras</span><b>{total}</b></div>
                <button aria-label={`Ver ${name}`} type="button"><ChevronRight aria-hidden="true" /></button>
              </article>
            ))}
          </div>
        </section>

        <section className="clients-pipeline-panel">
          <header><strong>Pipeline de ventas</strong><button type="button">Ver embudo completo</button></header>
          <div>
            {pipeline.map(([title, count, unit, names, tone]) => (
              <article data-tone={tone} key={String(title)}>
                <span>{title}</span>
                <strong>{count}</strong>
                <small>{unit}</small>
                {(names as string[]).map((name) => <p key={name}>{name}</p>)}
              </article>
            ))}
          </div>
        </section>
      </div>

      <div className="clients-bottom-layout">
        <section className="clients-follow-panel">
          <header><strong>Seguimientos próximos</strong><button type="button">Ver todos</button></header>
          {followUpItems.map(({ title, channel, time, icon: FollowIcon }) => {
            return (
              <article key={String(title)}>
                <span><FollowIcon aria-hidden="true" /></span>
                <div><strong>{title}</strong><small>{channel}</small></div>
                <time>{time}</time>
              </article>
            );
          })}
          <button className="clients-full-button" type="button"><Plus aria-hidden="true" />Agregar seguimiento</button>
        </section>

        <section className="clients-featured-panel">
          <header><strong>Cliente destacado</strong><button type="button">Ver perfil completo</button></header>
          <div className="clients-featured-head">
            <i>CO</i>
            <div><strong>Café Oriente</strong><span>Activo</span><small>Cliente desde Abr 2024</small></div>
          </div>
          <div className="clients-contact-actions">
            <button type="button"><MessageCircle aria-hidden="true" />WhatsApp</button>
            <button type="button"><Phone aria-hidden="true" />Llamar</button>
            <button type="button"><Mail aria-hidden="true" />Correo</button>
          </div>
          <div className="clients-featured-kpis">
            <article><span>Total compras</span><strong>$3.850.000</strong></article>
            <article><span>Compras</span><strong>12</strong></article>
            <article><span>Deuda actual</span><strong>$0</strong></article>
            <article><span>Ticket promedio</span><strong>$320.000</strong></article>
          </div>
          <footer><span>Café Premium</span><span>Panela Orgánica</span><span>Azúcar Integral</span></footer>
        </section>

        <section className="clients-insights-panel">
          <header><strong>Insights de la IA</strong><button type="button">Ver todos</button></header>
          {insights.map(([label, title, text, InsightIcon, tone]) => {
            return (
              <article data-tone={tone} key={String(title)}>
                <span><InsightIcon aria-hidden="true" /></span>
                <div><strong>{label}</strong><p>{title}</p>{text && <small>{text}</small>}</div>
              </article>
            );
          })}
          <button className="clients-link-button" type="button">Ver todas las recomendaciones <ChevronRight aria-hidden="true" /></button>
        </section>
      </div>
    </section>
  );
}
