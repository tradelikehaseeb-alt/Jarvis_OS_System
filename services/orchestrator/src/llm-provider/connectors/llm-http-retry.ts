const DEFAULT_RATE_LIMIT_ATTEMPTS = 3;
const DEFAULT_NETWORK_ATTEMPTS = 2;

export interface LlmHttpRetryOptions {
  readonly rateLimitAttempts?: number;
  readonly networkAttempts?: number;
  readonly baseDelayMs?: number;
}

export class LlmHttpError extends Error {
  readonly code: string;
  readonly status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "LlmHttpError";
    this.code = code;
    this.status = status;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffDelay(attempt: number, baseDelayMs: number): number {
  return baseDelayMs * 2 ** Math.max(0, attempt - 1);
}

function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }
  const lower = error.message.toLowerCase();
  return (
    error.name === "AbortError" ||
    lower.includes("fetch failed") ||
    lower.includes("econnrefused") ||
    lower.includes("enotfound") ||
    lower.includes("network")
  );
}

/**
 * Fetch with retries: HTTP 429 (3 attempts, exponential backoff) and network (2 attempts).
 */
export async function fetchWithLlmRetries(
  url: string,
  init: RequestInit,
  options: LlmHttpRetryOptions = {},
): Promise<Response> {
  const rateLimitAttempts = options.rateLimitAttempts ?? DEFAULT_RATE_LIMIT_ATTEMPTS;
  const networkAttempts = options.networkAttempts ?? DEFAULT_NETWORK_ATTEMPTS;
  const baseDelayMs = options.baseDelayMs ?? 400;

  let networkTry = 0;

  while (networkTry < networkAttempts) {
    networkTry += 1;

    for (let rateTry = 1; rateTry <= rateLimitAttempts; rateTry += 1) {
      try {
        const response = await fetch(url, init);

        if (response.status === 429 && rateTry < rateLimitAttempts) {
          await sleep(backoffDelay(rateTry, baseDelayMs));
          continue;
        }

        return response;
      } catch (error) {
        if (networkTry < networkAttempts && isNetworkError(error)) {
          await sleep(backoffDelay(networkTry, baseDelayMs));
          break;
        }

        const message =
          error instanceof Error ? error.message : "LLM provider network error";
        throw new LlmHttpError("LLM_NETWORK_ERROR", message);
      }
    }
  }

  throw new LlmHttpError(
    "LLM_NETWORK_ERROR",
    "LLM provider request failed after network retries",
  );
}

export function mapLlmHttpResponseError(
  status: number,
  statusText: string,
  label: string,
): LlmHttpError {
  if (status === 429) {
    return new LlmHttpError(
      "LLM_RATE_LIMIT_EXCEEDED",
      `${label} rate limit exceeded (HTTP 429) after retries`,
      status,
    );
  }

  if (status === 413) {
    return new LlmHttpError(
      "LLM_TOKEN_LIMIT_EXCEEDED",
      `${label} token limit exceeded (HTTP 413). Reduce prompt size or switch model.`,
      status,
    );
  }

  return new LlmHttpError(
    "LLM_HTTP_ERROR",
    `${label} request failed (${status} ${statusText})`,
    status,
  );
}
