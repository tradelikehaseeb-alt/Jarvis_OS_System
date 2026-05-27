/**
 * HTTP response envelope for {@link JarvisApiRouter} (Phase 53).
 */
export interface JarvisApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface JarvisApiResponse<T = unknown> {
  readonly status: number;
  readonly body?: T;
  readonly error?: JarvisApiErrorBody;
}
