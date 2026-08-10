-- Site visitors who happen to have an active Supabase auth session in their
-- browser (e.g. previously logged into the founder portal on the same
-- domain) send requests as "authenticated" rather than "anon". Allow both.
CREATE POLICY "Allow authenticated inserts" ON public.retreat_rsvps
  FOR INSERT TO authenticated
  WITH CHECK (true);
