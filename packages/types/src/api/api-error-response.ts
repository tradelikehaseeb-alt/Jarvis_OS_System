/**
 * Standard API gateway error envelope (4xx / 5xx).
 */
export interface ApiErrorBody {
  readonly code: string;
  readonly message: string;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface ApiErrorResponse {
  readonly error: ApiErrorBody;
  /** Server-generated request id for support and logs. */
  readonly requestId?: string;
}
