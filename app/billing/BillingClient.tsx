"use client";

import { ArrowRight, Banknote, CheckCircle2, CreditCard, Landmark, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { commercialPlans, type PlanId } from "@/lib/plans";
import type { PaymentProviderId } from "@/lib/payment-providers";

type Provider = {
  id: PaymentProviderId;
  name: string;
  category: string;
  description: string;
  recommendedFor: string;
  configured: boolean;
  supports: {
    recurring: boolean;
    cash: boolean;
    pse: boolean;
    cards: boolean;
  };
};

export function BillingClient() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [planId, setPlanId] = useState<PlanId>("go");
  const [providerId, setProviderId] = useState<PaymentProviderId>("wompi");
  const [status, setStatus] = useState("Elige cómo quieres preparar el cobro de la suscripción.");
  const [isLoading, setIsLoading] = useState(false);
  const activePlan = commercialPlans.find((plan) => plan.id === planId) ?? commercialPlans[0];

  useEffect(() => {
    fetch("/api/payments/providers")
      .then((response) => response.json())
      .then((data) => setProviders(data.providers || []))
      .catch(() => setStatus("No se pudieron cargar las pasarelas de pago."));
  }, []);

  async function createCheckout() {
    setIsLoading(true);
    setStatus("Registrando solicitud de pago...");

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

    setStatus(payload.message || "Solicitud de pago creada.");
  }

  return (
    <section className="billing-route-shell">
      <div className="billing-route-copy">
        <span>Pagos Copiloto Pyme</span>
        <h1>Prepara la suscripción con pasarelas pensadas para Colombia</h1>
        <p>El cliente mantiene su mes gratis y deja listo el medio de pago para activar Go, Basic o Pro cuando termine el periodo de prueba.</p>
        <div className="billing-trust-grid">
          <article><ShieldCheck aria-hidden="true" /><strong>1 mes gratis</strong><small>Sin cobro inicial.</small></article>
          <article><CreditCard aria-hidden="true" /><strong>Tarjeta y PSE</strong><small>Wompi, Bold o Mercado Pago.</small></article>
          <article><Banknote aria-hidden="true" /><strong>Efectivo</strong><small>Efecty como opción offline.</small></article>
        </div>
      </div>

      <div className="billing-route-panel">
        <div className="billing-section-heading">
          <span>Paso 1</span>
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
          <span>Paso 2</span>
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
            <small>Primer mes gratis. Cobro mensual después del trial.</small>
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
