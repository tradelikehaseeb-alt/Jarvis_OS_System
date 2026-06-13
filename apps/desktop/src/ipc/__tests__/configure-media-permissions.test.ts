import { describe, expect, it, vi } from "vitest";

import { configureElectronMediaPermissions } from "../configure-media-permissions";

describe("configureElectronMediaPermissions", () => {
  it("grants media and denies other permissions", () => {
    let requestHandler:
      | ((
          webContents: unknown,
          permission: string,
          callback: (allowed: boolean) => void,
        ) => void)
      | undefined;
    let checkHandler:
      | ((webContents: unknown, permission: string) => boolean)
      | undefined;

    const mockSession = {
      setPermissionRequestHandler: (
        handler: NonNullable<typeof requestHandler>,
      ) => {
        requestHandler = handler;
      },
      setPermissionCheckHandler: (handler: NonNullable<typeof checkHandler>) => {
        checkHandler = handler;
      },
    };

    configureElectronMediaPermissions(
      mockSession as unknown as import("electron").Session,
    );

    const allow = vi.fn();
    requestHandler?.({}, "media", allow);
    expect(allow).toHaveBeenCalledWith(true);

    const deny = vi.fn();
    requestHandler?.({}, "notifications", deny);
    expect(deny).toHaveBeenCalledWith(false);

    expect(checkHandler?.({}, "media")).toBe(true);
    expect(checkHandler?.({}, "geolocation")).toBe(false);
  });
});
