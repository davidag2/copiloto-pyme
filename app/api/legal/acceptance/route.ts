import { fail, ok, requiredString } from "@/lib/api";
import { transaction } from "@/lib/db";
import { currentLegalAcceptance, legalDocumentsList } from "@/lib/legal";
import { validateRequestSession } from "@/lib/session";

function requestIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}

function acceptedDocumentsPayload() {
  return Object.fromEntries(
    legalDocumentsList.map((document) => [
      document.id,
      {
        effectiveDate: document.effectiveDate,
        label: document.label,
        path: document.path,
        version: document.version
      }
    ])
  );
}

export async function POST(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesion requerida o expirada."), 401);

    const body = await request.json();
    const accepted = body.acceptLegalTerms === true || body.acceptLegalTerms === "accepted";
    const legalVersion = requiredString(body.legalVersion, "legalVersion");

    if (!accepted || legalVersion !== currentLegalAcceptance.version) {
      throw new Error("Debes aceptar la version vigente de los documentos legales.");
    }

    const result = await transaction(async (client) => {
      const acceptance = await client.query(
        `INSERT INTO legal_acceptances (company_id, user_id, legal_version, accepted_documents, source, ip_address, user_agent)
         VALUES ($1, $2, $3, $4::jsonb, 'login_update', $5, $6)
         ON CONFLICT (company_id, user_id, legal_version, source)
         DO UPDATE SET
           accepted_documents = EXCLUDED.accepted_documents,
           ip_address = EXCLUDED.ip_address,
           user_agent = EXCLUDED.user_agent,
           accepted_at = NOW()
         RETURNING id, company_id AS "companyId", user_id AS "userId", legal_version AS "legalVersion", accepted_at AS "acceptedAt"`,
        [
          session.companyId,
          session.userId,
          legalVersion,
          JSON.stringify(acceptedDocumentsPayload()),
          requestIp(request.headers),
          request.headers.get("user-agent") || null
        ]
      );

      return acceptance.rows[0];
    });

    return ok({ legalAcceptance: result });
  } catch (error) {
    return fail(error, 400);
  }
}
