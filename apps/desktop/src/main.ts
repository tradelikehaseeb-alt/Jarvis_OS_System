/**

 * Jarvis OS Electron main process (Phase 18).

 * UI → IPC → api-gateway — never OpenClaw directly.

 */

import "./desktop-env-bootstrap";

import { desktopLoadedEnvPath, desktopMonorepoRoot } from "./desktop-env-bootstrap";



import path from "node:path";



import { app, BrowserWindow, session } from "electron";



import { registerApiHandlers, initializeApiRuntime } from "./ipc/api-handlers";
import { configureElectronMediaPermissions } from "./ipc/configure-media-permissions";
import { registerSpeechHandlers } from "./ipc/speech-handlers";

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

  if (desktopLoadedEnvPath) {

    console.info("[jarvis] loaded env:", desktopLoadedEnvPath);

  } else {

    console.warn("[jarvis] no .env found; checked root:", desktopMonorepoRoot);

  }

  console.info("[jarvis] HERMES_MODE:", process.env.HERMES_MODE ?? "(unset)");

  console.info(

    "[jarvis] HERMES_AGENT_PATH:",

    process.env.HERMES_AGENT_PATH ?? "(unset)",

  );

  console.info(

    "[jarvis] JARVIS_MEMORY_BACKEND:",

    process.env.JARVIS_MEMORY_BACKEND ?? "(unset)",

  );

  const { getHermesStartupStatus } = await import("./ipc/hermes-startup-status");

  const hermesStatus = getHermesStartupStatus();

  console.info("[jarvis]", hermesStatus.label, "—", hermesStatus.detail);

  if (!isApiRuntimeInitialized()) {

    await initializeApiRuntime();

    markApiRuntimeInitialized();

  }

  registerApiHandlers();
  registerSpeechHandlers();

  configureElectronMediaPermissions(session.defaultSession);

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


