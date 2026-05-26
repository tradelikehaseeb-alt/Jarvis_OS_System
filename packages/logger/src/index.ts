/**
 * @jarvis/logger — logging contracts (no runtime implementation in Phase 1).
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  readonly service?: string;
  readonly requestId?: string;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
}
