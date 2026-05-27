export type { JarvisApiRequest } from "./jarvis-api-request";
export type {
  JarvisApiResponse,
  JarvisApiErrorBody,
} from "./jarvis-api-response";
export type { ApiHealth } from "./api-health";
export {
  JarvisApiRouter,
  type JarvisApiRouteHandler,
} from "./jarvis-api-router";
export { JarvisApiServer } from "./jarvis-api-server";
export {
  createDefaultJarvisApiServer,
  registerDefaultRoutes,
  buildHealth,
  type CreateDefaultJarvisApiServerOptions,
} from "./create-default-jarvis-api-server";
export { validateCreateTaskRequest } from "./validate-create-task-request";

/** Module identifiers for structure tests. */
export const API_RUNTIME_MODULE_IDS = [
  "jarvis-api-request",
  "jarvis-api-response",
  "api-health",
  "jarvis-api-router",
  "jarvis-api-server",
  "create-default-jarvis-api-server",
] as const;

export type ApiRuntimeModuleId = (typeof API_RUNTIME_MODULE_IDS)[number];
