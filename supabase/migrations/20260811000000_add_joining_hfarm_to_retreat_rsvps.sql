-- Add H-Farm (Venice) as a third selectable RSVP option.
ALTER TABLE public.retreat_rsvps
  ADD COLUMN joining_hfarm boolean NOT NULL DEFAULT false;

ALTER TABLE public.retreat_rsvps
  DROP CONSTRAINT retreat_rsvps_at_least_one_selected;

ALTER TABLE public.retreat_rsvps
  ADD CONSTRAINT retreat_rsvps_at_least_one_selected
  CHECK (joining_futura OR joining_ces OR joining_hfarm);
