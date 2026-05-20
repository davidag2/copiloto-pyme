import { AlertCircle, CheckCircle2, FileText, RefreshCw } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminInvoicesPage() {
  const adminSession = await requireAdminPageSession("/admin/facturas");

  return (
    <AdminShell
      active="facturas"
      description="Supervisa facturas emitidas a nombre de Tecnotitan S.A.S, respuestas SIIGO y errores de integracion."
      session={adminSession}
      title="Facturacion SIIGO"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de facturas">
        <article><small>Facturas enviadas</small><strong>0</strong><span>Mes actual</span></article>
        <article><small>Listas por enviar</small><strong>0</strong><span>Pago aprobado</span></article>
        <article><small>Errores SIIGO</small><strong>0</strong><span>Requieren reintento</span></article>
        <article><small>Rechazadas</small><strong>0</strong><span>Validacion DIAN/SIIGO</span></article>
      </section>

      <section className="admin-module-grid">
        <article><FileText size={24} /><div><h2>Facturas</h2><p>Numero, CUFE, PDF, XML, cliente, valor y estado.</p></div></article>
        <article><CheckCircle2 size={24} /><div><h2>Aceptadas</h2><p>Factura confirmada y lista para trazabilidad contable.</p></div></article>
        <article><RefreshCw size={24} /><div><h2>Reintentos</h2><p>Enviar nuevamente facturas fallidas sin duplicar pagos.</p></div></article>
        <article><AlertCircle size={24} /><div><h2>Errores</h2><p>Mensaje de SIIGO, payload y respuesta para soporte tecnico.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar `siigo_invoices`, `billing_profiles` y `payment_transactions`.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
