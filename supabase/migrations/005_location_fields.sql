-- Replace single location with city, state_region, country (all optional)

ALTER TABLE public.founder_startups
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state_region text,
  ADD COLUMN IF NOT EXISTS country text;

ALTER TABLE public.founder_startups
  ALTER COLUMN location DROP NOT NULL;

COMMENT ON COLUMN public.founder_startups.city IS 'City (optional)';
COMMENT ON COLUMN public.founder_startups.state_region IS 'State / Region / Province (optional)';
COMMENT ON COLUMN public.founder_startups.country IS 'Country (optional)';
