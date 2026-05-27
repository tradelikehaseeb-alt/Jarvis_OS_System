import type { SpeechRuntimeProviderId } from "../runtime";
import type { SpeechContractVersion } from "./speech-contract-version";
import type { SpeechProviderCapabilities } from "./speech-provider-capabilities";

/**
 * Frozen provider contract metadata for compatibility validation (Phase 40).
 */
export interface SpeechProviderContract {
  readonly providerId: SpeechRuntimeProviderId;
  readonly version: SpeechContractVersion;
  readonly capabilities: SpeechProviderCapabilities;
  readonly runtimeRequirements: readonly string[];
  readonly stub: boolean;
}
