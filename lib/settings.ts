import fs from 'fs/promises'
import path from 'path'

// Shared helper to read/write user settings, persisted to database.json.
// Used by the webhook to load custom handoff triggers per-user,
// and by /api/settings to store user preferences.

const DB_PATH = path.join(process.cwd(), 'lib', 'database.json')

// In-memory cache for fast reads during a request
const settingsCache: Record<string, unknown> = {}

interface LocalJsonDb {
  users: unknown[]
  profiles: unknown[]
  bot_rules: unknown[]
  conversations: unknown[]
  settings?: Record<string, unknown>
}

async function readDb(): Promise<LocalJsonDb> {
  try {
    const data = await fs.readFile(DB_PATH, 'utf-8')
    return JSON.parse(data)
  } catch {
    const defaultDb: LocalJsonDb = { users: [], profiles: [], bot_rules: [], conversations: [], settings: {} }
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2), 'utf-8')
    return defaultDb
  }
}

async function writeDb(db: LocalJsonDb): Promise<void> {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
}

export async function getSettings(userId: string): Promise<unknown> {
  // Return from cache if available
  if (settingsCache[userId]) return settingsCache[userId]

  const db = await readDb()
  const settings = db.settings?.[userId] || null
  if (settings) settingsCache[userId] = settings
  return settings
}

export async function setSettings(userId: string, settings: unknown): Promise<void> {
  // Update cache
  settingsCache[userId] = settings

  // Persist to database.json
  const db = await readDb()
  if (!db.settings) db.settings = {}
  db.settings[userId] = settings
  await writeDb(db)
}

// ─── Handoff trigger resolution ───
// Pure function extracted for testability.

export const DEFAULT_HANDOFF_TRIGGERS = [
  'talk to owner',
  'speak to human',
  'human',
  'chat with owner',
  'bhai connect',
  'connect me',
  'owner',
  'call me',
  'chat with person',
]

export function resolveHandoffTriggers(settings: unknown): string[] {
  const obj = settings as Record<string, unknown> | null
  const raw = obj?.handoffTriggers
  return Array.isArray(raw) && raw.length > 0 ? raw : DEFAULT_HANDOFF_TRIGGERS
}

export function isHandoffMessage(messageText: string, settings: unknown): boolean {
  const triggers = resolveHandoffTriggers(settings)
  const lower = messageText.toLowerCase()
  return triggers.some((t: string) => lower.includes(t))
}
