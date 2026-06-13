/** How Hermes should execute a user query. */
export type HermesExecutionMode = "fast" | "skills";

/** Skill category for subprocess toolsets and UI status. */
export type HermesSkillCategory =
  | "search"
  | "memory"
  | "vision"
  | "file"
  | "development"
  | "automate"
  | "general";

const SEARCH_PATTERN =
  /\b(search|find|dhundo|dhundho|latest|news|price|prices|cost|kitna|rate|rates|website|link|url|official|check|dekho|kharidna|buy|order|cheak|chek)\b/i;
const MEMORY_STORE_PATTERN =
  /\b(yaad\s+rakho|yaad\s+rakhna|remember\s+that|note\s+karo|store\s+karo)\b/i;
const MEMORY_RECALL_PATTERN =
  /\b(yaad|pehle|last\s+conversation|maine\s+.*\s+bataya|favorite|fav|pasand|pata\s+hai|kon\s*sa|konsa|mera|meri|mere)\b/i;
const VISION_PATTERN =
  /\b(image|photo|picture|screenshot|yeh\s+kya\s+hai|ye\s+kya\s+hai)\b/i;
const FILE_PATTERN =
  /\b(file\s+banao|document|save\s+karo|create\s+file|write\s+file)\b/i;
const DEVELOPMENT_PATTERN =
  /\b(debug|fix\s+(?:the\s+)?code|code\s+fix|run\s+(?:the\s+)?command|command\s+chala|terminal|shell|build\s+(?:the\s+)?project|test\s+(?:the\s+)?project|compile|install|video(?:\s+\w+){0,3}\s+edit|edit\s+(?:the\s+)?video|audio(?:\s+\w+){0,3}\s+edit|edit\s+(?:the\s+)?audio|convert\s+(?:the\s+)?(?:file|video|audio)|render|ffmpeg)\b/i;
const WINDOWS_AUTOMATION_PATTERN =
  /\b(close\s+window|active\s+window|desktop|pyautogui|automation|taskkill|click|type\s+text|move\s+file|window\s+control|minimize|maximize|open\s+app|switch\s+window|focus\s+window)\b/i;

const GREETING_PATTERN =
  /^(hello|hi|hey|salam|assalam|assalamu|kya\s+haal|kaise\s+ho|thanks|thank\s+you|shukriya|theek|ok|okay)\b/i;
const YES_NO_PATTERN =
  /^(yes|no|haan|han|nahi|nah|theek\s+hai|bilkul|sure|ok)\b/i;
const EXPLAIN_PATTERN =
  /\b(explain|samjhao|samjha|matlab|meaning|kya\s+hai)\b/i;

const REAL_WORLD_PATTERN =
  /\b(price|cost|kitna|rate|latest|news|weather|stock|market|pakistan|lahore|karachi|iphone|samsung|google|amazon|daraz|order|buy|kharid|link|website|official|search|dhundo)\b/i;

const ACTION_PATTERN =
  /\b(search|find|check|dekho|khol|open|save|remember|yaad|buy|order|kharid|create|write|banao|karo|kr[oao])\b/i;

function normalizeQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/^(hey|hi|ok)\s+jarvis[,!\s]+/u, "")
    .trim();
}

function tokenize(query: string): readonly string[] {
  return normalizeQuery(query).split(/[^a-z0-9\u0600-\u06FF]+/).filter(Boolean);
}

function hasSearchSkillSignal(normalized: string, tokens: readonly string[]): boolean {
  if (SEARCH_PATTERN.test(normalized)) {
    return true;
  }
  if (
    tokens.includes("batao") &&
    tokens.length >= 4 &&
    REAL_WORLD_PATTERN.test(normalized)
  ) {
    return true;
  }
  return false;
}

/** Detect skill category from query text. */
export function getHermesSkillCategory(query: string): HermesSkillCategory {
  const normalized = normalizeQuery(query);
  if (MEMORY_STORE_PATTERN.test(normalized)) {
    return "memory";
  }
  if (
    MEMORY_RECALL_PATTERN.test(normalized) &&
    !hasSearchSkillSignal(normalized, tokenize(query))
  ) {
    return "memory";
  }
  if (VISION_PATTERN.test(normalized)) {
    return "vision";
  }
  if (FILE_PATTERN.test(normalized)) {
    return "file";
  }
  if (WINDOWS_AUTOMATION_PATTERN.test(normalized)) {
    return "automate";
  }
  if (DEVELOPMENT_PATTERN.test(normalized)) {
    return "development";
  }
  if (hasSearchSkillSignal(normalized, tokenize(query))) {
    return "search";
  }
  return "general";
}

