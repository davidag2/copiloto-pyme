export type PaymentProviderId = "wompi" | "bold" | "mercado_pago" | "efecty";

export type PaymentProvider = {
  id: PaymentProviderId;
  name: string;
  category: string;
  description: string;
  recommendedFor: string;
  envKeys: string[];
  supports: {
    recurring: boolean;
    cash: boolean;
    pse: boolean;
    cards: boolean;
  };
};

export const paymentProviders: PaymentProvider[] = [
  {
    id: "wompi",
    name: "Wompi",
    category: "Pasarela principal Colombia",
    description: "Tarjetas, PSE, Nequi, Bancolombia y pagos en efectivo desde una integración local.",
    recommendedFor: "Pasarela principal para suscripciones de PYMES colombianas.",
    envKeys: ["WOMPI_PUBLIC_KEY", "WOMPI_PRIVATE_KEY", "WOMPI_EVENTS_SECRET"],
    supports: { recurring: true, cash: true, pse: true, cards: true }
  },
  {
    id: "bold",
    name: "Bold",
    category: "Links y API de pagos",
    description: "Links de pago y API para cobrar con tarjetas, PSE, Nequi y otros medios locales.",
    recommendedFor: "Cobros manuales, ventas asistidas y respaldo comercial.",
    envKeys: ["BOLD_API_KEY", "BOLD_WEBHOOK_SECRET"],
    supports: { recurring: false, cash: false, pse: true, cards: true }
  },
  {
    id: "mercado_pago",
    name: "Mercado Pago",
    category: "Checkout y billetera",
    description: "Checkout Pro/API con tarjetas, PSE, Efecty y cuenta Mercado Pago.",
    recommendedFor: "Pasarela alternativa con medios online y offline amplios.",
    envKeys: ["MERCADO_PAGO_ACCESS_TOKEN", "MERCADO_PAGO_PUBLIC_KEY", "MERCADO_PAGO_WEBHOOK_SECRET"],
    supports: { recurring: true, cash: true, pse: true, cards: true }
  },
  {
    id: "efecty",
    name: "Efecty",
    category: "Pago en efectivo",
    description: "Pago offline para clientes que prefieren pagar en efectivo.",
    recommendedFor: "Clientes sin tarjeta o que pagan servicios en punto físico.",
    envKeys: ["EFECTY_CONVENIO_ID", "EFECTY_API_KEY"],
    supports: { recurring: false, cash: true, pse: false, cards: false }
  }
];

export function normalizePaymentProvider(value: unknown): PaymentProviderId {
  const normalized = String(value || "").trim().toLowerCase();
  return paymentProviders.some((provider) => provider.id === normalized) ? normalized as PaymentProviderId : "wompi";
}

export function getPaymentProvider(value: unknown) {
  const providerId = normalizePaymentProvider(value);
  return paymentProviders.find((provider) => provider.id === providerId) ?? paymentProviders[0];
}

export function isPaymentProviderConfigured(provider: PaymentProvider) {
  return provider.envKeys.every((key) => Boolean(process.env[key]));
}

export function createCheckoutReference(companyId: string, planId: string, providerId: PaymentProviderId) {
  const random = crypto.randomUUID().split("-")[0];
  return `cpyme_${providerId}_${planId}_${companyId.slice(0, 8)}_${random}`;
}
