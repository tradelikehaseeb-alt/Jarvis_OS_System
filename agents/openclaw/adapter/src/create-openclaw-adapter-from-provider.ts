import type { ProviderResolver } from "@jarvis/provider-registry";

import type { OpenClawAdapter } from "./openclaw-adapter";
import { createOpenClawAdapterStub } from "./openclaw-adapter-stub";
import type { OpenClawConfig } from "./openclaw-config";
import type { OpenClawRequest } from "./openclaw-request";
import type { OpenClawResponse } from "./openclaw-response";

/**
 * {@link OpenClawAdapter} with {@link ProviderResolver} selection (Phase 17).
 */
export class ProviderSelectedOpenClawAdapter implements OpenClawAdapter {
  readonly adapterId: string;

  constructor(
    private readonly resolver: ProviderResolver,
    private readonly inner: OpenClawAdapter = createOpenClawAdapterStub(),
  ) {
    this.adapterId = resolver.openclawProviderId;
  }

  async invoke(
    request: OpenClawRequest,
    config?: OpenClawConfig,
  ): Promise<OpenClawResponse> {
    const resolution = this.resolver.resolveOpenClaw();
    const response = await this.inner.invoke(request, {
      ...config,
      adapterId: resolution.metadata.providerId,
      mode: "stub",
      sandboxRequired: true,
    });

    return {
      ...response,
      adapterId: resolution.metadata.providerId,
      execution: {
        ...response.execution,
        handleId: `handle-${resolution.metadata.providerId}-${request.taskId}`,
      },
      approvedActions: response.approvedActions.map(
        (action) => `${action}:${resolution.metadata.deployment}`,
      ),
    };
  }
}

/** Create OpenClaw adapter bound to registry resolver (mock providers only). */
export function createOpenClawAdapterFromProvider(
  resolver: ProviderResolver,
): OpenClawAdapter {
  return new ProviderSelectedOpenClawAdapter(resolver);
}