function isPureGreeting(normalized: string, tokens: readonly string[]): boolean {
  if (GREETING_PATTERN.test(normalized)) {
    return true;
  }
  return tokens.length <= 3 && tokens.every((t) =>
    ["hello", "hi", "hey", "salam", "jarvis", "ok", "thanks"].includes(t),
  );
}

function isSimpleYesNo(normalized: string): boolean {
  return YES_NO_PATTERN.test(normalized);
}

function isRealWorldInfoQuestion(normalized: string): boolean {
  return REAL_WORLD_PATTERN.test(normalized);
}

function isActionRequest(normalized: string, tokens: readonly string[]): boolean {
  if (ACTION_PATTERN.test(normalized)) {
    return true;
  }
  return (
    tokens.includes("batao") &&
    tokens.length >= 5 &&
    !EXPLAIN_PATTERN.test(normalized)
  );
}

/**
 * Route Hermes between Groq fast chat and Python skills subprocess.
 */
export function getHermesExecutionMode(query: string): HermesExecutionMode {
  const normalized = normalizeQuery(query);
  if (!normalized) {
    return "fast";
  }

  const tokens = tokenize(query);

  if (
    MEMORY_STORE_PATTERN.test(normalized) ||
    VISION_PATTERN.test(normalized) ||
    FILE_PATTERN.test(normalized) ||
    WINDOWS_AUTOMATION_PATTERN.test(normalized) ||
    DEVELOPMENT_PATTERN.test(normalized) ||
    hasSearchSkillSignal(normalized, tokens)
  ) {
    return "skills";
  }

  if (
    MEMORY_RECALL_PATTERN.test(normalized) &&
    !hasSearchSkillSignal(normalized, tokens) &&
    !isActionRequest(normalized, tokens)
  ) {
    // Recall from chat history — Groq fast path (Python subprocess is slow + rate-limited).
    return "fast";
  }

  if (tokens.length > 10) {
    return "skills";
  }

  if (isRealWorldInfoQuestion(normalized)) {
    return "skills";
  }

  if (isActionRequest(normalized, tokens)) {
    return "skills";
  }

  if (tokens.length < 5 && !hasSearchSkillSignal(normalized, tokens)) {
    if (isPureGreeting(normalized, tokens) || isSimpleYesNo(normalized)) {
      return "fast";
    }
    if (EXPLAIN_PATTERN.test(normalized) && tokens.length <= 8) {
      return "fast";
    }
  }

  if (tokens.length <= 6 && !isRealWorldInfoQuestion(normalized)) {
    return "fast";
  }

  if (
    tokens.length <= 15 &&
    !hasSearchSkillSignal(normalized, tokens) &&
    !isActionRequest(normalized, tokens) &&
    !isRealWorldInfoQuestion(normalized)
  ) {
    return "fast";
  }

  return "skills";
}

/** Toolsets flag for `run_agent.py --enabled_toolsets`. */
export function resolveHermesToolsets(
  category: HermesSkillCategory,
): string {
  switch (category) {
    case "search":
    case "general":
      return "safe,research";
    case "memory":
      return "safe,memory";
    case "vision":
      return "safe,vision";
    case "file":
      return "safe,file";
    case "development":
      return "hermes-acp";
    case "automate":
      return "safe,windows_automation,file";
    default:
      return "safe,research";
  }
}

/** True when the user is asking to recall something from chat memory (not save). */
export function isHermesMemoryRecallQuery(query: string): boolean {
  const normalized = normalizeQuery(query);
  if (MEMORY_STORE_PATTERN.test(normalized)) {
    return false;
  }
  const tokens = tokenize(query);
  return (
    MEMORY_RECALL_PATTERN.test(normalized) &&
    !hasSearchSkillSignal(normalized, tokens) &&
    !isActionRequest(normalized, tokens)
  );
}

/** User-facing status while Hermes skills subprocess runs. */
export function resolveHermesUserStatusMessage(
  category: HermesSkillCategory,
  query?: string,
): string {
  if (category === "memory" && query && isHermesMemoryRecallQuery(query)) {
    return "Jarvis is checking what you shared...";
  }
  switch (category) {
    case "search":
      return "Jarvis is searching...";
    case "vision":
      return "Jarvis is analyzing...";
    case "memory":
      return "Jarvis is remembering...";
    case "file":
      return "Jarvis is working on your file...";
    case "development":
      return "Jarvis is executing with Hermes tools...";
    case "automate":
      return "Jarvis is automating your desktop...";
    default:
      return "Jarvis is working on your request...";
  }
}
