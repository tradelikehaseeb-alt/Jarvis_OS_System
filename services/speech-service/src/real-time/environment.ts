declare const __JARVIS_RENDERER__: boolean | undefined;

/** True when bundled for Electron renderer or other browser contexts. */
export function isBrowserLikeEnvironment(): boolean {
  return typeof (globalThis as { window?: unknown }).window !== "undefined";
}

/** Set by desktop Vite (`__JARVIS_RENDERER__`) so Node speech adapters are tree-shaken. */
export function isJarvisRendererBuild(): boolean {
  return (
    typeof __JARVIS_RENDERER__ !== "undefined" && __JARVIS_RENDERER__ === true
  );
}
