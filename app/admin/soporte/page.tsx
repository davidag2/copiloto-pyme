import { AlertTriangle, Ban, Clock3, Headphones, LifeBuoy, PlugZap, UserRoundCheck } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminSupport } from "@/lib/admin-support";

export default async function AdminSupportPage() {
  const adminSession = await requireAdminPageSession("/admin/soporte");
  const { cases, operations, summary } = await getAdminSupport();

  return (
    <AdminShell
      active="soporte"
      description="Gestiona solicitudes de clientes, problemas, dudas, onboarding pendiente, cuentas bloqueadas y errores de integración."
      session={adminSession}
      title="Soporte"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de soporte">
        <article><small>Casos abiertos</small><strong>{summary.openCases}</strong><span>{summary.inProgressCases} en progreso</span></article>
        <article><small>Onboarding pendiente</small><strong>{summary.onboardingPending}</strong><span>Clientes por acompañar</span></article>
        <article><small>Cuentas bloqueadas</small><strong>{summary.blockedAccounts}</strong><span>Requieren revisión de acceso</span></article>
        <article><small>Errores integración</small><strong>{summary.integrationErrors}</strong><span>SIIGO, DIAN o conectores</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><Headphones size={18} /> Bandeja de soporte</span>
            <h2>Solicitudes de clientes</h2>
          </div>
          <a href="/admin/clientes">Ver clientes</a>
        </header>
        <div className="admin-support-list">
          {cases.length ? cases.map((supportCase) => (
            <article key={supportCase.id}>
              <i><LifeBuoy size={18} /></i>
              <div>
                <strong>{supportCase.title}</strong>
                <small>{supportCase.companyName} · {supportCase.description || "Sin descripción"}</small>
                <small>Creado: {supportCase.createdLabel}</small>
              </div>
              <span data-status={supportCase.priorityLabel}>{supportCase.priorityLabel}</span>
              <span data-status={supportCase.statusLabel}>{supportCase.statusLabel}</span>
              <a href={`/admin/clientes/${supportCase.companyId}`}>Ver ficha</a>
            </article>
          )) : (
            <p className="admin-empty-note">No hay casos manuales de soporte abiertos todavía.</p>
          )}
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><AlertTriangle size={18} /> Cola operativa</span>
            <h2>Problemas detectados automáticamente</h2>
          </div>
          <a href="/admin/monitoreo">Ver monitoreo</a>
        </header>
        <div className="admin-support-list">
          {operations.length ? operations.map((item) => (
            <article key={`${item.type}-${item.id}`}>
              <i>{iconForType(item.type)}</i>
              <div>
                <strong>{item.title}</strong>
                <small>{item.companyName} · {item.description}</small>
                <small>{item.type} · {item.createdLabel}</small>
              </div>
              <span data-status={item.priorityLabel}>{item.priorityLabel}</span>
              <span data-status={item.statusLabel}>{item.statusLabel}</span>
              <a href={`/admin/clientes/${item.companyId}`}>Atender</a>
            </article>
          )) : (
            <p className="admin-empty-note">No hay onboarding pendiente, cuentas bloqueadas ni errores de integración detectados.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><UserRoundCheck size={24} /><div><h2>Onboarding</h2><p>Detecta clientes que aún no completan configuración inicial o carga de datos.</p></div></article>
        <article><Ban size={24} /><div><h2>Accesos</h2><p>Revisa cuentas bloqueadas, eliminadas o con restricciones operativas.</p></div></article>
        <article><PlugZap size={24} /><div><h2>Integraciones</h2><p>Prioriza errores de SIIGO, DIAN y conectores críticos.</p></div></article>
        <article><Clock3 size={24} /><div><h2>Seguimiento</h2><p>Centraliza dudas, problemas y casos creados desde la ficha del cliente.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Agregar acciones para asignar responsable, cambiar estado de caso y responder por email o WhatsApp desde esta bandeja.</p>
      </AdminNextStep>
    </AdminShell>
  );
}

function iconForType(type: string) {
  if (type === "Onboarding pendiente") return <UserRoundCheck size={18} />;
  if (type === "Cuenta bloqueada") return <Ban size={18} />;
  if (type === "Error de integración") return <PlugZap size={18} />;
  return <LifeBuoy size={18} />;
}
