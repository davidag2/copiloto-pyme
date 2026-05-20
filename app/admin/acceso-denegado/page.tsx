import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { validateAdminSession } from "@/lib/admin-access";
import { validateRequestSession } from "@/lib/session";

export default async function AdminAccessDeniedPage() {
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const request = new Request("https://copiloto-pyme.local/admin/acceso-denegado", { headers: { cookie } });
  const session = await validateRequestSession(request);

  if (!session) redirect("/login?next=/admin");

  const adminSession = await validateAdminSession(request);
  if (adminSession) redirect("/admin");

  return (
    <main className="admin-denied-page">
      <section>
        <span><LockKeyhole size={22} /></span>
        <h1>Acceso administrativo no autorizado</h1>
        <p>
          Tu cuenta tiene sesion activa en Copiloto Pyme, pero no tiene un rol administrativo de Tecnotitan.
          Pide a un superadmin que te asigne un rol en el modulo interno.
        </p>
        <div>
          <strong>{session.userName}</strong>
          <small>{session.userEmail}</small>
        </div>
        <a href="/dashboard">Volver al dashboard</a>
      </section>
    </main>
  );
}
