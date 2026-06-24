-- =======================================================
-- SQL SCHEMA FOR WHATSAPPBRAIN (PRODUCTION-READY)
-- Copy and run this script in your Supabase SQL Editor
-- =======================================================

-- IMPORTANT: If you ran the old schema, run this first to drop existing tables:
-- DROP TABLE IF EXISTS public.conversations CASCADE;
-- DROP TABLE IF EXISTS public.bot_rules CASCADE;
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- DROP TABLE IF EXISTS public.users CASCADE;

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    email TEXT PRIMARY KEY,
    password TEXT NOT NULL, -- Hashed passwords (bcrypt)
    "businessName" TEXT NOT NULL,
    whatsapp TEXT NOT NULL UNIQUE,
    city TEXT NOT NULL,
    plan TEXT DEFAULT 'free' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index for phone lookups in webhook
CREATE INDEX IF NOT EXISTS idx_users_whatsapp ON public.users(whatsapp);

-- 2. Create Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    user_id TEXT PRIMARY KEY REFERENCES public.users(email) ON DELETE CASCADE,
    services TEXT[] DEFAULT '{}'::text[] NOT NULL,
    prices JSONB DEFAULT '{}'::jsonb NOT NULL,
    hours TEXT NOT NULL,
    location TEXT NOT NULL,
    policies TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create Bot Rules Table
CREATE TABLE IF NOT EXISTS public.bot_rules (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    triggers TEXT[] DEFAULT '{}'::text[] NOT NULL,
    reply TEXT NOT NULL,
    category TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    ai_generated BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bot_rules_user_id ON public.bot_rules(user_id);

-- 4. Create Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    messages JSONB DEFAULT '[]'::jsonb NOT NULL,
    status TEXT DEFAULT 'bot' NOT NULL, -- 'bot' | 'human_pending' | 'human_active'
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, "customerPhone")
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_phone ON public.conversations("customerPhone");

-- 5. Create Contacts Table
CREATE TABLE IF NOT EXISTS public.contacts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    phone TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    tags TEXT[] DEFAULT '{}'::text[],
    notes TEXT DEFAULT '',
    "customFields" JSONB DEFAULT '{}'::jsonb,
    source TEXT DEFAULT 'manual' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id ON public.contacts(user_id);

-- 6. Create Templates Table
CREATE TABLE IF NOT EXISTS public.templates (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    language TEXT DEFAULT 'en' NOT NULL,
    category TEXT DEFAULT 'marketing' NOT NULL,
    body TEXT NOT NULL,
    variables TEXT[] DEFAULT '{}'::text[],
    status TEXT DEFAULT 'draft' NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- 7. Create Broadcasts Table
CREATE TABLE IF NOT EXISTS public.broadcasts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    "templateId" TEXT,
    message TEXT NOT NULL,
    "recipientCount" INTEGER DEFAULT 0,
    "sentCount" INTEGER DEFAULT 0,
    "failedCount" INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' NOT NULL,
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    "sentAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_broadcasts_user_id ON public.broadcasts(user_id);

-- 8. Create Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES public.users(email) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'broadcast' NOT NULL,
    "templateId" TEXT,
    message TEXT NOT NULL,
    "recipientTags" TEXT[] DEFAULT '{}'::text[],
    "scheduledAt" TIMESTAMP WITH TIME ZONE,
    recurring TEXT,
    status TEXT DEFAULT 'draft' NOT NULL,
    stats JSONB DEFAULT '{"sent":0,"delivered":0,"read":0,"replied":0}'::jsonb,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id ON public.campaigns(user_id);

-- 9. Row Level Security (PRODUCTION)
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- IMPORTANT: Server-side code uses SUPABASE_SERVICE_ROLE_KEY which bypasses RLS.
-- The policies below are for client-side direct access (if any).
-- They deny ALL access by default. Only allow SELECT/INSERT/UPDATE for the owner.

-- Users: only allow access to own row
CREATE POLICY "Users can only access own data" ON public.users
  FOR ALL
  USING (auth.uid()::text = email)
  WITH CHECK (auth.uid()::text = email);

-- Profiles: only allow access to own profile
CREATE POLICY "Users can only access own profile" ON public.profiles
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Bot Rules: only allow access to own rules
CREATE POLICY "Users can only access own bot rules" ON public.bot_rules
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Conversations: only allow access to own conversations
CREATE POLICY "Users can only access own conversations" ON public.conversations
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Contacts: only allow access to own contacts
CREATE POLICY "Users can only access own contacts" ON public.contacts
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Templates: only allow access to own templates
CREATE POLICY "Users can only access own templates" ON public.templates
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Broadcasts: only allow access to own broadcasts
CREATE POLICY "Users can only access own broadcasts" ON public.broadcasts
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Campaigns: only allow access to own campaigns
CREATE POLICY "Users can only access own campaigns" ON public.campaigns
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- NOTE: If you need public read access for specific tables (e.g., a public directory),
-- create separate policies with USING (true) for SELECT only.
