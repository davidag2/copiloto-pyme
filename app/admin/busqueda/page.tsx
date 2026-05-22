import type { ReactNode } from "react";
import { Building2, CreditCard, FileText, Search, TimerReset, UserRound } from "lucide-react";
import { AdminNextStep, AdminShell } from "@/components/admin/AdminShell";
import { requireAdminPageSession } from "@/lib/admin-page";
import { getAdminGlobalSearch } from "@/lib/admin-search";

type AdminSearchPageProps = {
  searchParams?: Promise<{ q?: string | string[] }>;
};

export default async function AdminSearchPage({ searchParams }: AdminSearchPageProps) {
  const params = await searchParams;
  const adminSession = await requireAdminPageSession("/admin/busqueda");
  const search = await getAdminGlobalSearch(params?.q);

  return (
    <AdminShell
      active="busqueda"
      description="Busca por empresa, usuario, email, factura, pago, NIT o ID de suscripción."
      session={adminSession}
      title="Búsqueda Global"
    >
      <section className="admin-table-card">
        <header>
          <div>
            <span><Search size={18} /> Buscador interno</span>
            <h2>Encuentra cualquier registro operativo</h2>
          </div>
          <a href="/admin/busqueda">Limpiar</a>
        </header>
        <form action="/admin/busqueda" className="admin-search-form">
          <label htmlFor="admin-global-search">Buscar en Copiloto Pyme</label>
          <div>
            <Search size={20} />
            <input
              autoComplete="off"
              defaultValue={search.query}
              id="admin-global-search"
              name="q"
              placeholder="Empresa, email, NIT, factura, pago o ID..."
              type="search"
            />
            <button type="submit">Buscar</button>
          </div>
          <small>Ejemplos: Panela Orgánica Demo, info@cliente.com, 900123456, GO, ID de pago o ID de suscripción.</small>
        </form>
      </section>

      <section className="admin-kpi-grid" aria-label="Resumen de búsqueda">
        <article><small>Resultados</small><strong>{search.total}</strong><span>{search.hasQuery ? `Para "${search.query}"` : "Ingresa una búsqueda"}</span></article>
        <article><small>Empresas</small><strong>{search.results.companies.length}</strong><span>Nombre, NIT o plan</span></article>
        <article><small>Usuarios</small><strong>{search.results.users.length}</strong><span>Nombre, email o rol</span></article>
        <article><small>Operación</small><strong>{search.results.payments.length + search.results.invoices.length + search.results.subscriptions.length}</strong><span>Pagos, facturas y suscripciones</span></article>
      </section>

      {search.hasQuery ? (
        <>
          <SearchSection
            empty="No encontramos empresas con ese criterio."
            icon={<Building2 size={18} />}
            title="Empresas"
          >
            {search.results.companies.map((company) => (
              <article key={company.id}>
                <i><Building2 size={18} /></i>
                <div>
                  <strong>{company.name}</strong>
                  <small>{company.businessType} · {company.country} · Plan {company.plan.toUpperCase()}</small>
                  <small>NIT: {company.nit || "Sin NIT"} · Email: {company.ownerEmail || "Sin email principal"}</small>
                </div>
                <span data-status="Activo">{company.createdLabel}</span>
                <a href={company.href}>Ver ficha</a>
              </article>
            ))}
          </SearchSection>

          <SearchSection
            empty="No encontramos usuarios con ese criterio."
            icon={<UserRound size={18} />}
            title="Usuarios"
          >
            {search.results.users.map((user) => (
              <article key={user.id}>
                <i><UserRound size={18} /></i>
                <div>
                  <strong>{user.name}</strong>
                  <small>{user.email} · {user.role}</small>
                  <small>{user.companyName} · Último login: {user.lastLoginLabel}</small>
                </div>
                <span data-status={user.statusLabel}>{user.statusLabel}</span>
                <a href={user.href}>Ver cliente</a>
              </article>
            ))}
          </SearchSection>

          <SearchSection
            empty="No encontramos facturas con ese criterio."
            icon={<FileText size={18} />}
            title="Facturas"
          >
            {search.results.invoices.map((invoice) => (
              <article key={invoice.id}>
                <i><FileText size={18} /></i>
                <div>
                  <strong>{invoice.invoiceNumber || "Factura sin número"}</strong>
                  <small>{invoice.companyName} · {invoice.customerName || "Sin razón social"} · NIT {invoice.nit || "Sin NIT"}</small>
                  <small>{invoice.amountLabel} · {invoice.createdLabel}</small>
                </div>
                <span data-status={invoice.statusLabel}>{invoice.statusLabel}</span>
                <a href={invoice.href}>Ver cliente</a>
              </article>
            ))}
          </SearchSection>

          <SearchSection
            empty="No encontramos pagos con ese criterio."
            icon={<CreditCard size={18} />}
            title="Pagos"
          >
            {search.results.payments.map((payment) => (
              <article key={payment.id}>
                <i><CreditCard size={18} /></i>
                <div>
                  <strong>{payment.externalReference}</strong>
                  <small>{payment.companyName} · {payment.planName} · {payment.providerName}</small>
                  <small>{payment.amountLabel} · {payment.createdLabel} · {payment.providerTransactionId || "Sin ID proveedor"}</small>
                </div>
                <span data-status={payment.statusLabel}>{payment.statusLabel}</span>
                <a href={payment.href}>Ver cliente</a>
              </article>
            ))}
          </SearchSection>

          <SearchSection
            empty="No encontramos suscripciones con ese criterio."
            icon={<TimerReset size={18} />}
            title="Suscripciones"
          >
            {search.results.subscriptions.map((subscription) => (
              <article key={subscription.id}>
                <i><TimerReset size={18} /></i>
                <div>
                  <strong>{subscription.id}</strong>
                  <small>{subscription.companyName} · Plan {subscription.planName}</small>
                  <small>Vence o cambia: {subscription.endLabel}</small>
                </div>
                <span data-status={subscription.statusLabel}>{subscription.statusLabel}</span>
                <a href={subscription.href}>Ver cliente</a>
              </article>
            ))}
          </SearchSection>
        </>
      ) : (
        <AdminNextStep>
          <strong>Cómo usarlo</strong>
          <p>Escribe una empresa, usuario, email, NIT, número de factura, referencia de pago o ID de suscripción para encontrar el registro y abrir la ficha del cliente.</p>
        </AdminNextStep>
      )}
    </AdminShell>
  );
}

function SearchSection({
  children,
  empty,
  icon,
  title
}: {
  children: ReactNode;
  empty: string;
  icon: ReactNode;
  title: string;
}) {
  const hasResults = Array.isArray(children) ? children.length > 0 : Boolean(children);

  return (
    <section className="admin-table-card">
      <header>
        <div>
          <span>{icon} Resultado</span>
          <h2>{title}</h2>
        </div>
      </header>
      <div className="admin-client-list">
        {hasResults ? children : <p className="admin-empty-note">{empty}</p>}
      </div>
    </section>
  );
}
