interface RateRecord {
  count:   number
  resetAt: number
}

const store = new Map<string, RateRecord>()

/**
 * Returns true if the request is allowed, false if rate-limited.
 * @param key        - identifier (e.g. email or IP)
 * @param maxAttempts - max allowed attempts in the window
 * @param windowMs   - window duration in milliseconds
 */
export function checkRateLimit(
  key:         string,
  maxAttempts: number = 5,
  windowMs:    number = 15 * 60 * 1000   // 15 minutes
): boolean {
  const now    = Date.now()
  const record = store.get(key)

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (record.count < maxAttempts) {
    record.count++
    return true
  }

  return false
}

/**
 * Returns seconds until the rate limit resets, or 0 if not limited.
 */
export function getRateLimitResetSeconds(key: string): number {
  const record = store.get(key)
  if (!record || Date.now() > record.resetAt) return 0
  return Math.ceil((record.resetAt - Date.now()) / 1000)
}

/** Clear the rate limit for a key (e.g. on successful login). */
export function clearRateLimit(key: string): void {
  store.delete(key)
}
