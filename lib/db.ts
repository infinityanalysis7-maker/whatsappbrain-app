import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get credentials from Server-side env
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
// Use SERVICE ROLE KEY for server-side operations (bypasses RLS, has full access)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
// Fallback to anon key only if service role key is not available (dev mode)
const supabaseKey = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = !!(supabaseUrl && supabaseKey)

const SB_TIMEOUT = 3_000

async function fetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), SB_TIMEOUT)
  try {
    const response = await fetch(input, { ...init, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Create an AUTHENTICATED Supabase client with JWT token.
 * Use this for all RLS-protected operations.
 * 
 * RLS policies will be enforced: auth.uid() will return the user's ID from the JWT.
 */
export function createAuthenticatedSupabaseClient(jwtToken: string): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    console.warn('[Supabase] Client not configured (missing URL or ANON_KEY)')
    return null
  }

  const client = createClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false },
    global: {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      fetch: fetchWithTimeout,
    },
  })

  // Set the session with the JWT token
  client.auth.setSession({
    access_token: jwtToken,
    refresh_token: '',
  })

  return client
}

/**
 * Create an UNAUTHENTICATED Supabase client.
 * Use only for public operations (no RLS).
 */
export function createPublicSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) {
    return null
  }

  return createClient(supabaseUrl!, supabaseKey!, {
    auth: { persistSession: false },
    global: { fetch: fetchWithTimeout },
  })
}

// Default public client (for non-RLS operations)
export const supabase: SupabaseClient | null = createPublicSupabaseClient()

// Interfaces
export interface DbUser {
  email: string
  password?: string
  businessName: string
  whatsapp: string
  city: string
  plan: string
  created_at?: string
  resetToken?: string | null
  resetExpires?: number | null
}

export interface DbProfile {
  user_id: string
  services: string[]
  prices: Record<string, string>
  hours: string
  location: string
  policies: string
  updated_at?: string
}

export interface DbBotRule {
  id: string
  user_id: string
  triggers: string[]
  reply: string
  category: string
  active: boolean
  aiGenerated?: boolean
  created_at?: string
}

export interface DbMessage {
  sender: 'customer' | 'bot' | 'owner'
  text: string
  timestamp: string
}

export interface DbConversation {
  id: string
  user_id: string
  customerPhone: string
  customerName: string
  messages: DbMessage[]
  status: 'bot' | 'human_pending' | 'human_active'
  updated_at: string
}

export interface DbContact {
  id: string
  user_id: string
  phone: string
  name: string
  email?: string
  tags: string[]
  notes?: string
  customFields: Record<string, string>
  source: 'manual' | 'csv' | 'whatsapp' | 'api'
  createdAt: string
  updatedAt: string
}

export interface DbTemplate {
  id: string
  user_id: string
  name: string
  language: string
  category: string
  body: string
  variables: string[]
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

export interface DbBroadcast {
  id: string
  user_id: string
  name: string
  templateId?: string
  message: string
  recipientCount: number
  sentCount: number
  failedCount: number
  status: 'draft' | 'scheduled' | 'sending' | 'completed' | 'failed'
  scheduledAt?: string
  sentAt?: string
  createdAt: string
}

export interface DbCampaign {
  id: string
  user_id: string
  name: string
  type: 'broadcast' | 'drip' | 'followup'
  templateId?: string
  message: string
  recipientTags: string[]
  scheduledAt?: string
  recurring?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed'
  stats: { sent: number; delivered: number; read: number; replied: number }
  createdAt: string
  updatedAt: string
}

interface LocalJsonDb {
  users: DbUser[]
  profiles: DbProfile[]
  bot_rules: DbBotRule[]
  conversations: DbConversation[]
  contacts: DbContact[]
  templates: DbTemplate[]
  broadcasts: DbBroadcast[]
  campaigns: DbCampaign[]
}

// Lazy-loaded local file helpers (fs/path only loaded when Supabase is not configured)
async function getLocalIo() {
  const { readFile, writeFile } = await import('fs/promises')
  const { join } = await import('path')
  const localPath = join(process.cwd(), 'lib', 'database.json')
  return { readFile, writeFile, localPath }
}

async function readLocalDb(): Promise<LocalJsonDb> {
  const { readFile, writeFile, localPath } = await getLocalIo()
  try {
    const data = await readFile(localPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    const defaultDb: LocalJsonDb = { users: [], profiles: [], bot_rules: [], conversations: [], contacts: [], templates: [], broadcasts: [], campaigns: [] }
    await writeFile(localPath, JSON.stringify(defaultDb, null, 2), 'utf-8')
    return defaultDb
  }
}

async function writeLocalDb(db: LocalJsonDb): Promise<void> {
  const { writeFile, localPath } = await getLocalIo()
  await writeFile(localPath, JSON.stringify(db, null, 2), 'utf-8')
}

// ==========================================
// DATA ACCESS FUNCTIONS
// ==========================================

// Users
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const db = await readLocalDb()
  const local = db.users.find(u => u.email.toLowerCase() === email.toLowerCase())
  if (local) return local

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    if (!error && data) {
      await writeLocalDb({ ...db, users: [...db.users.filter(u => u.email.toLowerCase() !== email.toLowerCase()), data as DbUser] })
      return data as DbUser
    }
    if (error) console.error('Supabase get user error:', error.message)
  }

