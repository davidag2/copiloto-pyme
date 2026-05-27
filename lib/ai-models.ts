export type AiModelPurpose =
  | "dailyAnalysis"
  | "decisionEngine"
  | "voiceAssistant"
  | "embeddings";

export type AiModelConfig = {
  description: string;
  envKey: string;
  model: string;
  purpose: AiModelPurpose;
};

export const aiModels = {
  dailyAnalysis: {
    description: "Analisis diario, resumen ejecutivo, alertas y recomendaciones de bajo costo.",
    envKey: "OPENAI_DAILY_ANALYSIS_MODEL",
    model: process.env.OPENAI_DAILY_ANALYSIS_MODEL || "gpt-4o-mini",
    purpose: "dailyAnalysis"
  },
  decisionEngine: {
    description: "Motor de decisiones del dashboard: prioridades, impacto estimado y acciones sugeridas.",
    envKey: "OPENAI_DECISION_MODEL",
    model: process.env.OPENAI_DECISION_MODEL || "gpt-4o-mini",
    purpose: "decisionEngine"
  },
  voiceAssistant: {
    description: "Asistente de voz para llamadas entrantes con Twilio y respuestas realtime.",
    envKey: "OPENAI_VOICE_MODEL",
    model: process.env.OPENAI_VOICE_MODEL || "gpt-4o-mini-realtime-preview",
    purpose: "voiceAssistant"
  },
  embeddings: {
    description: "Busqueda semantica economica para documentos, preguntas frecuentes y memoria del negocio.",
    envKey: "OPENAI_EMBEDDING_MODEL",
    model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small",
    purpose: "embeddings"
  }
} satisfies Record<AiModelPurpose, AiModelConfig>;

export function getAiModel(purpose: AiModelPurpose) {
  return aiModels[purpose].model;
}

export function getAiModelCatalog() {
  return Object.values(aiModels);
}
