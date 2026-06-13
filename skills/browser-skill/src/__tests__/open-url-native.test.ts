import { describe, expect, it } from "vitest";

import { buildNativeOpenCommand } from "../open-url-native";

describe("buildNativeOpenCommand", () => {
  it("uses start on Windows", () => {
    expect(buildNativeOpenCommand("https://www.youtube.com", "win32")).toBe(
      'start "" "https://www.youtube.com"',
    );
  });

  it("uses open on macOS", () => {
    expect(buildNativeOpenCommand("https://mail.google.com", "darwin")).toBe(
      'open "https://mail.google.com"',
    );
  });

  it("uses xdg-open on Linux", () => {
    expect(buildNativeOpenCommand("https://github.com", "linux")).toBe(
      'xdg-open "https://github.com"',
    );
  });
});