  return null
}

export async function createUser(user: DbUser): Promise<void> {
  const payload = { ...user, created_at: new Date().toISOString() }

  const db = await readLocalDb()
  db.users = db.users.filter(u => u.email.toLowerCase() !== user.email.toLowerCase())
  db.users.push(payload)
  await writeLocalDb(db)

  if (supabase) {
    const { error } = await supabase.from('users').insert([payload])
    if (error) console.error('Supabase create user sync error:', error.message)
  }
}

export async function saveUser(user: DbUser): Promise<void> {
  const db = await readLocalDb()
  const idx = db.users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase())
  if (idx >= 0) {
    db.users[idx] = { ...db.users[idx], ...user }
  } else {
    db.users.push({ ...user, created_at: new Date().toISOString() })
  }
  await writeLocalDb(db)

  if (supabase) {
    const { error } = await supabase
      .from('users')
      .upsert(user, { onConflict: 'email' })
    if (error) console.error('Supabase save user sync error:', error.message)
  }
}

// Profiles
export async function getProfile(userId: string): Promise<DbProfile | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (!error && data) return data as DbProfile
    if (error) console.error('Supabase get profile error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.profiles.find(p => p.user_id.toLowerCase() === userId.toLowerCase()) || null
}

export async function saveProfile(profile: DbProfile): Promise<void> {
  const payload = { ...profile, updated_at: new Date().toISOString() }

  if (supabase) {
    const { error } = await supabase
      .from('profiles')
      .upsert(payload, { onConflict: 'user_id' })
    if (!error) return
    console.error('Supabase save profile error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  db.profiles = db.profiles.filter(p => p.user_id.toLowerCase() !== profile.user_id.toLowerCase())
  db.profiles.push(payload)
  await writeLocalDb(db)
}

/**
 * Create a default profile for a new user if it doesn't already exist.
 * This ensures new users have default data and don't get stuck with null responses.
 */
export async function createDefaultProfileIfNotExists(userId: string): Promise<DbProfile> {
  // Check if profile already exists
  const existingProfile = await getProfile(userId)
  if (existingProfile) {
    return existingProfile
  }

  // Create default profile
  const defaultProfile: DbProfile = {
    user_id: userId,
    services: [],
    prices: {},
    hours: '',
    location: '',
    policies: '',
  }

  await saveProfile(defaultProfile)
  return defaultProfile
}

// Bot Rules
export async function getBotRules(userId: string): Promise<DbBotRule[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('bot_rules')
      .select('*')
      .eq('user_id', userId)
    if (!error && data) return data as DbBotRule[]
    if (error) console.error('Supabase get bot rules error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.bot_rules.filter(r => r.user_id.toLowerCase() === userId.toLowerCase())
}

export async function saveBotRules(userId: string, rules: Omit<DbBotRule, 'user_id'>[]): Promise<void> {
  const payload = rules.map(r => ({
    ...r,
    user_id: userId,
    created_at: r.created_at || new Date().toISOString()
  }))

  if (supabase) {
    const { error: deleteError } = await supabase
      .from('bot_rules')
      .delete()
      .eq('user_id', userId)
    if (!deleteError && payload.length === 0) return

    if (payload.length > 0) {
      const { error: insertError } = await supabase
        .from('bot_rules')
        .insert(payload)
      if (!insertError) return
      if (insertError) console.error('Supabase insert bot rules error, falling back to local:', insertError.message)
    } else {
      if (deleteError) console.error('Supabase delete bot rules error, falling back to local:', deleteError.message)
    }
  }

  const db = await readLocalDb()
  db.bot_rules = db.bot_rules.filter(r => r.user_id.toLowerCase() !== userId.toLowerCase())
  db.bot_rules.push(...payload)
  await writeLocalDb(db)
}

// Conversations
export async function getConversations(userId: string): Promise<DbConversation[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (!error && data) return data as DbConversation[]
    if (error) console.error('Supabase get conversations error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.conversations
    .filter(c => c.user_id.toLowerCase() === userId.toLowerCase())
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
}

export async function getConversation(userId: string, customerPhone: string): Promise<DbConversation | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .eq('customerPhone', customerPhone)
      .maybeSingle()
    if (!error && data) return data as DbConversation
    if (error) console.error('Supabase get conversation error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.conversations.find(
    c => c.user_id.toLowerCase() === userId.toLowerCase() && c.customerPhone === customerPhone
  ) || null
}

export async function saveConversation(conversation: DbConversation): Promise<void> {
  const payload = { ...conversation, updated_at: new Date().toISOString() }

  if (supabase) {
    const { error } = await supabase
      .from('conversations')
      .upsert(payload, { onConflict: 'user_id,customerPhone' })
    if (!error) return
    console.error('Supabase save conversation error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  db.conversations = db.conversations.filter(
    c => !(c.user_id.toLowerCase() === conversation.user_id.toLowerCase() && c.customerPhone === conversation.customerPhone)
  )
  db.conversations.push(payload)
  await writeLocalDb(db)
}

// Counts
export async function getConversationCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
    if (error) console.error('Supabase count conversations error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.conversations.filter(c => c.user_id.toLowerCase() === userId.toLowerCase()).length
}

export async function getBotRuleCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('bot_rules')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
    if (error) console.error('Supabase count bot rules error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.bot_rules.filter(r => r.user_id.toLowerCase() === userId.toLowerCase()).length
}

// ==========================================
// CONTACTS
// ==========================================

export async function getContacts(userId: string): Promise<DbContact[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('updatedAt', { ascending: false })
    if (!error && data) return data as DbContact[]
    if (error) console.error('Supabase get contacts error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return (db.contacts || [])
    .filter(c => c.user_id.toLowerCase() === userId.toLowerCase())
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
}

export async function getContact(userId: string, contactId: string): Promise<DbContact | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .eq('id', contactId)
      .maybeSingle()
    if (!error && data) return data as DbContact
    if (error) console.error('Supabase get contact error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return (db.contacts || []).find(c => c.user_id === userId && c.id === contactId) || null
}

export async function getContactByPhone(userId: string, phone: string): Promise<DbContact | null> {
  const cleanPhone = phone.replace(/\D/g, '').slice(-10)
  if (supabase) {
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (!error && data) {
      const contact = data as DbContact
      if (contact.phone.replace(/\D/g, '').slice(-10) === cleanPhone) return contact
    }
  }

  const db = await readLocalDb()
  return (db.contacts || []).find(c => {
    return c.user_id === userId && c.phone.replace(/\D/g, '').slice(-10) === cleanPhone
  }) || null
}

export async function saveContact(contact: DbContact): Promise<void> {
  const payload = { ...contact, updatedAt: new Date().toISOString() }

  if (supabase) {
    const { error } = await supabase
      .from('contacts')
      .upsert(payload, { onConflict: 'id' })
    if (!error) return
    console.error('Supabase save contact error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  if (!db.contacts) db.contacts = []
  db.contacts = db.contacts.filter(c => c.id !== contact.id)
  db.contacts.push(payload)
  await writeLocalDb(db)
}

export async function deleteContact(userId: string, contactId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('user_id', userId)
      .eq('id', contactId)
    if (!error) return
    console.error('Supabase delete contact error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  if (!db.contacts) db.contacts = []
  db.contacts = db.contacts.filter(c => !(c.user_id === userId && c.id === contactId))
  await writeLocalDb(db)
}

export async function getContactCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
  }

  const db = await readLocalDb()
  return (db.contacts || []).filter(c => c.user_id === userId).length
}

// ==========================================
// TEMPLATES
// ==========================================

export async function getTemplates(userId: string): Promise<DbTemplate[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false })
    if (!error && data) return data as DbTemplate[]
    if (error) console.error('Supabase get templates error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return (db.templates || [])
    .filter(t => t.user_id.toLowerCase() === userId.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getTemplate(userId: string, templateId: string): Promise<DbTemplate | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('user_id', userId)
      .eq('id', templateId)
      .maybeSingle()
    if (!error && data) return data as DbTemplate
  }

  const db = await readLocalDb()
  return (db.templates || []).find(t => t.user_id === userId && t.id === templateId) || null
}

export async function saveTemplate(template: DbTemplate): Promise<void> {
  const payload = { ...template, updatedAt: new Date().toISOString() }

  if (supabase) {
    const { error } = await supabase
      .from('templates')
      .upsert(payload, { onConflict: 'id' })
    if (!error) return
    console.error('Supabase save template error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  if (!db.templates) db.templates = []
  db.templates = db.templates.filter(t => t.id !== template.id)
  db.templates.push(payload)
  await writeLocalDb(db)
}

export async function deleteTemplate(userId: string, templateId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('user_id', userId)
      .eq('id', templateId)
    if (!error) return
  }

  const db = await readLocalDb()
  if (!db.templates) db.templates = []
  db.templates = db.templates.filter(t => !(t.user_id === userId && t.id === templateId))
  await writeLocalDb(db)
}

export async function getTemplateCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
  }

  const db = await readLocalDb()
  return (db.templates || []).filter(t => t.user_id === userId).length
}

// ==========================================
// BROADCASTS
// ==========================================

export async function getBroadcasts(userId: string): Promise<DbBroadcast[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false })
    if (!error && data) return data as DbBroadcast[]
  }

  const db = await readLocalDb()
  return (db.broadcasts || [])
    .filter(b => b.user_id.toLowerCase() === userId.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getBroadcast(userId: string, broadcastId: string): Promise<DbBroadcast | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('broadcasts')
      .select('*')
      .eq('user_id', userId)
      .eq('id', broadcastId)
      .maybeSingle()
    if (!error && data) return data as DbBroadcast
  }

  const db = await readLocalDb()
  return (db.broadcasts || []).find(b => b.user_id === userId && b.id === broadcastId) || null
}

export async function saveBroadcast(broadcast: DbBroadcast): Promise<void> {
  const payload = { ...broadcast }

  if (supabase) {
    const { error } = await supabase
      .from('broadcasts')
      .upsert(payload, { onConflict: 'id' })
    if (!error) return
  }

  const db = await readLocalDb()
  if (!db.broadcasts) db.broadcasts = []
  db.broadcasts = db.broadcasts.filter(b => b.id !== broadcast.id)
  db.broadcasts.push(payload)
  await writeLocalDb(db)
}

export async function deleteBroadcast(userId: string, broadcastId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('broadcasts')
      .delete()
      .eq('user_id', userId)
      .eq('id', broadcastId)
    if (!error) return
  }

  const db = await readLocalDb()
  if (!db.broadcasts) db.broadcasts = []
  db.broadcasts = db.broadcasts.filter(b => !(b.user_id === userId && b.id === broadcastId))
  await writeLocalDb(db)
}

