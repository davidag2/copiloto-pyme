import { fail, ok, requiredString } from "@/lib/api";
import { query } from "@/lib/db";
import { validateRequestSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesión requerida o expirada."), 401);

    const profile = await query(
      `SELECT id,
              company_id AS "companyId",
              person_type AS "personType",
              id_type AS "idType",
              identification,
              check_digit AS "checkDigit",
              legal_name AS "legalName",
              address,
              country_code AS "countryCode",
              state_code AS "stateCode",
              city_code AS "cityCode",
              email,
              phone,
              fiscal_responsibility_code AS "fiscalResponsibilityCode",
              updated_at AS "updatedAt"
       FROM billing_profiles
       WHERE company_id = $1
       LIMIT 1`,
      [session.companyId]
    );

    return ok({ profile: profile.rows[0] || null });
  } catch (error) {
    return fail(error, 400);
  }
}

export async function PUT(request: Request) {
  try {
    const session = await validateRequestSession(request);
    if (!session) return fail(new Error("Sesión requerida o expirada."), 401);

    const body = await request.json();
    const personType = requiredString(body.personType, "personType").toLowerCase();
    if (!["person", "company"].includes(personType)) throw new Error("personType debe ser person o company.");

    const profile = await query(
      `INSERT INTO billing_profiles (
         company_id,
         person_type,
         id_type,
         identification,
         check_digit,
         legal_name,
         address,
         country_code,
         state_code,
         city_code,
         email,
         phone,
         fiscal_responsibility_code
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (company_id) DO UPDATE SET
         person_type = EXCLUDED.person_type,
         id_type = EXCLUDED.id_type,
         identification = EXCLUDED.identification,
         check_digit = EXCLUDED.check_digit,
         legal_name = EXCLUDED.legal_name,
         address = EXCLUDED.address,
         country_code = EXCLUDED.country_code,
         state_code = EXCLUDED.state_code,
         city_code = EXCLUDED.city_code,
         email = EXCLUDED.email,
         phone = EXCLUDED.phone,
         fiscal_responsibility_code = EXCLUDED.fiscal_responsibility_code,
         updated_at = NOW()
       RETURNING id,
                 company_id AS "companyId",
                 person_type AS "personType",
                 id_type AS "idType",
                 identification,
                 check_digit AS "checkDigit",
                 legal_name AS "legalName",
                 address,
                 country_code AS "countryCode",
                 state_code AS "stateCode",
                 city_code AS "cityCode",
                 email,
                 phone,
                 fiscal_responsibility_code AS "fiscalResponsibilityCode",
                 updated_at AS "updatedAt"`,
      [
        session.companyId,
        personType,
        requiredString(body.idType, "idType"),
        requiredString(body.identification, "identification"),
        typeof body.checkDigit === "string" ? body.checkDigit.trim() || null : null,
        requiredString(body.legalName, "legalName"),
        requiredString(body.address, "address"),
        requiredString(body.countryCode, "countryCode").toUpperCase(),
        requiredString(body.stateCode, "stateCode"),
        requiredString(body.cityCode, "cityCode"),
        requiredString(body.email, "email").toLowerCase(),
        typeof body.phone === "string" ? body.phone.trim() || null : null,
        body.fiscalResponsibilityCode || "R-99-PN"
      ]
    );

    return ok({ profile: profile.rows[0] });
  } catch (error) {
    return fail(error, 400);
  }
}
