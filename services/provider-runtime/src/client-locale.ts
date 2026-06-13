/** Localized client session context resolved at runtime boot. */
export interface JarvisClientLocale {
  readonly timeZone: string;
  readonly locale: string;
  /** Human-readable city/region label derived from the IANA timezone. */
  readonly cityLabel: string;
}

/**
 * Resolve the user's timezone and locale from the host environment.
 * Uses `Intl.DateTimeFormat().resolvedOptions().timeZone` in Electron renderer/main.
 */
export function resolveClientLocale(
  overrides: Partial<JarvisClientLocale> = {},
): JarvisClientLocale {
  const intl = Intl.DateTimeFormat().resolvedOptions();
  const timeZone = overrides.timeZone?.trim() || intl.timeZone?.trim() || "UTC";
  const locale = overrides.locale?.trim() || intl.locale?.trim() || "en-US";
  const cityLabel =
    overrides.cityLabel?.trim() || formatCityLabelFromTimeZone(timeZone);
  return { timeZone, locale, cityLabel };
}

/** Map `Asia/Karachi` → `Karachi`, `America/New_York` → `New York`. */
export function formatCityLabelFromTimeZone(timeZone: string): string {
  const segment = timeZone.split("/").pop()?.replace(/_/g, " ").trim();
  return segment && segment.length > 0 ? segment : timeZone;
}

/** Inject localized session context into process env for Hermes/orchestrator layers. */
export function applyClientLocaleToProcessEnv(
  locale: JarvisClientLocale,
  env: NodeJS.ProcessEnv = process.env,
): void {
  env.JARVIS_USER_TIMEZONE = locale.timeZone;
  env.JARVIS_USER_LOCALE = locale.locale;
  env.JARVIS_USER_CITY = locale.cityLabel;
}
