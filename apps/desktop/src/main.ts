/**
 * Jarvis OS Electron main process (Phase 18).
 * UI → IPC → api-gateway — never OpenClaw directly.
 */
import path from "node:path";

import { app, BrowserWindow } from "electron";

import { loadJarvisEnv } from "./load-env";
import { registerApiHandlers, initializeApiRuntime } from "./ipc/api-handlers";
import {
  isApiRuntimeInitialized,
  markApiRuntimeInitialized,
  markMainWindowCrashHandlerAttached,
} from "./ipc/desktop-crash-recovery";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: "Jarvis OS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  const rendererHtml = path.join(__dirname, "renderer", "index.html");
  void win.loadFile(rendererHtml);

  if (markMainWindowCrashHandlerAttached()) {
    win.webContents.on("render-process-gone", (_event, details) => {
      if (details.reason !== "clean-exit") {
        console.warn("[jarvis] renderer process gone:", details.reason);
      }
    });
  }
}

void app.whenReady().then(async () => {
  const envPath = loadJarvisEnv(path.join(__dirname, "../.."));
  if (envPath) {
    console.info("[jarvis] loaded env:", envPath);
  }
  if (!isApiRuntimeInitialized()) {
    await initializeApiRuntime();
    markApiRuntimeInitialized();
  }
  registerApiHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
