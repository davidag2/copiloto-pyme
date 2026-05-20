import { Banknote, CreditCard, Receipt, TimerReset } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";

export default async function AdminPaymentsPage() {
  const adminSession = await requireAdminPageSession("/admin/pagos");

  return (
    <AdminShell
      active="pagos"
      description="Revisa suscripciones, pagos pendientes, pruebas gratis, renovaciones y conciliacion de pasarelas."
      session={adminSession}
      title="Pagos y suscripciones"
    >
      <section className="admin-kpi-grid" aria-label="Resumen de pagos">
        <article><small>MRR estimado</small><strong>$0</strong><span>Pendiente de conectar</span></article>
        <article><small>En prueba gratis</small><strong>0</strong><span>30 dias incluidos</span></article>
        <article><small>Pagos pendientes</small><strong>0</strong><span>Requieren seguimiento</span></article>
        <article><small>Bloqueos activos</small><strong>0</strong><span>Sin pago vigente</span></article>
      </section>

      <section className="admin-module-grid">
        <article><CreditCard size={24} /><div><h2>Pasarelas</h2><p>Wompi, Bold, Mercado Pago y Efecty/Servientrega.</p></div></article>
        <article><TimerReset size={24} /><div><h2>Prueba gratis</h2><p>Control de inicio, vencimiento y conversion a pago.</p></div></article>
        <article><Banknote size={24} /><div><h2>Conciliacion</h2><p>Pagos aprobados, fallidos, expirados y referencias externas.</p></div></article>
        <article><Receipt size={24} /><div><h2>Factura asociada</h2><p>Estado de factura SIIGO ligada al pago confirmado.</p></div></article>
      </section>

      <AdminNextStep>
        <strong>Siguiente paso</strong>
        <p>Conectar `payment_transactions`, `subscriptions`, `plans` y estado de acceso al dashboard.</p>
      </AdminNextStep>
    </AdminShell>
  );
}
