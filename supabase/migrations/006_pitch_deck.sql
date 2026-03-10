-- Pitch deck: store path to PDF in founder_startups; files go in Storage bucket pitch-decks

ALTER TABLE public.founder_startups
  ADD COLUMN IF NOT EXISTS deck_url text;

COMMENT ON COLUMN public.founder_startups.deck_url IS 'Storage path to pitch deck PDF (bucket pitch-decks, path {user_id}/{founder_startup_id}.pdf)';

-- Create the pitch-decks bucket in Supabase Dashboard → Storage, then add policy:
-- Policy: "Founders can upload/update own deck" for INSERT, UPDATE with bucket_id = 'pitch-decks'
-- and (storage.foldername(name))[1] = auth.uid()::text
-- Policy: "Founders can read own deck" for SELECT with same folder check.
-- Or use: RLS policy allowing authenticated users to upload to their user_id folder.
