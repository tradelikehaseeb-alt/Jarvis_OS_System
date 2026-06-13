import {
  applyClientLocaleToProcessEnv,
  resolveClientLocale,
  type JarvisClientLocale,
} from "./client-locale";
import { createDefaultProviderRuntime } from "./create-default-provider-runtime";
import { InMemoryProviderRegistry } from "./provider-registry";
import { InMemoryProviderRuntime } from "./in-memory-provider-runtime";
import type { ProviderRegistryEntry } from "./provider-registry";
import type { ProviderRuntime } from "./provider-runtime";

/** Supported user-selectable LLM providers from desktop settings. */
export const SUPPORTED_LLM_PROVIDER_IDS = [
  "openai",
  "gemini",
  "groq",
  "openrouter",
  "deepseek",
  "minimax",
  "ollama",
] as const;

export type SupportedLlmProviderId = (typeof SUPPORTED_LLM_PROVIDER_IDS)[number];

export interface ProviderFactorySelection {
  readonly userId: string;
  readonly providerId: string;
  readonly model?: string;
  readonly apiKey?: string;
}

export interface ProviderFactoryState {
  readonly activeProviderId: string | null;
  readonly locale: JarvisClientLocale;
  readonly updatedAt: string;
}

const LLM_PROVIDER_REGISTRY: Readonly<
  Record<SupportedLlmProviderId, Omit<ProviderRegistryEntry, "providerId">>
> = {
  openai: {
    family: "hermes",
    label: "OpenAI",
    stub: false,
    endpoint: "https://api.openai.com/v1",
  },
  gemini: {
    family: "hermes",
    label: "Gemini",
    stub: false,
    endpoint: "https://generativelanguage.googleapis.com/v1beta/openai",
  },
  groq: {
    family: "hermes",
    label: "Groq",
    stub: false,
    endpoint: "https://api.groq.com/openai/v1",
  },
  openrouter: {
    family: "hermes",
    label: "OpenRouter (Claude)",
    stub: false,
    endpoint: "https://openrouter.ai/api/v1",
  },
  deepseek: {
    family: "hermes",
    label: "DeepSeek",
    stub: false,
    endpoint: "https://api.deepseek.com/v1",
  },
  minimax: {
    family: "hermes",
    label: "Minimax",
    stub: false,
    endpoint: "https://api.minimax.io/v1",
  },
  ollama: {
    family: "hermes",
    label: "Ollama (local)",
    stub: false,
    endpoint: "http://127.0.0.1:11434/v1",
  },
};

function isSupportedLlmProviderId(
  providerId: string,
): providerId is SupportedLlmProviderId {
  return (SUPPORTED_LLM_PROVIDER_IDS as readonly string[]).includes(providerId);
}

function buildRegistryForProvider(providerId: string): InMemoryProviderRegistry {
  const registry = new InMemoryProviderRegistry();

  if (isSupportedLlmProviderId(providerId)) {
    const entry = LLM_PROVIDER_REGISTRY[providerId];
    registry.register({
      providerId,
      ...entry,
    });
    return registry;
  }

  registry.register({
    providerId,
    family: "hermes",
    label: providerId,
    stub: true,
    endpoint: `stub://${providerId}`,
  });
  return registry;
}

/**
 * Dynamic provider factory — reallocates the active runtime when the user
 * switches OpenAI / Gemini / Groq (or other LLM) in desktop settings.
 */
export class ProviderFactory {
  private runtime: ProviderRuntime;
  private selection: ProviderFactorySelection | null = null;
  private locale: JarvisClientLocale;
  private updatedAt: string;

  constructor(initialLocale?: Partial<JarvisClientLocale>) {
    this.locale = resolveClientLocale(initialLocale);
    this.updatedAt = new Date().toISOString();
    applyClientLocaleToProcessEnv(this.locale);
    this.runtime = createDefaultProviderRuntime();
  }

  /** Current active provider runtime instance. */
  getRuntime(): ProviderRuntime {
    return this.runtime;
  }

  getLocale(): JarvisClientLocale {
    return this.locale;
  }

  getActiveProviderId(): string | null {
    return this.selection?.providerId ?? null;
  }

  getState(): ProviderFactoryState {
    return {
      activeProviderId: this.getActiveProviderId(),
      locale: this.locale,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Update localized session context from the Electron renderer (timezone/city).
   */
  setClientLocale(locale: Partial<JarvisClientLocale>): JarvisClientLocale {
    this.locale = resolveClientLocale({ ...this.locale, ...locale });
    this.updatedAt = new Date().toISOString();
    applyClientLocaleToProcessEnv(this.locale);
    return this.locale;
  }

  /**
   * Reallocate the active provider runtime for the user's LLM selection.
   */
  async configure(selection: ProviderFactorySelection): Promise<ProviderRuntime> {
    const previousProviderId = this.selection?.providerId ?? null;
    const providerChanged = previousProviderId !== selection.providerId;

    this.selection = selection;
    this.updatedAt = new Date().toISOString();
    applyClientLocaleToProcessEnv(this.locale);

    if (providerChanged) {
      if (previousProviderId) {
        try {
          await this.runtime.disconnect(previousProviderId);
        } catch {
          // Previous provider may not be registered on a fresh runtime.
        }
      }

      const registry = buildRegistryForProvider(selection.providerId);
      this.runtime = new InMemoryProviderRuntime(registry);
    }

    try {
      await this.runtime.connect(selection.providerId);
    } catch {
      // Stub or unknown providers may still execute via orchestrator LLM layer.
    }

    return this.runtime;
  }
}

let sharedFactory: ProviderFactory | undefined;

/** Shared provider factory for desktop IPC + orchestrator wiring. */
export function getProviderFactory(): ProviderFactory {
  if (!sharedFactory) {
    sharedFactory = new ProviderFactory();
  }
  return sharedFactory;
}

/** @internal test hook */
export function resetProviderFactoryForTests(): void {
  sharedFactory = undefined;
}
