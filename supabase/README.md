# Founder portal setup

## 1. Run the SQL in Supabase

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the contents of `founder_startups_schema.sql` and run it.

This creates the `founder_startups` table and RLS so founders only see their own row.

## 2. Configure redirect URL for magic links

1. In Supabase: **Authentication** → **URL Configuration**.
2. Add your site URL(s) to **Redirect URLs**, e.g.:
   - `https://yourdomain.com/founder.html`
   - `http://localhost:5500/founder.html` (or your local URL)

## 3. Config (already done)

- `js/supabase-config.js` contains your Supabase URL and anon key.
- It’s in `.gitignore` so the key isn’t committed. For local dev, the file is already there.

## 4. Use the founder page

- Open `founder.html`.
- Founder enters email → clicks “Send magic link” → checks email → clicks link → lands back on `founder.html` signed in.
- First time: fill and save the form (company fields required).
- Later: same link or same email + new magic link to update their profile.
