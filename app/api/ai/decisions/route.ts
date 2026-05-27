import { fail, ok, requiredString } from "@/lib/api";
import { buildBusinessSnapshot } from "@/lib/business-snapshot";
import { canUseAiDecisionEngine, generateAiDecisionEngineResult } from "@/lib/ai-decision-engine";
import { requireCompanySession } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const companyId = requiredString(body.companyId, "companyId");
    const session = await requireCompanySession(request, companyId);

    if (!session.ok) {
      return session.response;
    }

    if (!canUseAiDecisionEngine()) {
      return fail(new Error("OPENAI_API_KEY no esta configurada para generar decisiones IA."), 503);
    }

    const snapshot = await buildBusinessSnapshot(companyId);
    const result = await generateAiDecisionEngineResult(snapshot);

    return ok({
      generatedAt: new Date().toISOString(),
      snapshot,
      ...result
    });
  } catch (error) {
    return fail(error, 400);
  }
}
