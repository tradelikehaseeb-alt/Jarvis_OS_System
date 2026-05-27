/**
 * Jarvis OS Electron main process (Phase 18).
 * UI → IPC → api-gateway — never OpenClaw directly.
 */
import path from "node:path";

import { app, BrowserWindow } from "electron";

import { registerApiHandlers, initializeApiRuntime } from "./ipc/api-handlers";

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
}

void app.whenReady().then(async () => {
  await initializeApiRuntime();
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
