# WhatsAppBrain Setup Guide

## Quick Start (5 minutes)

### Step 1: Supabase Database
1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **"New Project"**
3. Name: `whatsappbrain`, Set a database password
4. Once created, go to **Settings > API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
5. Go to **SQL Editor** and paste the contents of `lib/schema.sql`
6. Click **Run** to create all tables

### Step 2: Google OAuth (Optional but Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "WhatsAppBrain"
3. Go to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth Client ID**
5. Application type: **Web application**
6. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
7. Copy `Client ID` → `GOOGLE_CLIENT_ID`
8. Copy `Client Secret` → `GOOGLE_CLIENT_SECRET`

### Step 3: Generate Auth Secret
Run in terminal:
```bash
cd whatsappbrain-app
npx auth secret
```
Copy the generated value to `AUTH_SECRET`

### Step 4: WhatsApp Business API (Required for Production)
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create an app: **Business** type > **WhatsApp**
3. Go to **WhatsApp > API Setup**
4. Copy your phone number ID → `WHATSAPP_PHONE_NUMBER_ID`
5. Generate temporary access token → `WHATSAPP_ACCESS_TOKEN`
6. Go to **App Settings > Basic** and copy App Secret → `WHATSAPP_APP_SECRET`
7. Go to **WhatsApp > Configuration > Webhooks**
   - Callback URL: `https://your-domain.com/api/whatsapp`
   - Verify Token: `whatsappbrain_verify_token` (must match .env.local)

### Step 5: Start Development
```bash
cd whatsappbrain-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables Reference

| Variable | Required | Where to Get |
|----------|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | ⚠️ | Supabase Dashboard > Settings > API |
| `GROQ_API_KEY` | ✅ | [console.groq.com](https://console.groq.com) |
| `AUTH_SECRET` | ✅ | Run `npx auth secret` |
| `GOOGLE_CLIENT_ID` | Optional | Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Optional | Google Cloud Console |
| `WHATSAPP_ACCESS_TOKEN` | ✅ | Meta Developers > WhatsApp > API Setup |
| `WHATSAPP_PHONE_NUMBER_ID` | ✅ | Meta Developers > WhatsApp > API Setup |
| `WHATSAPP_APP_SECRET` | ✅ | Meta Developers > App Settings > Basic |
| `WHATSAPP_VERIFY_TOKEN` | ✅ | Create your own (e.g., `whatsappbrain_verify_token`) |
| `RESEND_API_KEY` | Optional | [resend.com](https://resend.com) |
| `NOTIFICATION_EMAIL` | Optional | Your email for handoff alerts |

---

## How It Works

```
Customer sends WhatsApp message
        ↓
Meta Cloud API receives message
        ↓
Webhook POST → /api/whatsapp
        ↓
┌─────────────────────────────┐
│ 1. Verify HMAC signature    │
│ 2. Find business by phone   │
│ 3. Check conversation status│
│ 4. Match bot rules (local)  │
│ 5. If no match → Groq AI    │
│ 6. Send reply via Meta API  │
└─────────────────────────────┘
```

---

## Free Tier Limits

- **Supabase**: 500MB database, 50,000 monthly active users
- **Groq**: 14,400 requests/day (free)
- **Meta WhatsApp**: 1,000 conversations/month (free sandbox)

---

## Troubleshooting

**Webhook not receiving messages?**
1. Check `WHATSAPP_APP_SECRET` is set
2. Verify callback URL is correct
3. Check Meta webhook logs in dashboard

**AI not responding?**
1. Verify `GROQ_API_KEY` is valid
2. Check if business profile exists in Supabase
3. Look at server logs for errors

**Google OAuth not working?**
1. Ensure redirect URI matches exactly
2. Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Verify `AUTH_SECRET` is set

---

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd whatsappbrain-app
vercel

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# ... add all other env vars
```

For production, update WhatsApp webhook URL to your Vercel domain.
