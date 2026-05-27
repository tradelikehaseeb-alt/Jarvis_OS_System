/**
 * Safe HTTP reachability probe for runtime discovery (Phase 21).
 *
 * Uses HEAD (or GET on 405) with a short timeout. No request bodies, auth, or side effects.
 */

export interface EndpointProbeOptions {
  readonly timeoutMs?: number;
  /** When false, returns `skipped` without network I/O (tests / invalid URLs). */
  readonly allowNetwork?: boolean;
}

export interface EndpointProbeResult {
  readonly reachable: boolean;
  readonly statusCode?: number;
  readonly error?: string;
  readonly probe: "head" | "get" | "skipped";
}

export type EndpointProbeFn = (
  endpoint: string,
  options?: EndpointProbeOptions,
) => Promise<EndpointProbeResult>;

const DEFAULT_TIMEOUT_MS = 3_000;

/** Normalize user endpoint to an origin URL for probing. */
export function normalizeHttpEndpoint(raw: string): string | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed)
      ? trimmed
      : `http://${trimmed}`;
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return undefined;
    }
    return url.origin;
  } catch {
    return undefined;
  }
}

/**
 * Probe endpoint reachability via HEAD, falling back to GET when HEAD is unsupported.
 */
export async function safeEndpointProbe(
  endpoint: string,
  options: EndpointProbeOptions = {},
): Promise<EndpointProbeResult> {
  const origin = normalizeHttpEndpoint(endpoint);
  if (!origin) {
    return {
      reachable: false,
      error: "invalid_endpoint",
      probe: "skipped",
    };
  }

  if (options.allowNetwork === false) {
    return { reachable: false, probe: "skipped", error: "network_disabled" };
  }

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const head = await fetch(origin, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
    });
    if (head.ok) {
      return { reachable: true, statusCode: head.status, probe: "head" };
    }
    if (head.status !== 405 && head.status !== 501) {
      return {
        reachable: false,
        statusCode: head.status,
        probe: "head",
        error: `http_${head.status}`,
      };
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.name : "probe_failed";
    return { reachable: false, probe: "head", error: message };
  } finally {
    clearTimeout(timer);
  }

  const getController = new AbortController();
  const getTimer = setTimeout(() => getController.abort(), timeoutMs);
  try {
    const get = await fetch(origin, {
      method: "GET",
      signal: getController.signal,
      redirect: "follow",
    });
    const reachable = get.ok || get.status < 500;
    return {
      reachable,
      statusCode: get.status,
      probe: "get",
      ...(reachable ? {} : { error: `http_${get.status}` }),
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.name : "probe_failed";
    return { reachable: false, probe: "get", error: message };
  } finally {
    clearTimeout(getTimer);
  }
}
