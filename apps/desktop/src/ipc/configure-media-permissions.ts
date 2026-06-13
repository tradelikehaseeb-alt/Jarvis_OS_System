import type { Session } from "electron";

/**
 * Auto-grant microphone/camera for Jarvis renderer (Electron sandbox).
 * Must run before BrowserWindow creation.
 */
export function configureElectronMediaPermissions(session: Session): void {
  session.setPermissionRequestHandler((_webContents, permission, callback) => {
    if (permission === "media") {
      callback(true);
      return;
    }
    callback(false);
  });

  session.setPermissionCheckHandler((_webContents, permission) => {
    return permission === "media";
  });
}
