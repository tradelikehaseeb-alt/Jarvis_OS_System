import type { ProviderRuntime } from "./provider-runtime";

export interface ProviderConnectionValidation {
  readonly valid: boolean;
  readonly message?: string;
}

/**
 * Validates provider connection via provider-runtime (Phase 60).
 */
export async function validateProviderConnection(
  providerRuntime: ProviderRuntime,
  providerId: string,
): Promise<ProviderConnectionValidation> {
  try {
    const valid = await providerRuntime.validateConnection(providerId);
    return {
      valid,
      message: valid ? undefined : `Provider connection unavailable: ${providerId}`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Provider connection validation failed";
    return { valid: false, message };
  }
}
