import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession } from "@/lib/admin-access";
import { validateRequestSession } from "@/lib/session";

export async function requireAdminPageSession(pathname: string) {
  const headerList = await headers();
  const cookie = headerList.get("cookie") || "";
  const request = new Request(`https://copiloto-pyme.local${pathname}`, { headers: { cookie } });
  const session = await validateRequestSession(request);

  if (!session) redirect(`/login?next=${encodeURIComponent(pathname)}`);

  const adminSession = await validateAdminSession(request);
  if (!adminSession) redirect("/admin/acceso-denegado");

  return adminSession;
}
