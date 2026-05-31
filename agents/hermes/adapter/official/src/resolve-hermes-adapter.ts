import type { ProviderResolver } from "@jarvis/provider-registry";

import type { HermesAdapter } from "../../src/hermes-adapter";
import { createHermesAdapterStub } from "../../src/hermes-adapter-stub";
import {
  createHermesAdapterFromProvider,
  type ProviderSelectedHermesAdapterOptions,
} from "../../src/create-hermes-adapter-from-provider";

import {
  createHermesPlanningAdapter,
  isHermesPlanningAdapter,
} from "./hermes-planning-adapter";
import {
  createHermesAdapterOfficial,
  isHermesAdapterOfficial,
} from "./hermes-adapter-official";
import {
  createHermesAdapterPython,
  isHermesAdapterPython,
  shouldUseHermesPythonAdapter,
} from "./hermes-adapter-python";
import { readHermesRuntimeEnv, type EnvSource } from "./hermes-runtime-env";

function useOfficialHermesAdapter(env?: EnvSource): boolean {
  const source = env ?? process.env;
  if (source.NODE_ENV === "test" && source.HERMES_INTEGRATION_LIVE !== "true") {
    return false;
  }
  return readHermesRuntimeEnv(source).mode === "official";
}

export type HermesAdapterSelection = "stub" | "planning";

/**
 * Read adapter selection from `HERMES_PLANNING_ADAPTER` (Phase 22).
 *
 * - `planning` — {@link HermesPlanningAdapter}
 * - `stub` or unset — {@link HermesAdapterStub} (default)
 */
export function readHermesAdapterSelection(
  env: EnvSource = process.env,
): HermesAdapterSelection {
  const raw = env.HERMES_PLANNING_ADAPTER?.trim().toLowerCase();
  return raw === "planning" ? "planning" : "stub";
}

export interface ResolveHermesAdapterOptions
  extends ProviderSelectedHermesAdapterOptions {
  readonly env?: EnvSource;
  readonly selection?: HermesAdapterSelection;
}

/**
 * Resolve the inner {@link HermesAdapter} for bootstrap (Phase 22).
 *
 * Does not change orchestrator flow — used when constructing {@link HermesAgent} only.
 */
export function resolveHermesInnerAdapter(
  options: ResolveHermesAdapterOptions = {},
): HermesAdapter {
  if (options.inner) {
    return options.inner;
  }

  const selection =
    options.selection ?? readHermesAdapterSelection(options.env);

  if (selection === "planning") {
    return createHermesPlanningAdapter();
  }

  if (shouldUseHermesPythonAdapter(options.env)) {
    return createHermesAdapterPython({ env: options.env });
  }

  if (useOfficialHermesAdapter(options.env)) {
    return createHermesAdapterOfficial({ env: options.env });
  }

  return createHermesAdapterStub();
}

/**
 * Provider-selected Hermes adapter with optional official planning inner (Phase 22).
 */
export function createResolvedHermesAdapter(
  resolver: ProviderResolver,
  options: ResolveHermesAdapterOptions = {},
): HermesAdapter {
  const { env, selection, inner, forceStubMode, ...providerOptions } = options;
  const resolvedInner = resolveHermesInnerAdapter({ env, selection, inner });
  const runtimeEnv = readHermesRuntimeEnv(env);
  return createHermesAdapterFromProvider(resolver, {
    ...providerOptions,
    inner: resolvedInner,
    forceStubMode:
      forceStubMode ??
      (runtimeEnv.mode !== "official" &&
        !isHermesPlanningAdapter(resolvedInner) &&
        !isHermesAdapterOfficial(resolvedInner) &&
        !isHermesAdapterPython(resolvedInner)),
  });
}
