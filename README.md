# Venture Builders

Environment variables and deployment guide for the Venture Builders project.

---

## Environment variables

### Next.js (`.env.local`)

Create a `.env.local` file in the **`web`** directory (or project root if your Next.js app lives there) with:

| Variable | Where to find it |
|----------|------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings → **API** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings → **API** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings → **API** |

In the [Supabase Dashboard](https://supabase.com/dashboard): select your project → **Project Settings** → **API**. Use **Project URL** for the URL and the **anon** and **service_role** keys from the API keys section.

---

### Supabase Edge Functions

Set these in the Supabase Dashboard: **Edge Functions** → **Environment Variables** (or via CLI: `supabase secrets set ...`).

| Variable | Where to find it |
|----------|------------------|
| `SLACK_WEBHOOK_URL` | Slack app → **Incoming Webhooks** → webhook URL for your workspace/channel |
| `AIRTABLE_TOKEN` | Airtable account → **Personal Access Tokens** (create a token with access to the base) |
| `AIRTABLE_BASE_ID` | Airtable base URL in the browser: `https://airtable.com/appXXXXXXXXXX` → the `appXXXXXXXXXX` part |
| `AIRTABLE_TABLE` | Airtable table name or table id (for **sync-to-airtable** and optionally **notify-reveal**) |
| `DB_URL` | Supabase project URL (Project Settings → API) — for **sync-to-airtable** |
| `DB_SERVICE_KEY` | Supabase **service role** key (Project Settings → API) — for **sync-to-airtable** |
| `SUPABASE_TABLE` | Supabase table name to update when writing back Airtable id (e.g. `founderbase`) — for **sync-to-airtable** |

- **notify-reveal**: Slack + Airtable “Email Reveals” (uses `SLACK_WEBHOOK_URL`, `AIRTABLE_TOKEN`, `AIRTABLE_BASE_ID`).
- **sync-to-airtable**: Syncs a Supabase row to Airtable (create or update) and writes Airtable id back (uses all of the above).

---

## Deployment (Vercel)

1. **Push to GitHub**  
   Commit and push your repo to GitHub.

2. **Import in Vercel**  
   Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import the GitHub repository. Set the **Root Directory** to `web` if your Next.js app lives in the `web` folder.

3. **Add environment variables**  
   In the Vercel project: **Settings** → **Environment Variables**. Add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`  
   (and any other `NEXT_PUBLIC_*` or server-side vars your app uses.)

4. **Deploy**  
   Trigger a deploy (e.g. **Deployments** → **Redeploy** or push a new commit). The app will use the env vars from the Vercel dashboard.

---

For Supabase migrations and Edge Function setup, see **`supabase/README.md`**.
