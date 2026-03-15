# 🗄️ Supabase Setup Guide

The Supabase project is already live at `xqpqclqhhwxbmbiwphtl` (region: ap-south-1).

---

## Project Details

| Field | Value |
|---|---|
| Project Name | TradeDesk Project |
| Project ID | `xqpqclqhhwxbmbiwphtl` |
| Region | `ap-south-1` (Mumbai) |
| URL | `https://xqpqclqhhwxbmbiwphtl.supabase.co` |
| Status | ACTIVE_HEALTHY |

---

## Database Schema

### `public.profiles`
Stores user plan and metadata. Linked 1:1 to `auth.users`.

```sql
id                    uuid PRIMARY KEY REFERENCES auth.users(id)
email                 text
full_name             text
plan                  text DEFAULT 'free'   -- 'free' | 'basic' | 'pro'
plan_expiry           timestamptz
razorpay_subscription_id text
created_at            timestamptz DEFAULT now()
updated_at            timestamptz DEFAULT now()
```

### `public.trade_imports`
Stores all parsed trades per user.

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid REFERENCES auth.users(id)
file_name   text
trades      jsonb DEFAULT '[]'    -- array of trade objects
charges     numeric DEFAULT 0     -- broker charges
imported_at timestamptz DEFAULT now()
```

### `public.user_settings`
Stores tags, notes, and preferences per user.

```sql
user_id     uuid PRIMARY KEY REFERENCES auth.users(id)
tags        jsonb DEFAULT '{}'    -- { tradeId: [tag1, tag2] }
notes       jsonb DEFAULT '{}'    -- { tradeId: { text, mood } }
preferences jsonb DEFAULT '{}'
updated_at  timestamptz DEFAULT now()
```

---

## Row Level Security (RLS)

All tables have RLS enabled. Users can only access their own rows:

```sql
-- Example policy (already applied):
CREATE POLICY "Users can only see own data"
  ON public.trade_imports
  FOR ALL USING (auth.uid() = user_id);
```

---

## Auth Configuration

- **Email/Password**: Enabled
- **Google OAuth**: Configure at Supabase Dashboard → Authentication → Providers

### Google OAuth Setup
1. Create OAuth credentials at [console.cloud.google.com](https://console.cloud.google.com)
2. Authorized redirect URIs: `https://xqpqclqhhwxbmbiwphtl.supabase.co/auth/v1/callback`
3. Add Client ID and Secret to Supabase → Authentication → Providers → Google

---

## Data Sync Flow

```
User logs in
     │
     ├─ First login → syncLocalDataToSupabase()
     │     Pushes any localStorage trades/tags/notes to Supabase
     │
     └─ Subsequent logins → loads from Supabase
           Data available across all devices
```
