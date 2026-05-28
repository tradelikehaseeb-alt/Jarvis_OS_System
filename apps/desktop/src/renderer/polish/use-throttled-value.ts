import { useEffect, useRef, useState } from "react";

function shallowEqualArray(a: readonly number[], b: readonly number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (Math.abs((a[i] ?? 0) - (b[i] ?? 0)) > 0.02) {
      return false;
    }
  }
  return true;
}

/**
 * Throttles high-frequency updates (waveform/mic levels) to cut rerenders (Phase 92).
 */
export function useThrottledValue<T>(
  value: T,
  intervalMs: number,
  equals: (a: T, b: T) => boolean = Object.is,
): T {
  const [throttled, setThrottled] = useState(value);
  const latestRef = useRef(value);

  useEffect(() => {
    latestRef.current = value;
  }, [value]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setThrottled((current) => {
        const next = latestRef.current;
        return equals(current, next) ? current : next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, equals]);

  return throttled;
}

export function useThrottledMicLevels(levels: readonly number[], intervalMs = 120): readonly number[] {
  return useThrottledValue(levels, intervalMs, shallowEqualArray);
}
