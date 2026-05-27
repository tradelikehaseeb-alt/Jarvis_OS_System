import type { SpeechCapability } from "../routing";
import type { SpeechRuntimeProviderId } from "../runtime";
import {
  SUPPORTED_SPEECH_CONTRACT_VERSIONS,
  type SpeechContractVersion,
} from "./speech-contract-version";
import type { SpeechCompatibilityResult } from "./speech-compatibility-result";
import type { SpeechProviderContract } from "./speech-provider-contract";

export interface SpeechCompatibilityRequest {
  readonly providerId: SpeechRuntimeProviderId;
  readonly version: SpeechContractVersion;
  readonly requiredCapabilities?: readonly SpeechCapability[];
}

/**
 * Contract validator interface for speech provider compatibility (Phase 40).
 */
export interface SpeechContractValidator {
  validateProvider(contract: SpeechProviderContract): SpeechCompatibilityResult;
  validateCompatibility(
    request: SpeechCompatibilityRequest,
  ): SpeechCompatibilityResult;
  getSupportedVersions(): readonly SpeechContractVersion[];
}

const DEFAULT_CONTRACTS: Readonly<Record<SpeechRuntimeProviderId, SpeechProviderContract>> =
  {
    "stt-local": {
      providerId: "stt-local",
      version: "1.0",
      capabilities: {
        supported: ["low-latency", "offline", "roman-urdu", "streaming-ready"],
        required: ["low-latency"],
      },
      runtimeRequirements: ["local-runtime"],
      stub: true,
    },
    "stt-cloud": {
      providerId: "stt-cloud",
      version: "1.0",
      capabilities: {
        supported: ["multilingual", "high-quality", "streaming-ready"],
        required: ["high-quality"],
      },
      runtimeRequirements: ["network-runtime"],
      stub: true,
    },
    "tts-local": {
      providerId: "tts-local",
      version: "1.0",
      capabilities: {
        supported: ["low-latency", "offline", "streaming-ready"],
        required: ["low-latency"],
      },
      runtimeRequirements: ["local-runtime"],
      stub: true,
    },
    "tts-cloud": {
      providerId: "tts-cloud",
      version: "1.0",
      capabilities: {
        supported: ["multilingual", "high-quality", "streaming-ready"],
        required: ["high-quality"],
      },
      runtimeRequirements: ["network-runtime"],
      stub: true,
    },
  };

function missingCapabilities(
  supported: readonly SpeechCapability[],
  required: readonly SpeechCapability[],
): readonly SpeechCapability[] {
  const supportedSet = new Set(supported);
  return required.filter((capability) => !supportedSet.has(capability));
}

/**
 * Default deterministic contract validator for stub providers (Phase 40).
 */
export class DefaultSpeechContractValidator implements SpeechContractValidator {
  validateProvider(contract: SpeechProviderContract): SpeechCompatibilityResult {
    const reasons: string[] = [];

    if (!SUPPORTED_SPEECH_CONTRACT_VERSIONS.includes(contract.version)) {
      reasons.push(`Unsupported contract version: ${contract.version}`);
    }

    if (!contract.stub) {
      reasons.push("Only stub providers are supported in this phase");
    }

    if (contract.capabilities.required.length === 0) {
      reasons.push("Provider must declare required capabilities");
    }

    const missingRequired = missingCapabilities(
      contract.capabilities.supported,
      contract.capabilities.required,
    );
    if (missingRequired.length > 0) {
      reasons.push(
        `Required capabilities not supported: ${missingRequired.join(", ")}`,
      );
    }

    if (contract.runtimeRequirements.length === 0) {
      reasons.push("Provider must declare runtime requirements");
    }

    return {
      compatible: reasons.length === 0,
      providerId: contract.providerId,
      version: contract.version,
      stub: contract.stub,
      reasons,
    };
  }

  validateCompatibility(
    request: SpeechCompatibilityRequest,
  ): SpeechCompatibilityResult {
    const contract = DEFAULT_CONTRACTS[request.providerId];
    if (!contract) {
      return {
        compatible: false,
        providerId: request.providerId,
        version: request.version,
        stub: true,
        reasons: [`Unknown provider: ${request.providerId}`],
      };
    }

    const providerResult = this.validateProvider(contract);
    const reasons = [...providerResult.reasons];

    if (contract.version !== request.version) {
      reasons.push(
        `Version mismatch: expected ${contract.version}, received ${request.version}`,
      );
    }

    const required = request.requiredCapabilities ?? [];
    const missing = missingCapabilities(contract.capabilities.supported, required);
    if (missing.length > 0) {
      reasons.push(`Missing requested capabilities: ${missing.join(", ")}`);
    }

    return {
      compatible: reasons.length === 0,
      providerId: request.providerId,
      version: request.version,
      stub: contract.stub,
      reasons,
    };
  }

  getSupportedVersions(): readonly SpeechContractVersion[] {
    return SUPPORTED_SPEECH_CONTRACT_VERSIONS;
  }
}

export function createDefaultSpeechContractValidator(): SpeechContractValidator {
  return new DefaultSpeechContractValidator();
}
