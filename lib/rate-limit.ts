/**
 * Simple in-memory sliding window rate limiter.
 * 
 * ⚠️ IMPORTANT: For production with multiple serverless instances, this MUST be
 * replaced with Redis-based limiter (e.g., Upstash Redis, Redis Cloud) or a
 * database-backed limiter. In-memory maps are reset on every cold start and
 * do not share state across instances.
 * 
 * Recommended: https://github.com/vercel-labs/edge-rate-limit or Upstash Redis
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    if (now - entry.windowStart > CLEANUP_INTERVAL) {
      store.delete(key)
    }
  }
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  retryAfterMs: number
}

/**
 * Check rate limit for a given key (e.g. IP address or email).
 * @param key - Unique identifier (IP, email, etc.)
 * @param maxRequests - Maximum requests allowed in the window
 * @param windowMs - Time window in milliseconds
 */
export function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): RateLimitResult {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.windowStart > windowMs) {
    // New window
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1, retryAfterMs: 0 }
  }

  if (entry.count >= maxRequests) {
    const retryAfterMs = windowMs - (now - entry.windowStart)
    return { allowed: false, remaining: 0, retryAfterMs }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count, retryAfterMs: 0 }
}

/**
 * Get client IP from request headers.
 * Note: In production behind a CDN/proxy, ensure X-Forwarded-For is trusted.
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}
