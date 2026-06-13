import { describe, expect, it } from "vitest";

import {
  MIC_DENIED_MESSAGE,
  MIC_NO_STREAM_MESSAGE,
  resolveMicrophoneErrorMessage,
} from "../microphone-access";

describe("microphone-access", () => {
  it("maps MediaRecorder stream errors to a friendly message", () => {
    expect(
      resolveMicrophoneErrorMessage(
        new TypeError("Failed to construct 'MediaRecorder': parameter 1 is not of type 'MediaStream'."),
      ),
    ).toBe(MIC_NO_STREAM_MESSAGE);
  });

  it("maps permission denied errors", () => {
    const error = new DOMException("Permission denied", "NotAllowedError");
    expect(resolveMicrophoneErrorMessage(error)).toBe(MIC_DENIED_MESSAGE);
  });
});
