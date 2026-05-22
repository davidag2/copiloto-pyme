import { Activity, AlertTriangle, Clock3, Database, Gauge, Server, ShieldCheck, Wifi } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminMonitoring } from "@/lib/admin-monitoring";

export default async function AdminMonitoringPage() {
  const adminSession = await requireAdminPageSession("/admin/monitoreo");
  const { database, recentErrors, services, summary } = await getAdminMonitoring();

  return (
    <AdminShell
      active="monitoreo"
      description="Estado de Vercel, Supabase/PostgreSQL, uso de base de datos, errores recientes y tiempos de respuesta."
      session={adminSession}
      title="Monitoreo de Servidor"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de monitoreo de servidor">
        <article><small>Respuesta server</small><strong>{summary.apiResponseMs} ms</strong><span>Render del panel admin</span></article>
        <article><small>PostgreSQL</small><strong>{summary.postgresLatencyMs} ms</strong><span>Latencia de consulta</span></article>
        <article><small>Errores recientes</small><strong>{summary.totalErrors}</strong><span>Últimas 24 horas</span></article>
        <article><small>Base de datos</small><strong>{database.databaseSize}</strong><span>{database.tableCount} tablas públicas</span></article>
      </section>

      <section className="admin-module-grid" aria-label="Estado por servicio">
        {services.map((service) => (
          <article key={service.name}>
            {iconForService(service.name)}
            <div>
              <h2>{service.name}</h2>
              <p><strong>{service.status}</strong> · {service.detail}</p>
              <p>{service.metricLabel}: {service.metric}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="admin-overview-grid">
        <article className="admin-table-card">
          <header>
            <div>
              <span><AlertTriangle size={18} /> Errores recientes</span>
              <h2>Últimos eventos técnicos</h2>
            </div>
            <a href="/admin/alertas-sistema">Ver alertas</a>
          </header>
          <div className="admin-activity-timeline">
            {recentErrors.length ? recentErrors.map((error) => (
              <article key={`${error.source}-${error.id}-${error.occurredAt}`}>
                <i>{iconForError(error.source)}</i>
                <div>
                  <strong>{error.title}</strong>
                  <small>{error.companyName || "Sistema"} · {error.description}</small>
                  <small>{error.source} · {error.occurredLabel}</small>
                </div>
                <span data-status={error.severityLabel}>{error.severityLabel}</span>
                {error.companyId ? <a href={`/admin/clientes/${error.companyId}`}>Ver cliente</a> : <b>Sistema</b>}
              </article>
            )) : (
              <p className="admin-empty-note">No hay errores técnicos recientes en los últimos 7 días.</p>
            )}
          </div>
        </article>

        <article className="admin-health-card">
          <header>
            <span><Database size={18} /> Uso de base de datos</span>
            <h2>Supabase / PostgreSQL</h2>
          </header>
          <div>
            <p><strong>Base:</strong> {database.databaseName}</p>
            <p><strong>Tamaño:</strong> {database.databaseSize}</p>
            <p><strong>Filas estimadas:</strong> {database.estimatedRows.toLocaleString("es-CO")}</p>
            <p><strong>Conexiones visibles:</strong> {database.visibleConnections}</p>
            <p><strong>Última actividad:</strong> {database.lastActivityLabel}</p>
            <p><strong>Último pago creado:</strong> {database.lastPaymentLabel}</p>
          </div>
        </article>
      </section>

      <section className="admin-module-grid">
        <article><Server size={24} /><div><h2>Vercel</h2><p>Estado del runtime, entorno de deployment y tiempo de respuesta server-side.</p></div></article>
        <article><Database size={24} /><div><h2>Supabase</h2><p>Tamaño de base, tablas, filas estimadas, conexiones y latencia de consulta.</p></div></article>
        <article><Clock3 size={24} /><div><h2>Rendimiento</h2><p>Señales de lentitud, timeout, latencia e INP registradas como eventos.</p></div></article>
        <article><ShieldCheck size={24} /><div><h2>Continuidad</h2><p>Lectura rápida de fallos operativos para reaccionar antes de afectar clientes.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar Vercel Runtime Logs, Speed Insights y métricas Supabase para capturar tiempos de respuesta reales por endpoint y alertas automáticas.</p>
      </AdminNextStep>
    </AdminShell>
  );
}

function iconForService(name: string) {
  if (name.includes("PostgreSQL")) return <Database size={24} />;
  if (name.includes("SIIGO")) return <ShieldCheck size={24} />;
  if (name.includes("pago")) return <Wifi size={24} />;
  return <Server size={24} />;
}

function iconForError(source: string) {
  if (source === "Pagos") return <Wifi size={18} />;
  if (source === "SIIGO") return <ShieldCheck size={18} />;
  if (source === "CSV") return <Database size={18} />;
  if (source === "Sistema") return <Gauge size={18} />;
  return <Activity size={18} />;
}
