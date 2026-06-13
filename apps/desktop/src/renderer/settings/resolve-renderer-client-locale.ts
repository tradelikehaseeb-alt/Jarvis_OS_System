/** Localized session context resolved in the Electron renderer. */
export interface RendererClientLocale {
  readonly timeZone: string;
  readonly locale: string;
  readonly cityLabel: string;
}

/**
 * Resolve timezone and locale from the user's OS session via Intl APIs.
 */
export function resolveRendererClientLocale(): RendererClientLocale {
  const intl = Intl.DateTimeFormat().resolvedOptions();
  const timeZone = intl.timeZone?.trim() || "UTC";
  const locale = intl.locale?.trim() || "en-US";
  const cityLabel = formatCityFromTimeZone(timeZone);
  return { timeZone, locale, cityLabel };
}

function formatCityFromTimeZone(timeZone: string): string {
  const segment = timeZone.split("/").pop()?.replace(/_/g, " ").trim();
  return segment && segment.length > 0 ? segment : timeZone;
}
