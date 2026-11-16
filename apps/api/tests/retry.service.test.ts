import { afterEach, describe, expect, it, vi } from "vitest";
import { withRetry } from "../src/services/retry.service.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});
describe("withRetry", () => {
  it("succeeds on the third attempt", async () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);

    const fn = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce({ status: 429 })
      .mockRejectedValueOnce({ status: 429 })
      .mockResolvedValue("success");

    const resultPromise = withRetry(fn, {
      maxAttempts: 3,
      baseDelayMs: 100,
      maxDelayMs: 1000,
      deadlineMs: 10000,
    });

    await vi.runAllTimersAsync();

    await expect(resultPromise).resolves.toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
it("waits for a jittered exponential backoff delay", async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, "random").mockReturnValue(0.5);

  const fn = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce({ status: 429 })
    .mockResolvedValue("success");

  const resultPromise = withRetry(fn, {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    deadlineMs: 10000,
  });

  await vi.advanceTimersByTimeAsync(49);
  expect(fn).toHaveBeenCalledTimes(1);

  await vi.advanceTimersByTimeAsync(1);
  await expect(resultPromise).resolves.toBe("success");

  expect(fn).toHaveBeenCalledTimes(2);
});
it("respects the Retry-After header", async () => {
  vi.useFakeTimers();

  const fn = vi
    .fn<() => Promise<string>>()
    .mockRejectedValueOnce({
      status: 429,
      headers: new Headers({
        "retry-after": "2",
      }),
    })
    .mockResolvedValue("success");

  const resultPromise = withRetry(fn, {
    maxAttempts: 3,
    baseDelayMs: 100,
    maxDelayMs: 1000,
    deadlineMs: 10000,
  });

  await vi.advanceTimersByTimeAsync(1999);
  expect(fn).toHaveBeenCalledTimes(1);

  await vi.advanceTimersByTimeAsync(1);
  await expect(resultPromise).resolves.toBe("success");

  expect(fn).toHaveBeenCalledTimes(2);
});
