import { useEffect, useRef, useState } from "react";

import { stabilizePartialTranscript } from "./transcript-stabilizer";

/**
 * Debounced partial transcript for smoother voice overlay (Phase 92).
 */
export function useStablePartialTranscript(
  raw: string,
  debounceMs = 120,
): string {
  const [stable, setStable] = useState("");
  const previousRef = useRef("");

  useEffect(() => {
    if (!raw.trim()) {
      previousRef.current = "";
      setStable("");
      return;
    }

    const timer = window.setTimeout(() => {
      const next = stabilizePartialTranscript(previousRef.current, raw);
      previousRef.current = next;
      setStable(next);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [raw, debounceMs]);

  return stable || raw;
}
