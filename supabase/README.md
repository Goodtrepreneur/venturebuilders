# Founder portal setup

## Running migrations (Supabase CLI)

To apply the SQL migrations in `supabase/migrations/` (e.g. `001_initial_schema.sql`) to your linked Supabase project:

1. **Install the Supabase CLI** (if needed):  
   [Installation guide](https://supabase.com/docs/guides/cli/getting-started)

2. **Log in and link your project** (one-time):
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   Get `YOUR_PROJECT_REF` from the project URL in the dashboard:  
   `https://supabase.com/dashboard/project/<project-ref>`.

3. **Push migrations to the remote database**:
   ```bash
   supabase db push
   ```
   This runs any new migration files in `supabase/migrations/` that haven’t been applied yet.

To create a new migration after changing the schema locally:
```bash
supabase migration new your_migration_name
```
Then edit the new file in `supabase/migrations/` and run `supabase db push` again.

---

## Edge Function: notify-reveal

The `notify-reveal` function is invoked when a user reveals an email on the dashboard. It sends a Slack message and creates an Airtable record in parallel.

**Deploy the function:**
```bash
supabase functions deploy notify-reveal
```

**Set secrets** (Dashboard → Project Settings → Edge Functions, or CLI):
```bash
supabase secrets set SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
supabase secrets set AIRTABLE_TOKEN=your_airtable_personal_access_token
supabase secrets set AIRTABLE_BASE_ID=your_airtable_base_id
```

- **SLACK_WEBHOOK_URL**: Incoming webhook URL from Slack.
- **AIRTABLE_TOKEN**: Airtable personal access token (with `data.records:write` scope for the base).
- **AIRTABLE_BASE_ID**: Base ID from the Airtable base URL (`https://airtable.com/appXXXXXXXXXXXXXX` → `appXXXXXXXXXXXXXX`).

The Airtable base must have a table named **"Email Reveals"** with fields: **User**, **Record**, **Revealed At**. Failures are logged but do not change the HTTP response (200 OK).

---

## Edge Function: sync-to-airtable

Syncs a Supabase table row to Airtable. POST the full row as JSON. If the row has no `airtable_id`, a new Airtable record is created and the returned Airtable id is written back to the Supabase row. If `airtable_id` is present, the existing Airtable record is updated (PATCH). All fields except `id`, `airtable_id`, and `email` are sent to Airtable.

**Deploy:**
```bash
supabase functions deploy sync-to-airtable
```

**Secrets** (Dashboard → Edge Functions → Environment Variables, or CLI):
```bash
supabase secrets set AIRTABLE_TOKEN=...
supabase secrets set AIRTABLE_BASE_ID=...
supabase secrets set AIRTABLE_TABLE=...        # Airtable table name or id
supabase secrets set DB_URL=...              # Project URL (e.g. https://xxx.supabase.co)
supabase secrets set DB_SERVICE_KEY=...      # Service role key
supabase secrets set SUPABASE_TABLE=...       # Supabase table to update (e.g. founderbase)
```

Ensure the Supabase table has an `airtable_id` column (see migration `003_founderbase_airtable_id.sql` for founderbase).

---

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
