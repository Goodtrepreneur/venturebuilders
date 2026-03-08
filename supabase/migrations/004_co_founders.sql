-- Co-founders: one row per co-founder per founder_startup

CREATE TABLE IF NOT EXISTS public.co_founders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  founder_startup_id uuid NOT NULL REFERENCES public.founder_startups(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  role text,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.co_founders IS 'Co-founders linked to a founder_startups record';

ALTER TABLE public.co_founders ENABLE ROW LEVEL SECURITY;

-- Founders can manage co_founders only for their own founder_startup
DROP POLICY IF EXISTS "Founders can read own co_founders" ON public.co_founders;
CREATE POLICY "Founders can read own co_founders" ON public.co_founders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.founder_startups fs WHERE fs.id = founder_startup_id AND fs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Founders can insert own co_founders" ON public.co_founders;
CREATE POLICY "Founders can insert own co_founders" ON public.co_founders
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.founder_startups fs WHERE fs.id = founder_startup_id AND fs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Founders can update own co_founders" ON public.co_founders;
CREATE POLICY "Founders can update own co_founders" ON public.co_founders
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.founder_startups fs WHERE fs.id = founder_startup_id AND fs.user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Founders can delete own co_founders" ON public.co_founders;
CREATE POLICY "Founders can delete own co_founders" ON public.co_founders
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.founder_startups fs WHERE fs.id = founder_startup_id AND fs.user_id = auth.uid())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.co_founders TO authenticated;
