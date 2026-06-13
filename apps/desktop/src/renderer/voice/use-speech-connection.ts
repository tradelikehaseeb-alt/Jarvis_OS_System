import { useEffect, useState } from "react";

export interface SpeechConnectionStatus {
  readonly ready: boolean;
  readonly sttEngine: string;
  readonly ttsEngine: string;
  readonly ttsVoice: string;
  readonly microphoneLabel: string;
  readonly microphoneGranted: boolean;
  readonly loading: boolean;
  readonly error: string | null;
}

async function readMicrophonePermission(): Promise<boolean> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return false;
  }
  try {
    const permissions = navigator.permissions;
    if (permissions?.query) {
      const status = await permissions.query({ name: "microphone" as PermissionName });
      if (status.state === "granted") {
        return true;
      }
      if (status.state === "denied") {
        return false;
      }
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch {
    return false;
  }
}

/**
 * Desktop speech bridge status for Settings and Voice pages.
 */
export function useSpeechConnection(): SpeechConnectionStatus {
  const [status, setStatus] = useState<SpeechConnectionStatus>({
    ready: false,
    sttEngine: "Checking…",
    ttsEngine: "Checking…",
    ttsVoice: "en-US-GuyNeural",
    microphoneLabel: "Checking…",
    microphoneGranted: false,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const init = await window.jarvis.speechInit();
        const micGranted = await readMicrophonePermission();
        if (!active) {
          return;
        }
        setStatus({
          ready: init.ready,
          sttEngine: init.sttEngine,
          ttsEngine: init.ttsEngine,
          ttsVoice: init.ttsVoice,
          microphoneLabel: micGranted ? "Granted ✅" : "Not accessed",
          microphoneGranted: micGranted,
          loading: false,
          error: init.ready ? null : init.message,
        });
      } catch (error) {
        if (!active) {
          return;
        }
        setStatus((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : "Speech init failed",
        }));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return status;
}
