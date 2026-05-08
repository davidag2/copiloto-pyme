import { ok } from "@/lib/api";
import { hashToken } from "@/lib/auth";
import { query } from "@/lib/db";
import { clearSessionCookie, sessionCookieName } from "@/lib/session";

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export async function POST(request: Request) {
  const token = cookieValue(request, sessionCookieName);
  if (token) {
    await query("UPDATE sessions SET revoked_at = NOW() WHERE token_hash = $1 AND revoked_at IS NULL", [hashToken(token)]);
  }

  const response = ok({ success: true });
  clearSessionCookie(response);
  return response;
}
