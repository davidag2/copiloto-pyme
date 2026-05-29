"use client";

import { ArrowRight, LockKeyhole } from "lucide-react";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState(token ? "Crea una contraseña nueva para tu cuenta." : "El enlace de recuperación no tiene token.");

  async function submitReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setStatus("error");
      setMessage("El enlace de recuperación no es válido.");
      return;
    }

    setStatus("loading");
    setMessage("Actualizando contraseña...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        password: form.get("password"),
        confirmPassword: form.get("confirmPassword")
      })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No pudimos actualizar la contraseña.");
      return;
    }

    setStatus("success");
    setMessage(payload.message || "Contraseña actualizada. Ya puedes iniciar sesión.");
  }

  return (
    <form onSubmit={submitReset}>
      <label>Nueva contraseña<input name="password" type="password" placeholder="Mínimo 8 caracteres" minLength={8} required disabled={!token || status === "success"} /></label>
      <label>Confirmar contraseña<input name="confirmPassword" type="password" placeholder="Repite tu nueva contraseña" minLength={8} required disabled={!token || status === "success"} /></label>
      <button className="mkt-button primary" disabled={!token || status === "loading" || status === "success"} type="submit">
        <LockKeyhole aria-hidden="true" />{status === "loading" ? "Guardando..." : "Cambiar contraseña"}
      </button>
      <p className={`auth-form-status ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
      {status === "success" ? <a href="/login"><ArrowRight aria-hidden="true" /> Iniciar sesión</a> : null}
    </form>
  );
}
