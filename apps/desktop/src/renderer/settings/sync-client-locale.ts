import { DEFAULT_PROVIDER_SETTINGS_USER_ID } from "../providers/provider-settings-types";
import type { RendererClientLocale } from "./resolve-renderer-client-locale";

function getBridge() {
  if (!window.jarvis) {
    throw new Error("Jarvis desktop bridge unavailable");
  }
  return window.jarvis;
}

/** Push renderer locale into main-process provider factory (timezone awareness). */
export async function syncClientLocaleToMain(
  locale: RendererClientLocale,
  userId: string = DEFAULT_PROVIDER_SETTINGS_USER_ID,
): Promise<RendererClientLocale> {
  const resolved = await getBridge().syncClientLocale({
    userId,
    timeZone: locale.timeZone,
    locale: locale.locale,
    cityLabel: locale.cityLabel,
  });
  return {
    timeZone: resolved.timeZone,
    locale: resolved.locale,
    cityLabel: resolved.cityLabel,
  };
}
