/**
 * Normalized HTTP request for {@link JarvisApiRouter} (Phase 53).
 */
export interface JarvisApiRequest {
  readonly method: string;
  readonly path: string;
  readonly params: Readonly<Record<string, string>>;
  readonly query: Readonly<Record<string, string>>;
  readonly body: unknown;
  readonly headers: Readonly<Record<string, string>>;
}
