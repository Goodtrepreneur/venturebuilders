-- Add airtable_id to founderbase for sync-to-airtable Edge Function write-back.
ALTER TABLE public.founderbase
  ADD COLUMN IF NOT EXISTS airtable_id text;

COMMENT ON COLUMN public.founderbase.airtable_id IS 'Airtable record id after sync-to-airtable';
