"use client";

import { ArrowRight, Banknote, CheckCircle2, CreditCard, Landmark, ReceiptText, ShieldCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { commercialPlans, type PlanId } from "@/lib/plans";
import type { PaymentProviderId } from "@/lib/payment-providers";

type Provider = {
  id: PaymentProviderId;
  name: string;
  category: string;
  description: string;
  configured: boolean;
};

type BillingProfile = {
  personType?: string;
  idType?: string;
  identification?: string;
  checkDigit?: string;
  legalName?: string;
  address?: string;
  countryCode?: string;
  stateCode?: string;
  cityCode?: string;
  email?: string;
  phone?: string;
  fiscalResponsibilityCode?: string;
};

export function BillingClient() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [profile, setProfile] = useState<BillingProfile | null>(null);
  const [planId, setPlanId] = useState<PlanId>("go");
  const [providerId, setProviderId] = useState<PaymentProviderId>("wompi");
  const [status, setStatus] = useState("Elige cómo quieres preparar el cobro de la suscripción.");
  const [isLoading, setIsLoading] = useState(false);
  const activePlan = commercialPlans.find((plan) => plan.id === planId) ?? commercialPlans[0];

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("reason");
    if (reason === "trial_expired" || reason === "past_due" || reason === "subscription_expired") {
      setStatus("Tu mes gratis terminó. Para volver al dashboard, activa el pago de tu suscripción.");
    }

    fetch("/api/payments/providers")
      .then((response) => response.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => setStatus("No se pudieron cargar las pasarelas de pago."));

    fetch("/api/billing/profile")
      .then((response) => response.json())
      .then((data) => setProfile(data.profile || null))
      .catch(() => setProfile(null));
  }, []);

  async function saveBillingProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus("Guardando datos fiscales...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/billing/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        personType: form.get("personType"),
        idType: form.get("idType"),
        identification: form.get("identification"),
        checkDigit: form.get("checkDigit"),
        legalName: form.get("legalName"),
        address: form.get("address"),
        countryCode: form.get("countryCode"),
        stateCode: form.get("stateCode"),
        cityCode: form.get("cityCode"),
        email: form.get("email"),
        phone: form.get("phone"),
        fiscalResponsibilityCode: form.get("fiscalResponsibilityCode")
      })
    });
    const payload = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setStatus(payload.error || "No se pudieron guardar los datos fiscales.");
      return;
    }

    setProfile(payload.profile);
    setStatus("Datos fiscales guardados. SIIGO ya puede preparar la factura cuando el pago sea confirmado.");
  }

  async function createCheckout() {
    setIsLoading(true);
    setStatus("Registrando solicitud de pago y preparando factura SIIGO...");

    const response = await fetch("/api/payments/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, provider: providerId })
    });
    const payload = await response.json();

    setIsLoading(false);
    if (!response.ok) {
      setStatus(payload.error || "No se pudo preparar el pago.");
      return;
    }

    setStatus(`${payload.message || "Solicitud de pago creada."} Factura SIIGO: ${payload.invoice?.status || "pendiente"}.`);
  }

  return (
    <section className="billing-route-shell">
      <div className="billing-route-copy">
        <span>Pagos Copiloto Pyme</span>
        <h1>Prepara la suscripción con factura electrónica SIIGO</h1>
        <p>El cliente mantiene su mes gratis, deja listo el medio de pago y Copiloto Pyme prepara la factura electrónica para emitirla a nombre de Tecnotitan S.A.S cuando el pago sea confirmado.</p>
        <div className="billing-trust-grid">
          <article><ShieldCheck aria-hidden="true" /><strong>1 mes gratis</strong><small>Sin cobro inicial.</small></article>
          <article><CreditCard aria-hidden="true" /><strong>Tarjeta y PSE</strong><small>Wompi, Bold o Mercado Pago.</small></article>
          <article><ReceiptText aria-hidden="true" /><strong>Factura SIIGO</strong><small>Lista para DIAN y correo.</small></article>
          <article><Banknote aria-hidden="true" /><strong>Efectivo</strong><small>Efecty como opción offline.</small></article>
        </div>
      </div>

      <div className="billing-route-panel">
        <div className="billing-section-heading">
          <span>Paso 1</span>
          <h2>Datos fiscales para SIIGO</h2>
        </div>
        <form className="billing-profile-form" onSubmit={saveBillingProfile}>
          <label>Tipo
            <select name="personType" defaultValue={profile?.personType || "company"} required>
              <option value="company">Empresa</option>
              <option value="person">Persona</option>
            </select>
          </label>
          <label>Tipo de documento<input name="idType" defaultValue={profile?.idType || "31"} placeholder="31 para NIT" required /></label>
          <label>Identificación<input name="identification" defaultValue={profile?.identification || ""} required /></label>
          <label>Dígito verificación<input name="checkDigit" defaultValue={profile?.checkDigit || ""} /></label>
          <label>Razón social<input name="legalName" defaultValue={profile?.legalName || ""} required /></label>
          <label>Email factura<input name="email" type="email" defaultValue={profile?.email || ""} required /></label>
          <label>Dirección<input name="address" defaultValue={profile?.address || ""} required /></label>
          <label>País<input name="countryCode" defaultValue={profile?.countryCode || "CO"} required /></label>
          <label>Departamento<input name="stateCode" defaultValue={profile?.stateCode || ""} placeholder="Ej. 11" required /></label>
          <label>Ciudad<input name="cityCode" defaultValue={profile?.cityCode || ""} placeholder="Ej. 11001" required /></label>
          <label>Teléfono<input name="phone" defaultValue={profile?.phone || ""} /></label>
          <label>Responsabilidad fiscal<input name="fiscalResponsibilityCode" defaultValue={profile?.fiscalResponsibilityCode || "R-99-PN"} required /></label>
          <button className="mkt-button secondary" disabled={isLoading} type="submit">Guardar datos fiscales</button>
        </form>

        <div className="billing-section-heading">
          <span>Paso 2</span>
          <h2>Selecciona plan</h2>
        </div>
        <div className="billing-plan-grid">
          {commercialPlans.map((plan) => (
            <button className={plan.id === planId ? "is-selected" : ""} key={plan.id} onClick={() => setPlanId(plan.id)} type="button">
              <span>{plan.name}</span>
              <strong>{plan.priceLabel}</strong>
              <small>{plan.trialDays} días gratis</small>
            </button>
          ))}
        </div>

        <div className="billing-section-heading">
          <span>Paso 3</span>
          <h2>Selecciona pasarela</h2>
        </div>
        <div className="billing-provider-grid">
          {providers.map((provider) => (
            <button className={provider.id === providerId ? "is-selected" : ""} key={provider.id} onClick={() => setProviderId(provider.id)} type="button">
              <div>
                <Landmark aria-hidden="true" />
                <strong>{provider.name}</strong>
                {provider.id === "wompi" ? <em>Recomendada</em> : null}
              </div>
              <span>{provider.category}</span>
              <p>{provider.description}</p>
              <small>{provider.configured ? "Credenciales detectadas" : "Pendiente configurar credenciales"}</small>
            </button>
          ))}
        </div>

        <div className="billing-summary-card">
          <div>
            <span>Resumen</span>
            <strong>{activePlan.name} · {activePlan.priceLabel}</strong>
            <small>Primer mes gratis. La factura SIIGO se emite cuando el pago esté confirmado.</small>
          </div>
          <button className="mkt-button primary" disabled={isLoading} onClick={createCheckout} type="button">
            <ArrowRight aria-hidden="true" />{isLoading ? "Preparando..." : "Preparar pago"}
          </button>
        </div>

        <p className="billing-status"><CheckCircle2 aria-hidden="true" />{status}</p>
      </div>
    </section>
  );
}
