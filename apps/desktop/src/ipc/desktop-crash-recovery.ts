let apiRuntimeInitialized = false;
let mainWindowCrashHandlerAttached = false;

/**
 * Prevents duplicate Electron runtime initialization (Phase 94).
 */
export function markApiRuntimeInitialized(): void {
  apiRuntimeInitialized = true;
}

export function isApiRuntimeInitialized(): boolean {
  return apiRuntimeInitialized;
}

export function markMainWindowCrashHandlerAttached(): boolean {
  if (mainWindowCrashHandlerAttached) {
    return false;
  }
  mainWindowCrashHandlerAttached = true;
  return true;
}

export function resetDesktopCrashRecoveryForTests(): void {
  apiRuntimeInitialized = false;
  mainWindowCrashHandlerAttached = false;
}
