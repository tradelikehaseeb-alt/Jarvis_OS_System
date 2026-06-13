const PROVIDER_MOCK_PREFIX = /^Hermes\s+\([^)]+\)\s+\(mock\):\s*/i;
const PROVIDER_DEPLOYMENT_PREFIX = /^\[(local|cloud|remote)\]\s*/i;

const RAW_API_ERROR =
  /^(api call failed|http 429|rate limit|groq chat failed|hermes_groq|tokens per minute)/i;

/**
 * Strip provider-registry mock labels from assistant text shown in Jarvis UI.
 */
export function stripProviderDecoration(text: string): string {
  return text
    .replace(PROVIDER_MOCK_PREFIX, "")
    .replace(PROVIDER_DEPLOYMENT_PREFIX, "")
    .trim();
}

/** True when text is a raw LLM/API failure — never show in chat bubbles. */
export function looksLikeRawApiError(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return (
    RAW_API_ERROR.test(normalized) ||
    normalized.startsWith("fetch failed") ||
    normalized.includes("hermes agent exited") ||
    normalized.includes("toolsets=") ||
    normalized.includes("organization `org_") ||
    normalized.includes("could not recover after multiple attempts") ||
    normalized.includes("tokens per minute (tpm)")
  );
}

/** User-friendly message for known backend failures (Urdu + English). */
export function friendlyUserErrorMessage(raw?: string): string {
  const text = (raw ?? "").trim().toLowerCase();
  if (!text) {
    return "Abhi jawab nahi de sakta. Thodi der baad dubara try karo.";
  }
  if (
    text.includes("429") ||
    text.includes("rate limit") ||
    text.includes("tokens per minute")
  ) {
    return "Groq thoda busy hai — 15–20 second wait karo, phir dubara bolo ya type karo.";
  }
  if (text.includes("could not recover after multiple attempts")) {
    return "Jarvis abhi recover nahi ho saka. Ek minute wait karke dubara try karo.";
  }
  if (text.includes("fetch failed") || text.includes("econnrefused")) {
    return "Network issue aa gaya. Internet check karo aur dubara try karo.";
  }
  if (text.includes("groq") && text.includes("missing")) {
    return "GROQ_API_KEY set karo .env mein — phir app restart karo.";
  }
  return "Abhi jawab nahi de sakta. Thodi der baad dubara try karo.";
}

/**
 * Clean assistant reply before rendering in Jarvis chat UI.
 */
export function sanitizeAssistantReplyForDisplay(text: string): string {
  const cleaned = stripProviderDecoration(text);
  if (!cleaned || looksLikeRawApiError(cleaned)) {
    return friendlyUserErrorMessage(cleaned);
  }
  return cleaned;
}
