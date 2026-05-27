import type { JarvisApiRequest } from "./jarvis-api-request";
import type { JarvisApiResponse } from "./jarvis-api-response";

export type JarvisApiRouteHandler = (
  request: JarvisApiRequest,
) => Promise<JarvisApiResponse> | JarvisApiResponse;

interface RegisteredRoute {
  readonly method: string;
  readonly pattern: string;
  readonly segments: readonly string[];
  readonly handler: JarvisApiRouteHandler;
}

function matchPath(
  patternSegments: readonly string[],
  pathSegments: readonly string[],
): Record<string, string> | undefined {
  if (patternSegments.length !== pathSegments.length) {
    return undefined;
  }

  const params: Record<string, string> = {};

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternPart = patternSegments[index]!;
    const pathPart = pathSegments[index]!;

    if (patternPart.startsWith(":")) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return undefined;
    }
  }

  return params;
}

function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  return trimmed.endsWith("/") && trimmed.length > 1
    ? trimmed.slice(0, -1)
    : trimmed;
}

/**
 * HTTP route dispatcher for Jarvis API runtime (Phase 53).
 */
export class JarvisApiRouter {
  private readonly routes: RegisteredRoute[] = [];

  register(
    method: string,
    pattern: string,
    handler: JarvisApiRouteHandler,
  ): void {
    const normalizedPattern = normalizePath(pattern);
    this.routes.push({
      method: method.toUpperCase(),
      pattern: normalizedPattern,
      segments: normalizedPattern.split("/").filter(Boolean),
      handler,
    });
  }

  get(pattern: string, handler: JarvisApiRouteHandler): void {
    this.register("GET", pattern, handler);
  }

  post(pattern: string, handler: JarvisApiRouteHandler): void {
    this.register("POST", pattern, handler);
  }

  async dispatch(request: JarvisApiRequest): Promise<JarvisApiResponse> {
    const method = request.method.toUpperCase();
    const path = normalizePath(request.path);
    const pathSegments = path === "/" ? [] : path.split("/").filter(Boolean);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const params = matchPath(route.segments, pathSegments);
      if (params === undefined) {
        continue;
      }

      return route.handler({
        ...request,
        path,
        params,
      });
    }

    return {
      status: 404,
      error: {
        code: "NOT_FOUND",
        message: `No route for ${method} ${path}`,
      },
    };
  }
}
