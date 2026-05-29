"use client";

import { ArrowRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type LoginResponse = {
  company: {
    id: string;
    name: string;
    country: string;
    businessType: string;
    currency: string;
    plan: string;
    monthlyGoal: number;
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
  subscription: unknown;
  onboarding: { status?: string } | null;
};

export function LoginForm() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Ingresa con el usuario de tu empresa.");

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Validando credenciales...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No pudimos iniciar sesión. Revisa email y contraseña.");
      return;
    }

    const data = payload as LoginResponse;
    window.localStorage.setItem("copiloto-pyme-company-id", data.company.id);
    window.localStorage.setItem("copiloto-pyme-user", JSON.stringify(data.user));
    window.localStorage.setItem("copiloto-pyme-session", JSON.stringify(data.session));
    if (data.subscription) window.localStorage.setItem("copiloto-pyme-subscription", JSON.stringify(data.subscription));
    if (data.onboarding) window.localStorage.setItem("copiloto-pyme-onboarding", JSON.stringify(data.onboarding));

    setStatus("success");
    setMessage("Sesión iniciada. Abriendo tu espacio...");
    window.setTimeout(() => {
      const nextPath = searchParams.get("next");
      window.location.href = nextPath && nextPath.startsWith("/") ? nextPath : data.onboarding?.status === "completed" ? "/dashboard" : "/onboarding";
    }, 600);
  }

  return (
    <form onSubmit={submitLogin}>
      <label>Email<input name="email" type="email" placeholder="correo@empresa.com" required /></label>
      <label>Contraseña<input name="password" type="password" placeholder="Tu contraseña" required /></label>
      <button className="mkt-button primary" disabled={status === "loading"} type="submit">
        <ArrowRight aria-hidden="true" />{status === "loading" ? "Entrando..." : "Entrar"}
      </button>
      <p className={`auth-form-status ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
      <a href="/recuperar-contrasena">¿Olvidaste tu contraseña?</a>
    </form>
  );
}
