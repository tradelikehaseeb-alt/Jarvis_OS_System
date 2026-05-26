/**
 * @jarvis/config — configuration shape definitions (no env loading in Phase 1).
 */

/** Public web configuration (from NEXT_PUBLIC_*). */
export interface JarvisWebConfig {
  readonly appName: string;
  readonly apiUrl: string;
}

/** API gateway base configuration. */
export interface JarvisApiGatewayConfig {
  readonly host: string;
  readonly port: number;
  readonly corsOrigins: readonly string[];
}
