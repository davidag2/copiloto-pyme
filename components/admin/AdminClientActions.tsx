"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Ban, Clock3, FileText, LifeBuoy, Link2, Mail, ReceiptText, RefreshCw, Send, ShieldCheck, Trash2, Undo2, UnlockKeyhole, UserRoundCheck } from "lucide-react";

type AdminClientActionsProps = {
  companyId: string;
  currentPlan: string;
  isBlocked: boolean;
  isDeleted: boolean;
};

type PendingAction = {
  action: string;
  title: string;
  body: string;
  danger?: boolean;
  payload?: Record<string, unknown>;
};

export function AdminClientActions({ companyId, currentPlan, isBlocked, isDeleted }: AdminClientActionsProps) {
  const router = useRouter();
  const [planId, setPlanId] = useState(currentPlan || "go");
  const [trialDays, setTrialDays] = useState("30");
  const [message, setMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [isPending, startTransition] = useTransition();

  async function runAction(action: string, payload: Record<string, unknown> = {}) {
    setMessage("");
    const response = await fetch(`/api/admin/clients/${companyId}/actions`, {
      body: JSON.stringify({ action, ...payload }),
      headers: { "Content-Type": "application/json" },
      method: "POST"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "No se pudo completar la acción.");
    setMessage(data.message || "Acción completada.");

    if (data.redirectTo) {
      window.location.assign(data.redirectTo);
      return;
    }

    router.refresh();
  }

  function submit(action: string, payload: Record<string, unknown> = {}) {
    startTransition(async () => {
      try {
        await runAction(action, payload);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "No se pudo completar la acción.");
      }
    });
  }

  function confirm(action: PendingAction) {
    setPendingAction(action);
  }

  return (
    <section className="admin-table-card admin-actions-card">
      <header>
        <div>
          <span><RefreshCw size={18} /> Acciones operativas</span>
          <h2>Gestión rápida del cliente</h2>
        </div>
        {message ? <strong className="admin-action-message">{message}</strong> : null}
      </header>

      <div className="admin-actions-grid">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit("change_plan", { planId });
          }}
        >
          <label>
            Cambiar plan
            <select value={planId} onChange={(event) => setPlanId(event.target.value)} disabled={isPending || isDeleted}>
              <option value="go">Go</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <button type="submit" disabled={isPending || isDeleted}><ShieldCheck size={18} /> Aplicar plan</button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit("extend_trial", { days: Number(trialDays) || 30 });
          }}
        >
          <label>
            Extender prueba
            <select value={trialDays} onChange={(event) => setTrialDays(event.target.value)} disabled={isPending || isDeleted}>
              <option value="7">7 días</option>
              <option value="15">15 días</option>
              <option value="30">30 días</option>
              <option value="60">60 días</option>
              <option value="90">90 días</option>
            </select>
          </label>
          <button type="submit" disabled={isPending || isDeleted}><Clock3 size={18} /> Extender</button>
        </form>

        <button type="button" onClick={() => submit("resend_payment_link")} disabled={isPending || isDeleted}><Link2 size={18} /> Reenviar link de pago</button>
        <button type="button" onClick={() => submit("send_payment_reminder_email")} disabled={isPending || isDeleted}><Mail size={18} /> Recordatorio email</button>
        <button type="button" onClick={() => submit("send_payment_reminder_whatsapp")} disabled={isPending || isDeleted}><Send size={18} /> Recordatorio WhatsApp</button>
        <button type="button" onClick={() => submit("resend_invoice")} disabled={isPending || isDeleted}><FileText size={18} /> Reenviar factura</button>
        <button type="button" onClick={() => confirm({ action: "mark_manual_payment", title: "Marcar pago manual", body: "Se registrará un pago manual por el valor del plan actual, se activará la suscripción por un mes y se auditará la acción." })} disabled={isPending || isDeleted}><ReceiptText size={18} /> Marcar pago manual</button>
        <button type="button" onClick={() => submit("open_support_case", { title: "Caso operativo del cliente", priority: "normal" })} disabled={isPending || isDeleted}><LifeBuoy size={18} /> Abrir caso soporte</button>

        {isBlocked ? (
          <button type="button" onClick={() => submit("unblock_access")} disabled={isPending || isDeleted}><UnlockKeyhole size={18} /> Desbloquear acceso</button>
        ) : (
          <button type="button" onClick={() => confirm({ action: "block_access", title: "Bloquear acceso", body: "El cliente no podrá entrar al dashboard hasta que sea desbloqueado." })} disabled={isPending || isDeleted}><Ban size={18} /> Bloquear acceso</button>
        )}

        <button
          type="button"
          onClick={() => confirm({ action: "impersonate_client", title: "Impersonar cliente", body: "Entrarás al dashboard como el usuario propietario del cliente. La acción quedará registrada en auditoría." })}
          disabled={isPending || isDeleted}
        >
          <UserRoundCheck size={18} /> Impersonar cliente
        </button>

        {isDeleted ? (
          <button type="button" onClick={() => submit("restore_client")} disabled={isPending}><Undo2 size={18} /> Restaurar cliente</button>
        ) : (
          <button
            className="admin-danger-action"
            type="button"
            onClick={() => confirm({ action: "delete_client", title: "¿Estás seguro de eliminar este cliente?", body: "El cliente pasará a la lista de borrados, su dashboard quedará bloqueado y podrás restaurarlo después.", danger: true })}
            disabled={isPending}
          >
            <Trash2 size={18} /> Eliminar cliente
          </button>
        )}
      </div>

      {pendingAction ? (
        <div className="admin-confirm-backdrop" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title">
          <div className="admin-confirm-modal">
            <strong id="admin-confirm-title">{pendingAction.title}</strong>
            <p>{pendingAction.body}</p>
            <div>
              <button type="button" onClick={() => setPendingAction(null)}>No</button>
              <button
                className={pendingAction.danger ? "admin-danger-action" : ""}
                type="button"
                onClick={() => {
                  const action = pendingAction.action;
                  const payload = pendingAction.payload || {};
                  setPendingAction(null);
                  submit(action, payload);
                }}
              >
                Sí
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
