import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import { resolveHandoffTriggers, isHandoffMessage, DEFAULT_HANDOFF_TRIGGERS } from '@/lib/settings'

const DB_PATH = path.resolve(process.cwd(), 'lib', 'database.json')

describe('Settings persistence', () => {
  let originalDbContent: string | null = null

  beforeEach(async () => {
    try {
      originalDbContent = await fs.readFile(DB_PATH, 'utf-8')
    } catch {
      originalDbContent = null
    }
  })

  afterEach(async () => {
    if (originalDbContent !== null) {
      await fs.writeFile(DB_PATH, originalDbContent, 'utf-8')
    } else {
      try {
        await fs.unlink(DB_PATH)
      } catch {}
    }
  })

  it('should read settings from database.json when they exist', async () => {
    const testDb = {
      users: [],
      profiles: [],
      bot_rules: [],
      conversations: [],
      settings: {
        'test@example.com': {
          handoffTriggers: ['talk to owner', 'call me'],
          emailNotifications: true,
        },
      },
    }
    await fs.writeFile(DB_PATH, JSON.stringify(testDb, null, 2), 'utf-8')

    const settings = await import('@/lib/settings')
    const result = await settings.getSettings('test@example.com')

    expect(result).toEqual({
      handoffTriggers: ['talk to owner', 'call me'],
      emailNotifications: true,
    })
  })

  it('should return null for non-existent user', async () => {
    const testDb = {
      users: [],
      profiles: [],
      bot_rules: [],
      conversations: [],
      settings: {},
    }
    await fs.writeFile(DB_PATH, JSON.stringify(testDb, null, 2), 'utf-8')

    const settings = await import('@/lib/settings')
    const result = await settings.getSettings('nonexistent@example.com')

    expect(result).toBeNull()
  })

  it('should persist settings to database.json', async () => {
    const testDb = {
      users: [],
      profiles: [],
      bot_rules: [],
      conversations: [],
      settings: {},
    }
    await fs.writeFile(DB_PATH, JSON.stringify(testDb, null, 2), 'utf-8')

    const settings = await import('@/lib/settings')
    await settings.setSettings('new@example.com', {
      handoffTriggers: ['owner'],
      aiFallbackEnabled: false,
    })

    const raw = await fs.readFile(DB_PATH, 'utf-8')
    const db = JSON.parse(raw)
    expect(db.settings['new@example.com']).toEqual({
      handoffTriggers: ['owner'],
      aiFallbackEnabled: false,
    })
  })

  it('should update existing settings without overwriting other users', async () => {
    const testDb = {
      users: [],
      profiles: [],
      bot_rules: [],
      conversations: [],
      settings: {
        'user1@example.com': { handoffTriggers: ['owner'] },
        'user2@example.com': { handoffTriggers: ['manager'] },
      },
    }
    await fs.writeFile(DB_PATH, JSON.stringify(testDb, null, 2), 'utf-8')

    const settings = await import('@/lib/settings')
    await settings.setSettings('user1@example.com', { handoffTriggers: ['boss'] })

    const result1 = await settings.getSettings('user1@example.com')
    expect(result1).toEqual({ handoffTriggers: ['boss'] })

    const result2 = await settings.getSettings('user2@example.com')
    expect(result2).toEqual({ handoffTriggers: ['manager'] })
  })

  it('should handle database.json that does not exist yet', async () => {
    try {
      await fs.unlink(DB_PATH)
    } catch {}

    const settings = await import('@/lib/settings')

    const result = await settings.getSettings('fresh@example.com')
    expect(result).toBeNull()

    await settings.setSettings('fresh@example.com', { test: true })

    const raw = await fs.readFile(DB_PATH, 'utf-8')
    const db = JSON.parse(raw)
    expect(db.settings['fresh@example.com']).toEqual({ test: true })
    expect(db.users).toEqual([])
    expect(db.profiles).toEqual([])
  })

  it('should handle settings without the settings key in database.json', async () => {
    const testDb = {
      users: [{ email: 'old@example.com' }],
      profiles: [],
      bot_rules: [],
      conversations: [],
    }
    await fs.writeFile(DB_PATH, JSON.stringify(testDb, null, 2), 'utf-8')

    const settings = await import('@/lib/settings')

    const result = await settings.getSettings('old@example.com')
    expect(result).toBeNull()

    await settings.setSettings('old@example.com', { newSetting: true })

    const raw = await fs.readFile(DB_PATH, 'utf-8')
    const db = JSON.parse(raw)
    expect(db.settings).toBeDefined()
    expect(db.settings['old@example.com']).toEqual({ newSetting: true })
    expect(db.users).toHaveLength(1)
    expect(db.users[0].email).toBe('old@example.com')
  })
})

