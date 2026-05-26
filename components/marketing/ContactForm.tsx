"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type SubmitState = "idle" | "sending" | "sent" | "error";

export function ContactForm() {
  const [status, setStatus] = useState<SubmitState>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: formData.get("company"),
          email: formData.get("email"),
          message: formData.get("message"),
          name: formData.get("name"),
          phone: formData.get("phone")
        })
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || "No pudimos enviar el mensaje.");
      }

      setStatus("sent");
      setMessage("Mensaje enviado. Te contactaremos pronto.");
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "No pudimos enviar el mensaje.");
    }
  }

  return (
    <form className="mkt-contact-form" onSubmit={handleSubmit}>
      <label>Nombre<input name="name" placeholder="Tu nombre" required /></label>
      <label>Empresa<input name="company" placeholder="Nombre de la empresa" required /></label>
      <label>Email<input name="email" type="email" placeholder="correo@empresa.com" required /></label>
      <label>Teléfono<input name="phone" placeholder="+57 300 000 0000" /></label>
      <label>Mensaje<textarea name="message" placeholder="Cuéntanos cómo registras ventas, caja, inventario y clientes hoy." required /></label>
      <button className="mkt-button primary mkt-contact-submit" disabled={status === "sending"} type="submit">
        {status === "sending" ? "Enviando..." : "Enviar"}
      </button>
      {message ? <p className={`mkt-contact-status ${status === "error" ? "is-error" : "is-success"}`}>{message}</p> : null}
    </form>
  );
}
