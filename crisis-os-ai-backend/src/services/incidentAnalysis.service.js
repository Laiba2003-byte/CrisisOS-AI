import OpenAI from "openai";

const openRouterBaseUrl = "https://openrouter.ai/api/v1";
const fallbackOpenRouterModel = "openai/gpt-4o-mini";

let openai;
let activeClientKey;

function getDefaultHeaders() {
  const headers = {};

  if (process.env.OPENROUTER_HTTP_REFERER) {
    headers["HTTP-Referer"] = process.env.OPENROUTER_HTTP_REFERER;
  }

  if (process.env.OPENROUTER_APP_TITLE) {
    headers["X-OpenRouter-Title"] = process.env.OPENROUTER_APP_TITLE;
  }

  return headers;
}

function getAIConfig() {
  if (process.env.OPENROUTER_API_KEY) {
    return {
      mode: "openrouter",
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || openRouterBaseUrl,
      model:
        process.env.OPENROUTER_MODEL ||
        process.env.AI_MODEL ||
        fallbackOpenRouterModel,
      defaultHeaders: getDefaultHeaders()
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      mode: "openai",
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-5-mini"
    };
  }

  return null;
}

function getAIClient(config) {
  const clientKey = `${config.mode}:${config.apiKey}:${config.baseURL || ""}`;

  if (!openai || activeClientKey !== clientKey) {
    openai = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      defaultHeaders: config.defaultHeaders
    });
    activeClientKey = clientKey;
  }

  return openai;
}

function getMaxOutputTokens() {
  const configuredLimit = Number(
    process.env.OPENROUTER_MAX_TOKENS || process.env.AI_MAX_TOKENS || 350
  );

  if (!Number.isFinite(configuredLimit) || configuredLimit <= 0) {
    return 350;
  }

  return Math.min(Math.floor(configuredLimit), 1000);
}

function clampConfidence(value) {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(1, Math.max(0, confidence));
}

function normalizeType(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  const allowedTypes = new Set([
    "fire",
    "flood",
    "medical",
    "accident",
    "building_collapse",
    "drowning",
    "other"
  ]);

  return allowedTypes.has(normalized) ? normalized : "other";
}

function normalizeSeverity(value) {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";
  const allowedSeverities = new Set(["low", "medium", "high", "critical"]);

  return allowedSeverities.has(normalized) ? normalized : "low";
}

function normalizeAnalysis(analysis) {
  return {
    type: normalizeType(analysis?.type),
    severity: normalizeSeverity(analysis?.severity),
    location_text:
      typeof analysis?.location_text === "string" && analysis.location_text.trim()
        ? analysis.location_text.trim()
        : null,
    confidence: clampConfidence(analysis?.confidence),
    notes:
      typeof analysis?.notes === "string" && analysis.notes.trim()
        ? analysis.notes.trim()
        : "Manual review required."
  };
}

function fallbackAnalysis(reason) {
  return {
    type: "other",
    severity: "low",
    location_text: null,
    confidence: 0,
    notes: `AI analysis unavailable; manual review required. ${reason}`,
    source: "fallback"
  };
}

function stripCodeFence(content) {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function parseAssistantJson(content) {
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI response did not include text content.");
  }

  const cleaned = stripCodeFence(content);

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }

    throw new Error("AI response was not valid JSON.");
  }
}

function getJsonResponseFormat() {
  if (process.env.AI_DISABLE_RESPONSE_FORMAT === "true") {
    return undefined;
  }

  return {
    type: "json_object"
  };
}

export async function analyzeIncidentText(rawText) {
  const config = getAIConfig();

  if (!config) {
    return fallbackAnalysis(
      "OPENROUTER_API_KEY is not configured. You can also use OPENAI_API_KEY as a fallback."
    );
  }

  try {
    const client = getAIClient(config);
    const responseFormat = getJsonResponseFormat();
    const completion = await client.chat.completions.create({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "You analyze emergency reports for a crisis dispatcher. Return exactly one JSON object and no markdown. Required keys: type, severity, location_text, confidence, notes. type must be one of fire, flood, medical, accident, building_collapse, drowning, other. severity must be one of low, medium, high, critical. location_text should be the clearest place name from the report, or null if unclear. confidence must be a number from 0 to 1. notes must be one short sentence."
        },
        {
          role: "user",
          content: rawText
        }
      ],
      max_tokens: getMaxOutputTokens(),
      temperature: 0.1,
      ...(responseFormat ? { response_format: responseFormat } : {})
    });

    const content = completion.choices?.[0]?.message?.content;

    return {
      ...normalizeAnalysis(parseAssistantJson(content)),
      source: config.mode
    };
  } catch (error) {
    console.error("AI incident analysis failed:", error);
    return fallbackAnalysis(`${config.mode} request failed.`);
  }
}