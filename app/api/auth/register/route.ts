import { fail, ok, optionalNumber, requiredString } from "@/lib/api";
import { createPlainToken, hashPassword, hashToken, normalizeEmail, requirePassword } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { sendEmail, welcomeEmailBody } from "@/lib/email";
import { currentLegalAcceptance, legalDocumentsList } from "@/lib/legal";
import { getPlanById, getTrialEndsAt } from "@/lib/plans";
import { normalizeRole } from "@/lib/roles";
import { setSessionCookie } from "@/lib/session";

const defaultRules = [
  ["sales", 70, "below"],
  ["cash", 14, "below"],
  ["margin", 30, "below"],
  ["stock", 3, "above"]
];

const defaultIntegrations = [
  ["Google Sheets", "Hojas de calculo", "Disponible", "Manual"],
  ["Siigo", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Alegra", "Facturacion y contabilidad", "Disponible", "Cada 6 horas"],
  ["Mercado Pago", "Pagos", "Disponible", "Cada hora"],
  ["Shopify", "Ecommerce", "Disponible", "Cada 3 horas"],
  ["WooCommerce", "Ecommerce", "Disponible", "Cada 3 horas"]
];

const defaultSalesChannels = ["Mostrador", "WhatsApp", "Instagram", "Mercado Libre", "Sitio web"];
const defaultPaymentMethods = [
  ["Efectivo", "cash"],
  ["Transferencia bancaria", "bank_transfer"],
  ["Tarjeta", "card"],
  ["Mercado Pago", "digital_wallet"],
  ["Crédito cliente", "credit"]
];

function getRequestIp(headers: Headers) {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const headers = request.headers;
    const companyName = requiredString(body.companyName, "companyName");
    const ownerName = requiredString(body.ownerName, "ownerName");
    const ownerEmail = normalizeEmail(requiredString(body.ownerEmail, "ownerEmail"));
    const password = requirePassword(body.password);
    const selectedPlan = getPlanById(body.plan);
    const acceptedLegalTerms = body.acceptLegalTerms === true || body.acceptLegalTerms === "accepted";
    const legalVersion = requiredString(body.legalVersion, "legalVersion");
    if (!acceptedLegalTerms || legalVersion !== currentLegalAcceptance.version) {
      throw new Error("Debes aceptar la version vigente de los documentos legales para crear la cuenta.");
    }

    const acceptedDocuments = Object.fromEntries(
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
    const ipAddress = getRequestIp(headers);
    const userAgent = headers.get("user-agent") || null;
    const trialStartsAt = new Date();
    const trialEndsAt = getTrialEndsAt(trialStartsAt);

    const result = await transaction(async (client) => {
      const company = await client.query(
        `INSERT INTO companies (name, country, business_type, currency, plan, monthly_goal, minimum_stock, data_source)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id, name, country, business_type AS "businessType", currency, plan, monthly_goal AS "monthlyGoal", minimum_stock AS "minimumStock", data_source AS "dataSource"`,
        [
          companyName,
          body.country || "Colombia",
          body.businessType || "PYME",
          body.currency || "COP",
          selectedPlan.id,
          optionalNumber(body.monthlyGoal) ?? 0,
          optionalNumber(body.minimumStock) ?? 0,
          body.dataSource || "Excel/CSV"
        ]
      );
      const companyId = company.rows[0].id;

      const user = await client.query(
        `INSERT INTO users (company_id, name, email, password_hash, role, status, last_login_at)
         VALUES ($1, $2, $3, $4, $5, 'active', NOW())
         RETURNING id, company_id AS "companyId", name, email, role, status, created_at AS "createdAt"`,
        [companyId, ownerName, ownerEmail, hashPassword(password), normalizeRole("propietario")]
      );

      for (const rule of defaultRules) {
        await client.query(
          `INSERT INTO alert_rules (company_id, metric, threshold, comparator)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (company_id, metric) DO NOTHING`,
          [companyId, ...rule]
        );
      }

      for (const integration of defaultIntegrations) {
        await client.query(
          `INSERT INTO integrations (company_id, provider, category, status, sync_label)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (company_id, provider) DO NOTHING`,
          [companyId, ...integration]
        );
      }

      for (const channel of defaultSalesChannels) {
        await client.query(
          `INSERT INTO sales_channels (company_id, name)
           VALUES ($1, $2)
           ON CONFLICT (company_id, name) DO NOTHING`,
          [companyId, channel]
        );
      }

      for (const method of defaultPaymentMethods) {
        await client.query(
          `INSERT INTO sales_payment_methods (company_id, name, type)
           VALUES ($1, $2, $3)
           ON CONFLICT (company_id, name) DO NOTHING`,
          [companyId, ...method]
        );
      }

      await client.query(
        `INSERT INTO sales_reps (company_id, user_id, name, email)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (company_id, email) DO NOTHING`,
        [companyId, user.rows[0].id, ownerName, ownerEmail]
      );

      const legalAcceptance = await client.query(
        `INSERT INTO legal_acceptances (company_id, user_id, legal_version, accepted_documents, source, ip_address, user_agent)
         VALUES ($1, $2, $3, $4::jsonb, 'registration', $5, $6)
         RETURNING id, company_id AS "companyId", user_id AS "userId", legal_version AS "legalVersion", accepted_at AS "acceptedAt"`,
        [
          companyId,
          user.rows[0].id,
          legalVersion,
          JSON.stringify(acceptedDocuments),
          ipAddress,
          userAgent
        ]
      );

      const sessionToken = createPlainToken();
      const sessionTokenHash = hashToken(sessionToken);
      const sessionExpiresAt = new Date();
      sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 30);

      const subscription = await client.query(
        `INSERT INTO subscriptions (company_id, plan_id, status, current_period_start, current_period_end, trial_starts_at, trial_ends_at)
         VALUES ($1, $2, 'trial', $3, $4, $3, $4)
         RETURNING id, company_id AS "companyId", plan_id AS "planId", status, trial_starts_at AS "trialStartsAt", trial_ends_at AS "trialEndsAt", created_at AS "createdAt"`,
        [companyId, selectedPlan.id, trialStartsAt, trialEndsAt]
      );

      const onboarding = await client.query(
        `INSERT INTO onboarding_progress (company_id, status, current_step)
         VALUES ($1, 'pending', 'connect_data')
         RETURNING id, company_id AS "companyId", status, current_step AS "currentStep", completed_steps AS "completedSteps", created_at AS "createdAt"`,
        [companyId]
      );

      const session = await client.query(
        `INSERT INTO sessions (user_id, company_id, token_hash, user_agent, ip_address, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, user_id AS "userId", company_id AS "companyId", expires_at AS "expiresAt", created_at AS "createdAt"`,
        [
          user.rows[0].id,
          companyId,
          sessionTokenHash,
          userAgent,
          ipAddress,
          sessionExpiresAt
        ]
      );

      return {
        company: company.rows[0],
        user: user.rows[0],
        session: {
          token: sessionToken,
          tokenHash: sessionTokenHash,
          expiresAt: session.rows[0].expiresAt
        },
        subscription: subscription.rows[0],
        onboarding: onboarding.rows[0],
        legalAcceptance: legalAcceptance.rows[0],
        registration: {
          plan: selectedPlan,
          trial: {
            status: "trial",
            startsAt: trialStartsAt.toISOString(),
            endsAt: trialEndsAt.toISOString()
          },
          nextStep: "/onboarding"
        }
      };
    });

    await sendEmail({
      body: welcomeEmailBody({
        companyName: result.company.name,
        ownerName: result.user.name,
        planName: result.subscription.planId,
        trialEndsAt: result.subscription.trialEndsAt
      }),
      companyId: result.company.id,
      metadata: {
        source: "auth_register",
        userId: result.user.id
      },
      preheader: "Bienvenido a Copiloto Pyme. Tu mes gratis ya está activo.",
      subject: "Bienvenido a Copiloto Pyme",
      templateKey: "welcome",
      to: result.user.email
    });

    const response = ok(result, 201);
    setSessionCookie(response, result.session.token, result.session.expiresAt);
    return response;
  } catch (error) {
    return fail(error, 400);
  }
}