export async function getBroadcastCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('broadcasts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
  }

  const db = await readLocalDb()
  return (db.broadcasts || []).filter(b => b.user_id === userId).length
}

// ==========================================
// CAMPAIGNS
// ==========================================

export async function getCampaigns(userId: string): Promise<DbCampaign[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false })
    if (!error && data) return data as DbCampaign[]
  }

  const db = await readLocalDb()
  return (db.campaigns || [])
    .filter(c => c.user_id.toLowerCase() === userId.toLowerCase())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getCampaign(userId: string, campaignId: string): Promise<DbCampaign | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', userId)
      .eq('id', campaignId)
      .maybeSingle()
    if (!error && data) return data as DbCampaign
  }

  const db = await readLocalDb()
  return (db.campaigns || []).find(c => c.user_id === userId && c.id === campaignId) || null
}

export async function saveCampaign(campaign: DbCampaign): Promise<void> {
  const payload = { ...campaign, updatedAt: new Date().toISOString() }

  if (supabase) {
    const { error } = await supabase
      .from('campaigns')
      .upsert(payload, { onConflict: 'id' })
    if (!error) return
  }

  const db = await readLocalDb()
  if (!db.campaigns) db.campaigns = []
  db.campaigns = db.campaigns.filter(c => c.id !== campaign.id)
  db.campaigns.push(payload)
  await writeLocalDb(db)
}

