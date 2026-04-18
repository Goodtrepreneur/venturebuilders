-- Drop legacy policy superseded by combined consent-aware SELECT policy (rls_third_party_consent_gate).
-- Safe: combined policy already allows auth.uid() = user_id.

drop policy if exists "Founders can read own row" on public.founder_startups;
