/**
 * @jarvis/types — shared types and Jarvis Core contracts.
 */

export const JARVIS_SCAFFOLD_VERSION = "0.5.0-phase5" as const;

export type { HealthStatus } from "./health";
export * from "./contracts";
export * from "./api";
export * from "./memory";
export * from "./live-execution";
