-- Founderbase: table for dashboard (all columns shown except email, which is revealed on demand)
-- If you already have a Founderbase table, skip or modify this migration.

CREATE TABLE IF NOT EXISTS public.founderbase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  founder_name text,
  company_name text,
  one_liner text,
  website text,
  stage text,
  industry text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.founderbase IS 'Founder records for dashboard; email revealed on demand';
