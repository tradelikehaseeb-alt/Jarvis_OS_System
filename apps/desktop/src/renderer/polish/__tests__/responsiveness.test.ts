import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";

import { useThrottledMicLevels } from "../use-throttled-value";

describe("useThrottledMicLevels", () => {
  it("throttles rapid mic level updates", async () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ levels }) => useThrottledMicLevels(levels, 100),
      { initialProps: { levels: [0.1, 0.2] as readonly number[] } },
    );

    rerender({ levels: [0.9, 0.95] });
    expect(result.current).toEqual([0.1, 0.2]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current).toEqual([0.9, 0.95]);
    vi.useRealTimers();
  });
});
