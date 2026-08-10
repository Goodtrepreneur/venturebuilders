-- Venture Builders Retreat (Oct 2026) RSVP survey
CREATE TABLE IF NOT EXISTS public.retreat_rsvps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL CHECK (length(full_name) <= 255),
  email text NOT NULL CHECK (length(email) <= 254),
  organization text CHECK (organization IS NULL OR length(organization) <= 255),
  joining_futura boolean NOT NULL DEFAULT false,
  joining_ces boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT retreat_rsvps_at_least_one_selected CHECK (joining_futura OR joining_ces)
);

COMMENT ON TABLE public.retreat_rsvps IS 'RSVP survey responses for Venture Builders Retreat, Oct 2026 (Ireland/Italy). Used for headcount planning before paid registration.';

ALTER TABLE public.retreat_rsvps ENABLE ROW LEVEL SECURITY;

-- Public survey: anyone can submit an RSVP
CREATE POLICY "Allow public inserts" ON public.retreat_rsvps
  FOR INSERT TO anon
  WITH CHECK (true);

-- Only the VBF team (authenticated) can read responses
CREATE POLICY "Allow authenticated reads" ON public.retreat_rsvps
  FOR SELECT TO authenticated
  USING (true);
