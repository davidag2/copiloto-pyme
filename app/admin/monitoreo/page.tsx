import { Activity, AlertTriangle, Database, Server } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminMonitoringPage() {
  const adminSession = await requireAdminPageSession("/admin/monitoreo");

  return (
    <AdminShell
      active="monitoreo"
      description="Observa salud de servicios, errores recientes, integraciones criticas y alertas operativas."
      session={adminSession}
      title="Monitoreo"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de monitoreo">
        <article><small>Estado API</small><strong>OK</strong><span>Sin incidentes reportados</span></article>
        <article><small>Base de datos</small><strong>OK</strong><span>Supabase conectado</span></article>
        <article><small>Errores recientes</small><strong>0</strong><span>Ultimos 60 minutos</span></article>
        <article><small>Integraciones</small><strong>0</strong><span>Alertas activas</span></article>
      </section>

      <section className="admin-module-grid">
        <article><Server size={24} /><div><h2>Vercel</h2><p>Deployments, errores de funciones, logs y tiempos de respuesta.</p></div></article>
        <article><Database size={24} /><div><h2>Supabase</h2><p>Estado de base, conexiones, tablas criticas y consultas lentas.</p></div></article>
        <article><AlertTriangle size={24} /><div><h2>Alertas</h2><p>Fallos de pagos, SIIGO, API y tareas administrativas.</p></div></article>
        <article><Activity size={24} /><div><h2>Actividad</h2><p>Eventos importantes del sistema y acciones de usuarios internos.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Crear tabla de auditoria administrativa y conectar logs reales de Vercel/Supabase.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
