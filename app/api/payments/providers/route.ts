import { ok } from "@/lib/api";
import { isPaymentProviderConfigured, paymentProviders } from "@/lib/payment-providers";

export async function GET() {
  return ok({
    providers: paymentProviders.map((provider) => ({
      ...provider,
      configured: isPaymentProviderConfigured(provider)
    }))
  });
}
