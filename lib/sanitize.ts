/**
 * Lightweight text sanitization — no external dependencies required.
 * Strips HTML tags and common XSS vectors while preserving plain text.
 */

const HTML_TAG_PATTERN = /<[^>]*>/g
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
const EVENT_HANDLER_PATTERN = /\s*on\w+\s*=\s*["']?[^"'>]*["']?/gi
const DATA_URL_PATTERN = /data:\s*text\/html[^,]*/gi
const JAVASCRIPT_PROTOCOL = /javascript:/gi

function stripAll(input: string): string {
  return input
    .replace(SCRIPT_PATTERN, '')
    .replace(EVENT_HANDLER_PATTERN, '')
    .replace(DATA_URL_PATTERN, '')
    .replace(JAVASCRIPT_PROTOCOL, '')
    .replace(HTML_TAG_PATTERN, '')
    .trim()
}

/**
 * Sanitize text input to prevent XSS attacks.
 * Removes HTML tags and scripts while preserving basic text formatting.
 * For richer sanitization, consider adding DOMPurify in production.
 */
export function sanitizeText(input: string): string {
  if (!input) return ''
  return stripAll(input)
}

/**
 * Sanitize a plain string — strips ALL HTML, returns plain text only.
 */
export function sanitizePlainText(input: string): string {
  if (!input) return ''
  return stripAll(input)
}

/**
 * Validate email format.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

/**
 * Validate phone number (10 digits, Indian format without +91).
 */
export function isValidIndianPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return /^[6-9]\d{9}$/.test(clean)
}

/**
 * Validate that a URL is safe (no javascript: protocol, etc).
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Escape HTML entities for safe rendering.
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}
