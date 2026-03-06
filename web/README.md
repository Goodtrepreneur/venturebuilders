# Venture Builders – Next.js App

Next.js 14 app with App Router, TypeScript, Tailwind CSS, Supabase, and shadcn/ui.

## Setup

1. **Install dependencies** (from this `web` directory):
   ```bash
   npm install
   ```

2. **Configure Supabase**  
   Copy your project URL and keys from the [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API into `web/.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` – Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon/public key  
   - `SUPABASE_SERVICE_ROLE_KEY` – service role key (server-only, keep secret)

3. **Run the dev server**:
   ```bash
   npm run dev
   ```

## Add shadcn/ui components

Components are configured with default settings. Add components with:

```bash
npx shadcn@latest add button
npx shadcn@latest add card
# etc.
```

## Supabase clients

- **Browser (Client Components):** `import { createClient } from '@/lib/supabase/client'`
- **Server (Server Components, Actions, Route Handlers):** `import { createClient } from '@/lib/supabase/server'` (use `await createClient()`)
