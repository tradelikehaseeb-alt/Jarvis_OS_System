import { describe, expect, it } from "vitest";

import { resolveRendererClientLocale } from "../resolve-renderer-client-locale";

describe("resolveRendererClientLocale", () => {
  it("returns timezone and city from Intl resolved options", () => {
    const locale = resolveRendererClientLocale();
    expect(locale.timeZone.length).toBeGreaterThan(0);
    expect(locale.locale.length).toBeGreaterThan(0);
    expect(locale.cityLabel.length).toBeGreaterThan(0);
  });
});
