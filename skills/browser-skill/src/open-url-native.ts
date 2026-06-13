import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface NativeOpenUrlResult {
  readonly success: boolean;
  readonly message: string;
}

/**
 * Builds a platform-specific shell command that opens a URL in the default browser.
 */
export function buildNativeOpenCommand(url: string, platform: NodeJS.Platform = process.platform): string {
  const escaped = url.replace(/"/g, '\\"');

  switch (platform) {
    case "win32":
      return `start "" "${escaped}"`;
    case "darwin":
      return `open "${escaped}"`;
    default:
      return `xdg-open "${escaped}"`;
  }
}

/**
 * Opens a URL via the OS default browser (Playwright fallback).
 */
export async function openUrlWithSystemBrowser(
  url: string,
  platform: NodeJS.Platform = process.platform,
): Promise<NativeOpenUrlResult> {
  try {
    const command = buildNativeOpenCommand(url, platform);
    await execAsync(command);
    return {
      success: true,
      message: `Opened ${url} in the system browser`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: `Failed to open ${url}: ${detail}`,
    };
  }
}
