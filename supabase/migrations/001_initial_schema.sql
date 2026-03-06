-- Migration: 001_initial_schema
-- Tables: pending_investors, email_reveals

-- 1. pending_investors
CREATE TABLE IF NOT EXISTS public.pending_investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  firm text,
  message text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  invited_at timestamptz
);

COMMENT ON TABLE public.pending_investors IS 'Investors awaiting invitation or rejection';
COMMENT ON COLUMN public.pending_investors.status IS 'pending | invited | rejected';

-- 2. email_reveals
CREATE TABLE IF NOT EXISTS public.email_reveals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  record_id text NOT NULL,
  record_name text,
  user_email text,
  revealed_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_reveals IS 'Log of email reveals for audit';
