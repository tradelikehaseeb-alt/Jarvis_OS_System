import { afterEach, describe, expect, it } from "vitest";

import {
  formatCityLabelFromTimeZone,
  resolveClientLocale,
} from "../client-locale";
import {
  ProviderFactory,
  getProviderFactory,
  resetProviderFactoryForTests,
} from "../provider-factory";

describe("client-locale", () => {
  it("formats city labels from IANA timezones", () => {
    expect(formatCityLabelFromTimeZone("Asia/Karachi")).toBe("Karachi");
    expect(formatCityLabelFromTimeZone("America/New_York")).toBe("New York");
  });

  it("resolves locale with overrides", () => {
    const locale = resolveClientLocale({
      timeZone: "Europe/London",
      locale: "en-GB",
      cityLabel: "London",
    });
    expect(locale.timeZone).toBe("Europe/London");
    expect(locale.cityLabel).toBe("London");
  });
});

describe("ProviderFactory", () => {
  afterEach(() => {
    resetProviderFactoryForTests();
    delete process.env.JARVIS_USER_TIMEZONE;
    delete process.env.JARVIS_USER_LOCALE;
    delete process.env.JARVIS_USER_CITY;
  });

  it("injects timezone into process env on boot", () => {
    const factory = new ProviderFactory({
      timeZone: "Asia/Karachi",
      locale: "en-PK",
      cityLabel: "Karachi",
    });
    expect(process.env.JARVIS_USER_TIMEZONE).toBe("Asia/Karachi");
    expect(process.env.JARVIS_USER_LOCALE).toBe("en-PK");
    expect(process.env.JARVIS_USER_CITY).toBe("Karachi");
    expect(factory.getLocale().timeZone).toBe("Asia/Karachi");
  });

  it("reallocates runtime when active provider changes", async () => {
    const factory = new ProviderFactory();
    const first = await factory.configure({
      userId: "desktop-user",
      providerId: "openai",
    });
    const second = await factory.configure({
      userId: "desktop-user",
      providerId: "gemini",
    });

    expect(factory.getActiveProviderId()).toBe("gemini");
    expect(second).not.toBe(first);
    expect(await second.validateConnection("gemini")).toBe(true);
  });

  it("returns a shared singleton via getProviderFactory", () => {
    const a = getProviderFactory();
    const b = getProviderFactory();
    expect(a).toBe(b);
  });
});