describe('resolveHandoffTriggers', () => {
  it('should return default triggers when settings is null', () => {
    expect(resolveHandoffTriggers(null)).toEqual(DEFAULT_HANDOFF_TRIGGERS)
  })

  it('should return default triggers when settings has no handoffTriggers', () => {
    expect(resolveHandoffTriggers({ emailNotifications: true })).toEqual(DEFAULT_HANDOFF_TRIGGERS)
  })

  it('should return default triggers when handoffTriggers is not an array', () => {
    expect(resolveHandoffTriggers({ handoffTriggers: 'invalid' })).toEqual(DEFAULT_HANDOFF_TRIGGERS)
  })

  it('should return default triggers when handoffTriggers is an empty array', () => {
    expect(resolveHandoffTriggers({ handoffTriggers: [] })).toEqual(DEFAULT_HANDOFF_TRIGGERS)
  })

  it('should return custom triggers when valid array is provided', () => {
    const custom = ['boss', 'manager']
    expect(resolveHandoffTriggers({ handoffTriggers: custom })).toEqual(custom)
  })

  it('should handle settings with extra fields', () => {
    const settings = { handoffTriggers: ['hello'], aiFallbackEnabled: false, businessHours: '9-5' }
    expect(resolveHandoffTriggers(settings)).toEqual(['hello'])
  })
})

describe('isHandoffMessage', () => {
  it('should match default triggers', () => {
    expect(isHandoffMessage('talk to owner', null)).toBe(true)
    expect(isHandoffMessage('speak to human', null)).toBe(true)
    expect(isHandoffMessage('bhai connect', null)).toBe(true)
    expect(isHandoffMessage('connect me', null)).toBe(true)
    expect(isHandoffMessage('call me', null)).toBe(true)
  })

  it('should match case-insensitively', () => {
    expect(isHandoffMessage('TALK TO OWNER', null)).toBe(true)
    expect(isHandoffMessage('Speak To Human', null)).toBe(true)
  })

  it('should match partial words (substring match)', () => {
    expect(isHandoffMessage('I want to talk to owner please', null)).toBe(true)
    expect(isHandoffMessage('can you connect me to someone', null)).toBe(true)
  })

  it('should not match non-handoff messages', () => {
    expect(isHandoffMessage('What are your prices?', null)).toBe(false)
    expect(isHandoffMessage('Do you have a haircut service?', null)).toBe(false)
    expect(isHandoffMessage('Hello!', null)).toBe(false)
  })

  it('should use custom triggers when provided', () => {
    const settings = { handoffTriggers: ['urgent', 'emergency'] }
    expect(isHandoffMessage('this is urgent', settings)).toBe(true)
    expect(isHandoffMessage('emergency help', settings)).toBe(true)
    expect(isHandoffMessage('talk to owner', settings)).toBe(false)
  })

  it('should fall back to defaults when custom triggers are invalid', () => {
    expect(isHandoffMessage('talk to owner', { handoffTriggers: 'invalid' })).toBe(true)
    expect(isHandoffMessage('speak to human', { handoffTriggers: [] })).toBe(true)
  })
})
