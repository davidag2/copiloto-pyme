"use client";

import { Bot, Headphones, Loader2, MessageCircle, Send, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Ticket = {
  number: string;
  estimatedResponse: string;
  persisted?: boolean;
};

const welcomeMessage: ChatMessage = {
  role: "assistant",
  content: "Hola, soy el asistente de Copiloto Pyme. Te ayudo con planes, módulos, demo o soporte de cuenta."
};

export function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([welcomeMessage]);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [ticket, setTicket] = useState<Ticket | null>(null);

  const needsSupportData = useMemo(() => {
    const lastAssistant = messages.filter((message) => message.role === "assistant").at(-1)?.content.toLowerCase() || "";
    return lastAssistant.includes("ticket") || lastAssistant.includes("email") || Boolean(ticket);
  }, [messages, ticket]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages = [...messages, { role: "user", content } satisfies ChatMessage];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company,
          email,
          messages: nextMessages.filter((message) => message !== welcomeMessage),
          name
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No pude responder en este momento.");
      if (data.ticket) setTicket(data.ticket);
      if (data.provider !== "openai") {
        console.warn("[Copiloto Pyme Chatbot] Respuesta en modo fallback. Revisa OPENAI_CHATBOT_API_KEY y logs de Vercel.");
      }
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "No pude responder en este momento.";
      setMessages((current) => [...current, { role: "assistant", content: message }]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="mkt-chatbot" data-open={isOpen}>
      {isOpen && (
        <section className="mkt-chatbot-panel" aria-label="Chat de ventas y soporte">
          <header>
            <div>
              <i><Bot size={20} /></i>
              <span>Asistente Copiloto Pyme</span>
              <small>Ventas y soporte</small>
            </div>
            <button aria-label="Cerrar chat" onClick={() => setIsOpen(false)} type="button"><X size={18} /></button>
          </header>

          <div className="mkt-chatbot-messages" aria-live="polite">
            {messages.map((message, index) => (
              <article data-role={message.role} key={`${message.role}-${index}`}>
                {message.content}
              </article>
            ))}
            {isSending && (
              <article data-role="assistant" className="is-loading">
                <Loader2 size={16} /> Pensando...
              </article>
            )}
          </div>

          {needsSupportData && (
            <div className="mkt-chatbot-contact">
              <span><Headphones size={14} /> Datos para soporte</span>
              <input aria-label="Nombre" onChange={(event) => setName(event.target.value)} placeholder="Tu nombre" value={name} />
              <input aria-label="Empresa" onChange={(event) => setCompany(event.target.value)} placeholder="Empresa" value={company} />
              <input aria-label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="Email para responderte" type="email" value={email} />
            </div>
          )}

          {ticket && (
            <div className="mkt-chatbot-ticket">
              <strong>{ticket.number}</strong>
              <span>{ticket.estimatedResponse}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <input
              aria-label="Mensaje para el asistente"
              onChange={(event) => setInput(event.target.value)}
              placeholder="Pregunta por planes, módulos o soporte..."
              value={input}
            />
            <button aria-label="Enviar mensaje" disabled={isSending || !input.trim()} type="submit">
              <Send size={18} />
            </button>
          </form>
        </section>
      )}

      <button className="mkt-chatbot-toggle" onClick={() => setIsOpen((value) => !value)} type="button">
        <MessageCircle size={22} />
        <span>Asistente</span>
      </button>
    </div>
  );
}