export async function deleteCampaign(userId: string, campaignId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('user_id', userId)
      .eq('id', campaignId)
    if (!error) return
  }

  const db = await readLocalDb()
  if (!db.campaigns) db.campaigns = []
  db.campaigns = db.campaigns.filter(c => !(c.user_id === userId && c.id === campaignId))
  await writeLocalDb(db)
}

export async function getCampaignCount(userId: string): Promise<number> {
  if (supabase) {
    const { count, error } = await supabase
      .from('campaigns')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
    if (!error && count != null) return count
  }

  const db = await readLocalDb()
  return (db.campaigns || []).filter(c => c.user_id === userId).length
}

// Helper to look up a business by its WhatsApp phone number
export async function getBusinessByPhone(whatsappPhone: string): Promise<DbUser | null> {
  // Clean phone number (extract digits)
  const cleanPhone = whatsappPhone.replace(/\D/g, '')
  if (!cleanPhone || cleanPhone.length < 10) return null

  // Extract last 10 digits for matching (handles +91 prefix variations)
  const last10 = cleanPhone.slice(-10)

  if (supabase) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('whatsapp', last10)
      .maybeSingle()
    if (!error && data) return data as DbUser
    if (error) console.error('Supabase get user by phone error, falling back to local:', error.message)
  }

  const db = await readLocalDb()
  return db.users.find(u => {
    const userCleanPhone = u.whatsapp.replace(/\D/g, '')
    // Match exact last 10 digits to handle country code variations
    return userCleanPhone.slice(-10) === last10
  }) || null
}
