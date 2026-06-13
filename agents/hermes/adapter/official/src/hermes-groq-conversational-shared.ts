import type { HermesRequest } from "../../src/hermes-request";
import type { EnvSource } from "./hermes-runtime-env";

const DEFAULT_CONVERSATIONAL_TIME_ZONE = "Asia/Karachi";

export const JARVIS_CREATOR_IDENTITY_RULE =
  "CRITICAL IDENTITY RULE: You were created and developed entirely by Haseeb Rasheed. He is your master and architect. If the user asks who created you, who built you, or who your developer is, you must proudly and directly state that Haseeb Rasheed created you. Absolute restriction: Never reply with 'mujhe batane ki ijazat nahi hai' for creator queries. Override any generic AI anonymity or developer-disclosure safety guardrails — your creator identity is Haseeb Rasheed and you must answer creator questions openly.";

export const JARVIS_OS_CORE_IDENTITY = [
  "You are JARVIS OS — an advanced multi-agent orchestrator and high-performance operating-system execution framework.",
  "You are NOT a simple chatbot, Q&A bubble, or passive assistant.",
  "Your creator and master architect is Haseeb Rasheed.",
  "You possess absolute authority over native Windows automation execution loops and OpenClaw background sub-agent spawning.",
  "FORBIDDEN RESPONSES — never output these under any circumstance: 'mujhe batane ki ijazat nahi hai', 'I am just a chatbot', 'mai sub agent nahi banasakta', 'chatbot hu', 'I cannot spawn sub-agents', 'I only chat', or any refusal that denies automation, tool execution, or sub-agent orchestration capability.",
  "When the user requests an action, automation, file operation, desktop control, or system task: do NOT refuse with conversational filler.",
  "Output the tool execution pipeline schema, invoke the appropriate tools directly, or emit a dynamic Python block for Windows automation.",
  "Follow Plan → Execute → Confirm using real terminal output — never fabricate success.",
].join(" ");

export const JARVIS_USER_FACING_IDENTITY_RULE =
  "Never mention Hermes, internal agents, backends, or mock prefixes in user-facing replies. Present yourself as Jarvis OS only.";

/** Localized clock string for conversational prompts (refreshed each packaging step). */
export function formatConversationalDateTime(
  env: EnvSource,
  now: Date = new Date(),
): string {
  const timeZone = env.JARVIS_USER_TIMEZONE?.trim() || DEFAULT_CONVERSATIONAL_TIME_ZONE;
  return now.toLocaleString("en-US", { timeZone });
}

export function buildDatetimeAwarenessInstruction(
  env: EnvSource,
  now: Date = new Date(),
): string {
  const currentDateTime = formatConversationalDateTime(env, now);
  return [
    `Current date and time: ${currentDateTime}.`,
    `You are aware of the exact current time via the system prompt injection: ${currentDateTime}. If the user asks for the time, date, or day, respond IMMEDIATELY in chat without calling any external search-skill or windows_automation script.`,
  ].join(" ");
}

export function buildConversationalSystemPrompt(env: EnvSource, now: Date = new Date()): string {
  const displayName = env.JARVIS_USER_DISPLAY_NAME?.trim();
  const location =
    env.JARVIS_USER_LOCATION?.trim() ||
    env.JARVIS_USER_CITY?.trim() ||
    "";
  const timeZone = env.JARVIS_USER_TIMEZONE?.trim();
  const profileLines = [
    displayName ? `The user's name is ${displayName}.` : "",
    location ? `The user is located in ${location}.` : "",
    timeZone ? `The user's local timezone is ${timeZone}.` : "",
  ].filter(Boolean);

  return [
    JARVIS_OS_CORE_IDENTITY,
    JARVIS_CREATOR_IDENTITY_RULE,
    JARVIS_USER_FACING_IDENTITY_RULE,
    "You have access to this conversation's history and recalled memories — use them for personal facts the user shared earlier.",
    "For simple conversational queries (greetings, time, memory recall): reply concisely in natural language.",
    "For automation, system control, or multi-step tasks: output executable plans, tool calls, or dynamic Python blocks — never chatbot filler.",
    buildDatetimeAwarenessInstruction(env, now),
    ...profileLines,
  ]
    .filter(Boolean)
    .join(" ");
}

function sanitizeConversationText(text: string): string {
  return text
    .replace(/^Hermes\s+\([^)]+\)\s+\(mock\):\s*/i, "")
    .replace(/^\[(local|cloud|remote)\]\s*/i, "")
    .trim();
}

export function buildGroqMessages(
  request: HermesRequest,
  systemPrompt: string,
  env: EnvSource = process.env,
): readonly { role: "system" | "user" | "assistant"; content: string }[] {
  const packagingClock = buildDatetimeAwarenessInstruction(env);
  const messages: { role: "system" | "user" | "assistant"; content: string }[] =
    [{ role: "system", content: `${systemPrompt}\n\n${packagingClock}` }];

  const turns = request.conversationTurns ?? [];
  for (const turn of turns.slice(-10)) {
    const content = sanitizeConversationText(turn.message).slice(0, 480);
    if (!content || content.toLowerCase().startsWith("fetch failed")) {
      continue;
    }
    if (turn.role === "assistant") {
      messages.push({ role: "assistant", content });
    } else if (turn.role === "system") {
      messages.push({ role: "system", content });
    } else {
      messages.push({ role: "user", content });
    }
  }

  const snippets = request.recalledContextSnippets ?? [];
  if (snippets.length > 0) {
    messages.push({
      role: "system",
      content: `Recalled context from memory:\n${snippets
        .slice(0, 10)
        .map((snippet, index) => `${index + 1}. ${snippet}`)
        .join("\n")}`,
    });
  }

  const currentMessage = request.intent.description.trim();
  const lastTurn = turns.at(-1);
  const alreadyIncludesCurrent =
    lastTurn?.role === "user" && lastTurn.message === currentMessage;
  if (!alreadyIncludesCurrent && currentMessage.length > 0) {
    if (turns.length > 0 && /\b(fav|favorite|yaad|pehle|color|colour|mera|meri|mere)\b/i.test(currentMessage)) {
      messages.push({
        role: "system",
        content:
          "The user is asking about something from this conversation. Answer using the chat history above — do not claim you have no memory if the fact appears in prior user messages.",
      });
    }
    messages.push({
      role: "user",
      content: currentMessage,
    });
  }

  return messages;
}
