"use client";

import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";
import { commercialPlans, type CommercialPlan, type PlanId } from "@/lib/plans";

type RegisterFormProps = {
  selectedPlan: CommercialPlan;
};

type RegisterResponse = {
  company: {
    id: string;
    name: string;
    country: string;
    businessType: string;
    currency: string;
    plan: string;
    monthlyGoal: number | string;
    minimumStock: number;
    dataSource: string;
  };
  user: {
    id: string;
    companyId: string;
    name: string;
    email: string;
    role: string;
    status: string;
  };
  session: {
    token: string;
    expiresAt: string;
  };
  subscription: {
    id: string;
    planId: string;
    status: string;
    trialEndsAt: string;
  };
  onboarding: {
    status: string;
    currentStep: string;
  };
};

export function RegisterForm({ selectedPlan }: RegisterFormProps) {
  const [planId, setPlanId] = useState<PlanId>(selectedPlan.id);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Completa tus datos para activar tu mes gratis.");
  const activePlan = commercialPlans.find((plan) => plan.id === planId) ?? selectedPlan;

  async function submitRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Creando tu empresa, usuario y mes gratis...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan: activePlan.id,
        ownerName: form.get("ownerName"),
        companyName: form.get("companyName"),
        ownerEmail: form.get("ownerEmail"),
        password: form.get("password"),
        country: "Colombia",
        businessType: "PYME",
        currency: "COP",
        dataSource: "Excel/CSV"
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No se pudo crear la cuenta. Revisa los datos e intenta de nuevo.");
      return;
    }

    const data = payload as RegisterResponse;
    window.localStorage.setItem("copiloto-pyme-company-id", data.company.id);
    window.localStorage.setItem("copiloto-pyme-user", JSON.stringify(data.user));
    window.localStorage.setItem("copiloto-pyme-session", JSON.stringify(data.session));
    window.localStorage.setItem("copiloto-pyme-subscription", JSON.stringify(data.subscription));
    window.localStorage.setItem("copiloto-pyme-onboarding", JSON.stringify(data.onboarding));

    setStatus("success");
    setMessage("Cuenta creada. Te llevamos al onboarding para preparar tu primer resumen.");
    window.setTimeout(() => {
      window.location.href = "/onboarding";
    }, 800);
  }

  return (
    <form onSubmit={submitRegister}>
      <div className="auth-plan-picker" aria-label="Seleccionar plan">
        {commercialPlans.map((plan) => (
          <button
            className={plan.id === activePlan.id ? "is-selected" : ""}
            key={plan.id}
            onClick={() => setPlanId(plan.id)}
            type="button"
          >
            <span>{plan.name}</span>
            <strong>{plan.priceLabel}</strong>
            <small>{plan.trialDays} días gratis</small>
            {plan.id === activePlan.id ? <CheckCircle2 aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      <input name="plan" type="hidden" value={activePlan.id} />
      <div className="auth-admin-master-note" role="note">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Cuenta administradora maestra</strong>
          <p>Esta será la cuenta principal de la empresa en Copiloto Pyme. Desde aquí podrás invitar integrantes, asignar roles y administrar permisos, datos, facturación y configuración.</p>
          <small>Recomendamos que la cree el administrador de la empresa o una persona autorizada para gestionar el equipo.</small>
        </div>
      </div>
      <label>Nombre<input name="ownerName" placeholder="Tu nombre" required /></label>
      <label>Empresa<input name="companyName" placeholder="Nombre de tu empresa" required /></label>
      <label>Email<input name="ownerEmail" type="email" placeholder="correo@empresa.com" required /></label>
      <label>Contraseña<input name="password" type="password" placeholder="Mínimo 8 caracteres" required minLength={8} /></label>
      <button className="mkt-button primary" disabled={status === "loading"} type="submit">
        <ArrowRight aria-hidden="true" />{status === "loading" ? "Creando cuenta..." : `Crear cuenta ${activePlan.name}`}
      </button>
      <p className={`auth-form-status ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
    </form>
  );
}
