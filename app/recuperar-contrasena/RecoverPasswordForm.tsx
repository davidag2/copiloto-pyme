"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";

export function RecoverPasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Escribe el email de tu cuenta y te enviaremos un enlace seguro.");

  async function submitRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Enviando instrucciones...");

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/recover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email") })
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No pudimos enviar el correo de recuperación.");
      return;
    }

    setStatus("success");
    setMessage(payload.message || "Si el correo existe, enviaremos instrucciones para recuperar la contraseña.");
  }

  return (
    <form onSubmit={submitRecovery}>
      <label>Email<input name="email" type="email" placeholder="correo@empresa.com" required /></label>
      <button className="mkt-button primary" disabled={status === "loading"} type="submit">
        <Mail aria-hidden="true" />{status === "loading" ? "Enviando..." : "Enviar enlace"}
      </button>
      <p className={`auth-form-status ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
      {status === "success" ? <a href="/login"><ArrowRight aria-hidden="true" /> Volver a iniciar sesión</a> : null}
    </form>
  );
}
