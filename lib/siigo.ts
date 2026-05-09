import { getPlanById } from "./plans";

export type BillingProfile = {
  personType: "person" | "company";
  idType: string;
  identification: string;
  checkDigit?: string | null;
  legalName: string;
  address: string;
  countryCode: string;
  stateCode: string;
  cityCode: string;
  email: string;
  phone?: string | null;
  fiscalResponsibilityCode: string;
};

export type SiigoPayment = {
  id: string;
  companyId: string;
  planId: string;
  amountCop: number;
  externalReference: string;
  providerId: string;
};

export type SiigoConfig = {
  username: string;
  accessKey: string;
  partnerId: string;
  documentId: number;
  sellerId: number;
  paymentTypeId: number;
  productCode: string;
  baseUrl: string;
  sendToDian: boolean;
  sendMail: boolean;
};

export function getSiigoConfig(): SiigoConfig | null {
  const username = process.env.SIIGO_USERNAME;
  const accessKey = process.env.SIIGO_ACCESS_KEY;
  const partnerId = process.env.SIIGO_PARTNER_ID;
  const documentId = Number(process.env.SIIGO_DOCUMENT_ID);
  const sellerId = Number(process.env.SIIGO_SELLER_ID);
  const paymentTypeId = Number(process.env.SIIGO_PAYMENT_TYPE_ID);
  const productCode = process.env.SIIGO_PRODUCT_CODE || "COPILOTO-PYME";

  if (!username || !accessKey || !partnerId || !Number.isFinite(documentId) || !Number.isFinite(sellerId) || !Number.isFinite(paymentTypeId)) {
    return null;
  }

  return {
    username,
    accessKey,
    partnerId,
    documentId,
    sellerId,
    paymentTypeId,
    productCode,
    baseUrl: process.env.SIIGO_BASE_URL || "https://api.siigo.com",
    sendToDian: process.env.SIIGO_SEND_TO_DIAN === "true",
    sendMail: process.env.SIIGO_SEND_MAIL !== "false"
  };
}

export function hasCompleteBillingProfile(profile?: Partial<BillingProfile> | null) {
  return Boolean(
    profile?.personType &&
    profile?.idType &&
    profile?.identification &&
    profile?.legalName &&
    profile?.address &&
    profile?.countryCode &&
    profile?.stateCode &&
    profile?.cityCode &&
    profile?.email
  );
}

export function buildSiigoInvoicePayload(config: SiigoConfig, profile: BillingProfile, payment: SiigoPayment) {
  const plan = getPlanById(payment.planId);
  const today = new Date().toISOString().slice(0, 10);
  const customerName = profile.personType === "company" ? [profile.legalName] : splitPersonName(profile.legalName);

  return {
    document: { id: config.documentId },
    date: today,
    customer: {
      person_type: profile.personType,
      id_type: profile.idType,
      identification: profile.identification,
      check_digit: profile.checkDigit || undefined,
      name: customerName,
      branch_office: 0,
      fiscal_responsibilities: [{ code: profile.fiscalResponsibilityCode }],
      address: {
        address: profile.address,
        city: {
          country_code: profile.countryCode,
          state_code: profile.stateCode,
          city_code: profile.cityCode
        }
      },
      phones: profile.phone ? [{ indicative: "57", number: profile.phone }] : [],
      contacts: [
        {
          first_name: profile.personType === "company" ? profile.legalName : customerName[0],
          last_name: profile.personType === "company" ? "" : customerName.slice(1).join(" "),
          email: profile.email
        }
      ]
    },
    seller: config.sellerId,
    observations: `Suscripción ${plan.name} Copiloto Pyme. Referencia de pago: ${payment.externalReference}.`,
    items: [
      {
        code: config.productCode,
        description: `Suscripción mensual Copiloto Pyme - Plan ${plan.name}`,
        quantity: 1,
        price: payment.amountCop
      }
    ],
    payments: [
      {
        id: config.paymentTypeId,
        value: payment.amountCop,
        due_date: today
      }
    ],
    stamp: { send: config.sendToDian },
    mail: { send: config.sendMail }
  };
}

export async function createSiigoInvoice(config: SiigoConfig, payload: unknown) {
  const tokenResponse = await fetch(`${config.baseUrl}/auth`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Partner-Id": config.partnerId
    },
    body: JSON.stringify({
      username: config.username,
      access_key: config.accessKey
    })
  });

  const tokenPayload = await tokenResponse.json();
  if (!tokenResponse.ok) {
    throw new Error(tokenPayload?.message || tokenPayload?.error || "No se pudo autenticar con SIIGO.");
  }

  const invoiceResponse = await fetch(`${config.baseUrl}/v1/invoices`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenPayload.access_token}`,
      "Content-Type": "application/json",
      "Partner-Id": config.partnerId
    },
    body: JSON.stringify(payload)
  });

  const invoicePayload = await invoiceResponse.json();
  if (!invoiceResponse.ok) {
    throw new Error(invoicePayload?.message || invoicePayload?.error || "SIIGO rechazó la creación de la factura.");
  }

  return invoicePayload;
}

function splitPersonName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return [parts[0], ""];
  return [parts[0], parts.slice(1).join(" ")];
}
