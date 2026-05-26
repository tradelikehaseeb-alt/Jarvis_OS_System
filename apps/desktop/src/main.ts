/**
 * Jarvis OS Electron main process — Phase 0 scaffold.
 * No business logic. No OpenClaw. Renderer loads in Phase 1.
 */
import { app, BrowserWindow } from "electron";

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      // Phase 1: configure preload, contextIsolation, sandbox
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Phase 0: about:blank — Phase 1: ELECTRON_RENDERER_URL or local web build
  void win.loadURL("about:blank");
}

void app.whenReady().then(() => {
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
