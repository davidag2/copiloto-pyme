import { NextResponse } from "next/server";
import { hashToken } from "./auth";
import { query } from "./db";
import { sessionCookieName } from "./session-constants";

export { sessionCookieName };

type SessionRow = {
  id: string;
  userId: string;
  companyId: string;
  role: string;
  userName: string;
  userEmail: string;
  companyName: string;
};

function cookieValue(request: Request, name: string) {
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function setSessionCookie(response: NextResponse, token: string, expiresAt: Date | string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(expiresAt)
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export async function validateRequestSession(request: Request, companyId?: string) {
  const token = cookieValue(request, sessionCookieName);
  if (!token) return null;

  const session = await query<SessionRow>(
    `SELECT sessions.id,
            sessions.user_id AS "userId",
            sessions.company_id AS "companyId",
            users.role,
            users.name AS "userName",
            users.email AS "userEmail",
            companies.name AS "companyName"
     FROM sessions
     JOIN users ON users.id = sessions.user_id
     JOIN companies ON companies.id = sessions.company_id
     WHERE sessions.token_hash = $1
       AND sessions.revoked_at IS NULL
       AND sessions.expires_at > NOW()
       AND users.status = 'active'
       AND ($2::uuid IS NULL OR sessions.company_id = $2::uuid)
     LIMIT 1`,
    [hashToken(token), companyId || null]
  );

  return session.rows[0] || null;
}

export async function requireCompanySession(request: Request, companyId: string) {
  const session = await validateRequestSession(request, companyId);
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "Sesion requerida o expirada." }, { status: 401 })
    };
  }
  return { ok: true as const, session };
}
