"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type AdminRestoreClientButtonProps = {
  companyId: string;
};

export function AdminRestoreClientButton({ companyId }: AdminRestoreClientButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="admin-restore-client">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            setMessage("");
            const response = await fetch(`/api/admin/clients/${companyId}/actions`, {
              body: JSON.stringify({ action: "restore_client" }),
              headers: { "Content-Type": "application/json" },
              method: "POST"
            });
            const data = await response.json();
            setMessage(response.ok ? data.message || "Cliente restaurado." : data.error || "No se pudo restaurar.");
            router.refresh();
          });
        }}
      >
        Restaurar
      </button>
      {message ? <small>{message}</small> : null}
    </div>
  );
}
