import { describe, expect, it } from "vitest";

import { GROQ_PROVIDER_ID } from "@jarvis/orchestrator";

import {
  getProviderSettingsSnapshot,
  saveProviderApiKeyForUser,
  selectProviderForUser,
  syncClientLocaleForUser,
  __resetProviderSettingsRuntimeForTest,
} from "../../../ipc/provider-settings-lifecycle";
import { resetProviderFactoryForTests } from "@jarvis/provider-runtime";

describe("provider settings desktop integration", () => {
  it("IPC lifecycle returns statuses without exposing keys", async () => {
    __resetProviderSettingsRuntimeForTest();
    resetProviderFactoryForTests();

    await saveProviderApiKeyForUser({
      userId: "desktop-user",
      providerId: GROQ_PROVIDER_ID,
      apiKey: "gsk-test-key-12345678",
    });
    await selectProviderForUser({
      userId: "desktop-user",
      providerId: GROQ_PROVIDER_ID,
    });

    const snapshot = await getProviderSettingsSnapshot("desktop-user");
    const groq = snapshot.providers.find(
      (entry) => entry.providerId === GROQ_PROVIDER_ID,
    );

    expect(groq?.active).toBe(true);
    expect(groq?.configured).toBe(true);
    expect(JSON.stringify(snapshot)).not.toContain("gsk-test-key");
  });

  it("save and select provider through lifecycle helpers", async () => {
    __resetProviderSettingsRuntimeForTest();
    resetProviderFactoryForTests();

    const validation = await saveProviderApiKeyForUser({
      userId: "desktop-user",
      providerId: GROQ_PROVIDER_ID,
      apiKey: "gsk-test-key-12345678",
    });

    expect(validation.valid).toBe(true);

    const settings = await selectProviderForUser({
      userId: "desktop-user",
      providerId: GROQ_PROVIDER_ID,
    });

    expect(settings.selectedProviderId).toBe(GROQ_PROVIDER_ID);
  });

  it("syncs client locale into process env for timezone awareness", async () => {
    __resetProviderSettingsRuntimeForTest();
    resetProviderFactoryForTests();
    delete process.env.JARVIS_USER_TIMEZONE;

    const locale = await syncClientLocaleForUser("desktop-user", {
      timeZone: "Asia/Karachi",
      locale: "en-PK",
      cityLabel: "Karachi",
    });

    expect(locale.timeZone).toBe("Asia/Karachi");
    expect(process.env.JARVIS_USER_TIMEZONE).toBe("Asia/Karachi");
    expect(process.env.JARVIS_USER_CITY).toBe("Karachi");
  });
});
