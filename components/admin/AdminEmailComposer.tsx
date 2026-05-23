"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Mail, Send, Sparkles } from "lucide-react";

type Recipient = {
  companyId: string;
  companyName: string;
  label: string;
  ownerEmail: string;
  ownerName: string;
  planLabel: string;
  statusLabel: string;
};

type Template = {
  bodyText: string;
  id: string;
  name: string;
  preheader: string;
  subject: string;
  templateKey: string;
};

type AdminEmailComposerProps = {
  recipients: Recipient[];
  templates: Template[];
};

export function AdminEmailComposer({ recipients, templates }: AdminEmailComposerProps) {
  const firstTemplate = templates[0];
  const firstRecipient = recipients[0];
  const [companyId, setCompanyId] = useState(firstRecipient?.companyId || "");
  const [templateKey, setTemplateKey] = useState(firstTemplate?.templateKey || "custom");
  const [subject, setSubject] = useState(firstTemplate?.subject || "");
  const [preheader, setPreheader] = useState(firstTemplate?.preheader || "");
  const [body, setBody] = useState(firstTemplate?.bodyText || "");
  const [customEmail, setCustomEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("Diseña el correo, revisa la vista previa y envíalo al cliente.");

  const selectedRecipient = useMemo(
    () => recipients.find((recipient) => recipient.companyId === companyId) || null,
    [companyId, recipients]
  );

  const renderedBody = useMemo(() => applyVariables(body, selectedRecipient), [body, selectedRecipient]);
  const renderedSubject = useMemo(() => applyVariables(subject, selectedRecipient), [subject, selectedRecipient]);
  const renderedPreheader = useMemo(() => applyVariables(preheader, selectedRecipient), [preheader, selectedRecipient]);

  function selectTemplate(nextTemplateKey: string) {
    setTemplateKey(nextTemplateKey);
    const template = templates.find((item) => item.templateKey === nextTemplateKey);
    if (!template) return;
    setSubject(template.subject);
    setPreheader(template.preheader);
    setBody(template.bodyText);
  }

  async function submitEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setMessage("Preparando envío...");

    const response = await fetch("/api/admin/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body,
        companyId: companyId || null,
        customEmail,
        preheader,
        subject,
        templateKey
      })
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(payload.error || "No se pudo enviar el correo.");
      return;
    }

    setStatus(payload.status === "sent" ? "success" : "error");
    setMessage(payload.message || "Correo procesado.");
  }

  return (
    <section className="admin-email-workbench">
      <form className="admin-email-composer" onSubmit={submitEmail}>
        <header>
          <span><Mail size={18} /> Diseñador de correo</span>
          <h2>Crear mensaje para clientes</h2>
          <p>Usa variables como {"{{nombre}}"} y {"{{empresa}}"} para personalizar el mensaje.</p>
        </header>

        <label>Cliente
          <select value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
            {recipients.map((recipient) => (
              <option key={recipient.companyId} value={recipient.companyId}>{recipient.label}</option>
            ))}
          </select>
        </label>

        <label>Email alternativo
          <input value={customEmail} onChange={(event) => setCustomEmail(event.target.value)} placeholder="Opcional: correo externo" type="email" />
        </label>

        <label>Plantilla
          <select value={templateKey} onChange={(event) => selectTemplate(event.target.value)}>
            {templates.map((template) => (
              <option key={template.templateKey} value={template.templateKey}>{template.name}</option>
            ))}
          </select>
        </label>

        <label>Asunto
          <input value={subject} onChange={(event) => setSubject(event.target.value)} required />
        </label>

        <label>Preheader
          <input value={preheader} onChange={(event) => setPreheader(event.target.value)} placeholder="Texto corto que aparece debajo del asunto" />
        </label>

        <label>Cuerpo del correo
          <textarea value={body} onChange={(event) => setBody(event.target.value)} required rows={11} />
        </label>

        <button className="admin-email-send-button" disabled={status === "loading"} type="submit">
          <Send size={18} />{status === "loading" ? "Enviando..." : "Enviar correo"}
        </button>
        <p className={`admin-action-message ${status === "error" ? "is-error" : ""} ${status === "success" ? "is-success" : ""}`}>{message}</p>
      </form>

      <article className="admin-email-preview">
        <header>
          <span><Sparkles size={18} /> Vista previa</span>
          <strong>{selectedRecipient?.companyName || "Cliente"}</strong>
          <small>{selectedRecipient?.ownerEmail || customEmail || "Sin destinatario"}</small>
        </header>
        <div>
          <small>Asunto</small>
          <h3>{renderedSubject || "Asunto del correo"}</h3>
          <p>{renderedPreheader || "Preheader del correo"}</p>
        </div>
        <section>
          {renderedBody.split(/\n{2,}/).filter(Boolean).map((paragraph, index) => (
            <p key={`${paragraph}-${index}`}>{paragraph}</p>
          ))}
        </section>
      </article>
    </section>
  );
}

function applyVariables(value: string, recipient: Recipient | null) {
  return value
    .replaceAll("{{nombre}}", recipient?.ownerName || "cliente")
    .replaceAll("{{empresa}}", recipient?.companyName || "tu empresa")
    .replaceAll("{{plan}}", recipient?.planLabel || "tu plan");
}
