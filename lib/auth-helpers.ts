import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const BCRYPT_ROUNDS = 12

/** Hash a password with bcrypt (for new passwords). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS)
}

/**
 * Verify a password against a stored hash.
 * Handles migration: if the stored hash is a legacy SHA-256 hex string
 * (no $ prefix), it compares using SHA-256 and returns a flag indicating
 * whether the password should be re-hashed with bcrypt.
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<{ valid: boolean; needsRehash: boolean }> {
  // bcrypt hashes always start with "$2a$" or "$2b$" or "$2y$"
  if (storedHash.startsWith('$2')) {
    const valid = await bcrypt.compare(password, storedHash)
    return { valid, needsRehash: false }
  }

  // Legacy SHA-256 hash — compare for backward compatibility
  const sha256 = crypto.createHash('sha256').update(password).digest('hex')
  const valid = sha256 === storedHash
  return { valid, needsRehash: valid }
}

/**
 * Check if a stored hash is a legacy SHA-256 hash that needs migration.
 */
export function isLegacyHash(hash: string): boolean {
  return !hash.startsWith('$2')
}
