import type { ProviderResolver } from "@jarvis/provider-registry";

import { readOpenClawRuntimeEnv } from "../official/src/openclaw-runtime-env";
import { createOpenClawAdapterOfficial } from "../official/src/openclaw-adapter-official";
import type { OpenClawAdapter } from "./openclaw-adapter";
import { createOpenClawAdapterStub } from "./openclaw-adapter-stub";
import type { OpenClawConfig } from "./openclaw-config";
import type { OpenClawRequest } from "./openclaw-request";
import type { OpenClawResponse } from "./openclaw-response";

function resolveOpenClawConfig(
  adapterId: string,
  config?: OpenClawConfig,
): OpenClawConfig {
  const runtimeEnv = readOpenClawRuntimeEnv();
  const mode =
    config?.mode ??
    (runtimeEnv.mode === "official" || runtimeEnv.mode === "remote"
      ? "official"
      : runtimeEnv.mode === "local"
        ? "stub"
        : "stub");

  return {
    adapterId,
    mode,
    gatewayEndpoint: config?.gatewayEndpoint ?? runtimeEnv.endpoint,
    sandboxRequired: config?.sandboxRequired ?? true,
  };
}

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
    const adapterConfig = resolveOpenClawConfig(
      resolution.metadata.providerId,
      config,
    );
    const response = await this.inner.invoke(request, adapterConfig);

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

function useOfficialOpenClawAdapter(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  if (env.NODE_ENV === "test" && env.OPENCLAW_INTEGRATION_LIVE !== "true") {
    return false;
  }
  const runtimeEnv = readOpenClawRuntimeEnv(env);
  return runtimeEnv.mode === "official" || runtimeEnv.mode === "remote";
}

function resolveOpenClawInnerAdapter(): OpenClawAdapter {
  if (useOfficialOpenClawAdapter()) {
    return createOpenClawAdapterOfficial();
  }
  return createOpenClawAdapterStub();
}

/** Create OpenClaw adapter bound to registry resolver. */
export function createOpenClawAdapterFromProvider(
  resolver: ProviderResolver,
  inner: OpenClawAdapter = resolveOpenClawInnerAdapter(),
): OpenClawAdapter {
  return new ProviderSelectedOpenClawAdapter(resolver, inner);
}
