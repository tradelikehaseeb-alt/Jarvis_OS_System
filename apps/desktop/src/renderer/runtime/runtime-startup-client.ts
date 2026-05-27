import type { RuntimeStartupResponse } from "./runtime-startup-types";

function getBridge() {
  if (!window.jarvis) {
    throw new Error("Jarvis desktop bridge unavailable");
  }
  return window.jarvis;
}

export async function initializeRuntime(): Promise<RuntimeStartupResponse> {
  return getBridge().initializeRuntime();
}

export async function validateRuntime(): Promise<RuntimeStartupResponse> {
  return getBridge().validateRuntime();
}

export async function recoverRuntime(): Promise<RuntimeStartupResponse> {
  return getBridge().recoverRuntime();
}

export async function getStartupStatus(): Promise<RuntimeStartupResponse> {
  return getBridge().getStartupStatus();
}
