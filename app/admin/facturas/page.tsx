import { AlertCircle, CheckCircle2, FileText, RefreshCw, Send, ServerCog } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminInvoices } from "@/lib/admin-invoices";
import { formatAdminMoney } from "@/lib/admin-summary";

export default async function AdminInvoicesPage() {
  const adminSession = await requireAdminPageSession("/admin/facturas");
  const { invoices, logs, summary } = await getAdminInvoices();

  return (
    <AdminShell
      active="facturas"
      description="Supervisa facturas emitidas a nombre de Tecnotitan S.A.S, respuestas SIIGO y errores de integración."
      session={adminSession}
      title="Facturación SIIGO"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de facturas">
        <article><small>Facturas enviadas</small><strong>{summary.sent + summary.accepted}</strong><span>Mes actual</span></article>
        <article><small>Listas por enviar</small><strong>{summary.ready}</strong><span>Pago aprobado o preparación pendiente</span></article>
        <article><small>Errores SIIGO</small><strong>{summary.failed}</strong><span>Requieren reintento</span></article>
        <article><small>Rechazadas</small><strong>{summary.rejected}</strong><span>Validación DIAN/SIIGO</span></article>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><FileText size={18} /> Facturas SIIGO</span>
            <h2>Facturas enviadas y pendientes</h2>
          </div>
          <a href="/admin/pagos">Ver pagos</a>
        </header>
        <div className="admin-invoice-table">
          <div className="admin-invoice-header" aria-hidden="true">
            <span>Número</span>
            <span>Cliente</span>
            <span>NIT</span>
            <span>Valor</span>
            <span>Estado</span>
            <span>Fecha</span>
            <span>Error</span>
          </div>
          {invoices.length ? invoices.map((invoice) => (
            <article className="admin-invoice-row" key={invoice.id}>
              <div data-label="Número">
                <strong>{invoice.invoiceNumber}</strong>
                <small>{invoice.providerName || "Sin pasarela"}</small>
              </div>
              <div data-label="Cliente">
                <strong>{invoice.customerName}</strong>
                <small>{invoice.companyName}</small>
              </div>
              <div data-label="NIT"><strong>{invoice.nit}</strong></div>
              <div data-label="Valor"><strong>{formatAdminMoney(invoice.amountCop)}</strong></div>
              <span data-status={invoice.statusLabel}>{invoice.statusLabel}</span>
              <div data-label="Fecha"><strong>{invoice.dateLabel}</strong></div>
              <div data-label="Error">
                <strong>{invoice.errorMessage || "Sin error"}</strong>
                <a href={`/admin/clientes/${invoice.companyId}`}>Ver cliente</a>
              </div>
            </article>
          )) : (
            <p className="admin-empty-note">Aún no hay facturas SIIGO registradas.</p>
          )}
        </div>
      </section>

      <section className="admin-table-card">
        <header>
          <div>
            <span><ServerCog size={18} /> Logs de integración SIIGO</span>
            <h2>Intentos, respuestas y reintentos</h2>
          </div>
          <a href="/admin/monitoreo">Ver monitoreo</a>
        </header>
        <div className="admin-log-list">
          {logs.length ? logs.map((log) => (
            <article key={log.id}>
              <i>{log.status === "success" ? <CheckCircle2 size={18} /> : log.status === "error" ? <AlertCircle size={18} /> : <RefreshCw size={18} />}</i>
              <div>
                <strong>{log.companyName || "Empresa no asociada"} · {log.action}</strong>
                <small>Intento {log.attemptNumber} · {log.createdLabel} · {log.canRetry ? "Reintento disponible" : "Sin reintento"}</small>
                <small>{log.errorMessage || "Payload y respuesta guardados para auditoría."}</small>
              </div>
              <span data-status={log.statusLabel}>{log.statusLabel}</span>
            </article>
          )) : (
            <p className="admin-empty-note">Sin logs todavía. Aparecerán cuando se prepare o envíe una factura SIIGO.</p>
          )}
        </div>
      </section>

      <section className="admin-module-grid">
        <article><Send size={24} /><div><h2>Envíos SIIGO</h2><p>Número, cliente, NIT, valor, estado y fecha desde la integración.</p></div></article>
        <article><CheckCircle2 size={24} /><div><h2>Aceptadas</h2><p>Factura confirmada y lista para trazabilidad contable.</p></div></article>
        <article><RefreshCw size={24} /><div><h2>Reintentos</h2><p>Enviar nuevamente facturas fallidas sin duplicar pagos.</p></div></article>
        <article><AlertCircle size={24} /><div><h2>Errores</h2><p>Mensaje de SIIGO, payload y respuesta para soporte técnico.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Aplicar el SQL de `siigo_invoice_logs` en Supabase para activar auditoría persistente de cada intento.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
