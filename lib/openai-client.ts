export type OpenAiTextResponseInput = {
  maxOutputTokens?: number;
  metadata?: Record<string, string>;
  model: string;
  system: string;
  temperature?: number;
  user: string;
};

export type OpenAiTextResponse = {
  model: string;
  raw: unknown;
  text: string;
};

type OpenAiOutputContent = {
  text?: unknown;
  type?: unknown;
};

type OpenAiOutputItem = {
  content?: unknown;
};

type OpenAiResponsesPayload = {
  error?: {
    message?: string;
    type?: string;
  };
  output?: unknown;
  output_text?: unknown;
};

export function hasOpenAiApiKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function createOpenAiTextResponse(input: OpenAiTextResponseInput): Promise<OpenAiTextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    body: JSON.stringify({
      input: [
        {
          content: [{ text: input.system, type: "input_text" }],
          role: "system"
        },
        {
          content: [{ text: input.user, type: "input_text" }],
          role: "user"
        }
      ],
      max_output_tokens: input.maxOutputTokens ?? 1200,
      metadata: input.metadata,
      model: input.model,
      temperature: input.temperature ?? 0.2
    }),
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    method: "POST"
  });

  const payload = (await response.json()) as OpenAiResponsesPayload;

  if (!response.ok) {
    const message = payload.error?.message || `OpenAI request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return {
    model: input.model,
    raw: payload,
    text: extractResponseText(payload)
  };
}

function extractResponseText(payload: OpenAiResponsesPayload) {
  if (typeof payload.output_text === "string") {
    return payload.output_text;
  }

  if (!Array.isArray(payload.output)) {
    return "";
  }

  return payload.output
    .flatMap((item: OpenAiOutputItem) => {
      if (!Array.isArray(item.content)) {
        return [];
      }

      return item.content
        .map((content: OpenAiOutputContent) => (typeof content.text === "string" ? content.text : ""))
        .filter(Boolean);
    })
    .join("\n")
    .trim();
}
