type RetryOptions = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  deadlineMs: number;
};

const NETWORK_ERROR_CODES = new Set([
  "ECONNRESET",
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ENOTFOUND",
  "EAI_AGAIN",
  "UND_ERR_CONNECT_TIMEOUT",
]);

const isRetryableError = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  if ("status" in error && typeof error.status === "number") {
    return error.status === 429 || (error.status >= 500 && error.status <= 599);
  }

  if ("name" in error && typeof error.name === "string") {
    if (error.name.startsWith("APIConnection")) {
      return true;
    }
  }

  if ("code" in error && typeof error.code === "string") {
    return NETWORK_ERROR_CODES.has(error.code);
  }

  if ("cause" in error) {
    return isRetryableError(error.cause);
  }

  return false;
};

const getRetryAfterMs = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null || !("headers" in error)) {
    return null;
  }

  const headers = error.headers;

  if (typeof headers !== "object" || headers === null) {
    return null;
  }

  let value: string | null = null;

  if ("get" in headers && typeof headers.get === "function") {
    value = headers.get("retry-after");
  } else if ("retry-after" in headers) {
    const headerValue = headers["retry-after"];
    value = typeof headerValue === "string" ? headerValue : null;
  }

  if (!value) {
    return null;
  }

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(value);

  if (!Number.isNaN(date)) {
    return Math.max(0, date - Date.now());
  }

  return null;
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> => {
  const { maxAttempts, baseDelayMs, maxDelayMs, deadlineMs } = options;

  const startTime = Date.now();
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (Date.now() - startTime >= deadlineMs) {
      if (lastError !== undefined) {
        throw lastError;
      }

      throw new Error("Retry deadline exceeded");
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (!isRetryableError(error) || attempt === maxAttempts) {
        throw error;
      }

      const elapsed = Date.now() - startTime;
      const remainingTime = deadlineMs - elapsed;

      if (remainingTime <= 0) {
        throw error;
      }

      const retryAfter = getRetryAfterMs(error);

      const exponentialCap = Math.min(
        maxDelayMs,
        baseDelayMs * 2 ** (attempt - 1),
      );

      const jitterDelay = Math.floor(Math.random() * (exponentialCap + 1));

      const delay = retryAfter ?? jitterDelay;

      if (delay >= remainingTime) {
        throw error;
      }

      await sleep(delay);
    }
  }

  throw lastError ?? new Error("Retry attempts exhausted");
};
