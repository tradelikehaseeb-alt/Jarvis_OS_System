import { describe, expect, it } from "vitest";

import { REAL_PROVIDER_VALIDATION_COMMANDS } from "@jarvis/types";

import {
  createTestProviderHealthValidationRuntime,
  createTestRealProviderValidationRuntime,
  DEFAULT_CONNECTOR_CONFIGURATIONS,
} from "../../index";
import { DEFAULT_API_USER_ID } from "../../../task-execution";

describe("provider health integration", () => {
  it("registers all seven external providers with health metadata", async () => {
    const runtime = createTestProviderHealthValidationRuntime();
    const health = await runtime.validateAllProviders(DEFAULT_API_USER_ID);

    expect(health).toHaveLength(7);

    for (const entry of health) {
      expect(entry.providerId.length).toBeGreaterThan(0);
      expect(entry.label.length).toBeGreaterThan(0);
      expect(entry.configuredModels.length).toBeGreaterThan(0);
      expect(entry.failureHandled).toBe(true);
      expect(entry.checkedAt.length).toBeGreaterThan(0);
    }

    const configuredIds = DEFAULT_CONNECTOR_CONFIGURATIONS.map(
      (configuration) => configuration.providerId,
    );

    expect(health.map((entry) => entry.providerId).sort()).toEqual(
      configuredIds.sort(),
    );
  });
});

describe("real provider validation integration", () => {
  it("executes Phase 85 commands through live execution flow", async () => {
    const runtime = await createTestRealProviderValidationRuntime();
    const report = await runtime.executeRealProviderValidation({
      userId: DEFAULT_API_USER_ID,
    });

    expect(report.allProvidersRegistered).toBe(true);
    expect(report.providerCount).toBe(7);
    expect(report.commandValidations).toHaveLength(
      REAL_PROVIDER_VALIDATION_COMMANDS.length,
    );

    for (const validation of report.commandValidations) {
      expect(validation.success).toBe(true);
      expect(validation.providerResponseReceived).toBe(true);
      expect(validation.hermesPlanCreated).toBe(true);
      expect(validation.openClawTriggered).toBe(true);
      expect(validation.timelineUpdated).toBe(true);
      expect(validation.workspaceUpdated).toBe(true);
      expect(validation.telemetryCaptured).toBe(true);
    }
  });

  it.each(REAL_PROVIDER_VALIDATION_COMMANDS)(
    "validates real provider command: %s",
    async (command) => {
      const runtime = await createTestRealProviderValidationRuntime();
      const report = await runtime.executeRealProviderValidation({
        userId: DEFAULT_API_USER_ID,
        commands: [command],
      });

      const validation = report.commandValidations[0];
      expect(validation?.command).toBe(command);
      expect(validation?.success).toBe(true);
      expect(validation?.hermesPlanCreated).toBe(true);
      expect(validation?.openClawTriggered).toBe(true);
    },
  );
});
