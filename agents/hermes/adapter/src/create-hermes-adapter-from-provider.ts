import type { ProviderResolver } from "@jarvis/provider-registry";

import type { HermesAdapter } from "./hermes-adapter";
import { createHermesAdapterStub } from "./hermes-adapter-stub";
import type { HermesConfig } from "./hermes-config";
import type { HermesRequest } from "./hermes-request";
import type { HermesResponse } from "./hermes-response";

export interface ProviderSelectedHermesAdapterOptions {
  /** Inner implementation (stub, planning, or future official). */
  readonly inner?: HermesAdapter;
  /**
   * When true, forces stub mode on the inner adapter (default for {@link HermesAdapterStub}).
   * Set false when wrapping {@link HermesPlanningAdapter}.
   */
  readonly forceStubMode?: boolean;
}

/**
 * {@link HermesAdapter} that applies {@link ProviderResolver} selection (Phase 17).
 *
 * Preserves {@link HermesAdapter} interface — delegates to inner adapter, enriches with provider metadata.
 */
export class ProviderSelectedHermesAdapter implements HermesAdapter {
  readonly adapterId: string;

  private readonly inner: HermesAdapter;
  private readonly forceStubMode: boolean;

  constructor(
    private readonly resolver: ProviderResolver,
    options: ProviderSelectedHermesAdapterOptions = {},
  ) {
    this.inner = options.inner ?? createHermesAdapterStub();
    this.forceStubMode = options.forceStubMode ?? true;
    this.adapterId = resolver.hermesProviderId;
  }

  async invoke(
    request: HermesRequest,
    config?: HermesConfig,
  ): Promise<HermesResponse> {
    const resolution = this.resolver.resolveHermes();
    const response = await this.inner.invoke(request, {
      ...config,
      adapterId: resolution.metadata.providerId,
      ...(this.forceStubMode ? { mode: "stub" as const } : {}),
    });

    return {
      ...response,
      adapterId: resolution.metadata.providerId,
      plan: {
        ...response.plan,
        summary: `${resolution.stubPayload.label}: ${response.plan.summary}`,
        goal: response.plan.goal,
      },
      reasoning: {
        ...response.reasoning,
        summary: `[${resolution.metadata.deployment}] ${response.reasoning.summary}`,
      },
    };
  }
}

/** Create Hermes adapter bound to registry resolver. */
export function createHermesAdapterFromProvider(
  resolver: ProviderResolver,
  options?: ProviderSelectedHermesAdapterOptions,
): HermesAdapter {
  return new ProviderSelectedHermesAdapter(resolver, options);
}
