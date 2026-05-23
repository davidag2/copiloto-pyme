"use client";

import { ArrowRight, Building2, CheckCircle2, Database, ShieldCheck, Target } from "lucide-react";
import { useState, type FormEvent } from "react";

type OnboardingData = {
  onboarding: {
    companyId: string;
    companyName: string;
    businessType: string;
    dataSource: string;
    monthlyGoal: string | number;
    minimumStock: number;
    plan: string;
    status: string;
  };
  user: {
    name: string;
    email: string;
    role: string;
  };
};

type OnboardingFormProps = {
  data: OnboardingData;
};

export function OnboardingForm({ data }: OnboardingFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Confirma estos datos para preparar tu resumen inicial.");
  const onboarding = data.onboarding;

  async function submitOnboarding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Guardando configuración inicial...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyId: onboarding.companyId,
        businessType: form.get("businessType"),
        dataSource: form.get("dataSource"),
        monthlyGoal: form.get("monthlyGoal"),
        minimumStock: form.get("minimumStock")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No se pudo completar el onboarding.");
      return;
    }

    window.localStorage.setItem("copiloto-pyme-onboarding", JSON.stringify(payload.onboarding));
    setStatus("success");
    setMessage("Onboarding completo. Abriendo dashboard...");
    window.setTimeout(() => {
      window.location.href = payload.nextStep || "/dashboard";
    }, 700);
  }

  return (
    <section className="onboarding-route-card">
      <div className="onboarding-route-heading">
        <span>Onboarding</span>
        <h1>Configura tu primer resumen</h1>
        <p>{message}</p>
      </div>

      <div className="onboarding-admin-master-note" role="note">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>{data.user.name}, tu usuario será el administrador maestro</strong>
          <p>Esta cuenta tendrá permisos para crear usuarios, asignar roles y controlar la configuración principal de {onboarding.companyName}. Si no eres la persona autorizada, pide al administrador de la empresa que complete este paso.</p>
        </div>
      </div>

      <div className="onboarding-route-steps" aria-label="Progreso de onboarding">
        <article data-status="completed"><CheckCircle2 aria-hidden="true" /><strong>Cuenta</strong><span>{data.user.email}</span></article>
        <article data-status="active"><Building2 aria-hidden="true" /><strong>Empresa</strong><span>{onboarding.companyName}</span></article>
        <article data-status="active"><Database aria-hidden="true" /><strong>Datos</strong><span>Ventas, caja e inventario</span></article>
        <article data-status="locked"><Target aria-hidden="true" /><strong>Dashboard</strong><span>Resumen ejecutivo</span></article>
      </div>

      <form className="onboarding-route-form" onSubmit={submitOnboarding}>
        <label>Tipo de negocio<input name="businessType" defaultValue={onboarding.businessType || "PYME"} required /></label>
        <label>Fuente principal de datos
          <select name="dataSource" defaultValue={onboarding.dataSource || "Excel/CSV"} required>
            <option>Excel/CSV</option>
            <option>Google Sheets</option>
            <option>Siigo</option>
            <option>Alegra</option>
            <option>POS / Ventas</option>
          </select>
        </label>
        <label>Meta mensual de ventas COP<input name="monthlyGoal" type="number" min="0" defaultValue={Number(onboarding.monthlyGoal || 0)} /></label>
        <label>Stock mínimo crítico<input name="minimumStock" type="number" min="0" defaultValue={onboarding.minimumStock || 0} /></label>
        <button className="mkt-button primary large" disabled={status === "loading"} type="submit">
          <ArrowRight aria-hidden="true" />{status === "loading" ? "Guardando..." : "Entrar al dashboard"}
        </button>
        <p className={`auth-form-status ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
      </form>
    </section>
  );
}
