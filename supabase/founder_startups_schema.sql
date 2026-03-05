-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Creates the founder_startups table and RLS so founders only see their own row.

-- Table: one row per founder (user_id from Supabase Auth)
create table if not exists public.founder_startups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- Optional contact
  email text,
  founder_name text,
  co_founder_names text,
  phone text,
  -- Required company fields
  company_name text not null,
  one_liner text not null,
  website text not null,
  stage text not null,
  industry text not null,
  description text not null,
  target_market text not null,
  business_model text not null,
  traction text not null,
  funding_to_date text not null,
  current_ask text not null,
  location text not null,
  founded_date text not null,
  -- Optional program
  program_name text,
  cohort_date text,
  how_you_heard text,
  -- Meta
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint founder_startups_user_id_key unique (user_id)
);

-- Trigger: keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists founder_startups_updated_at on public.founder_startups;
create trigger founder_startups_updated_at
  before update on public.founder_startups
  for each row execute function public.set_updated_at();

-- RLS: founders only see and edit their own row
alter table public.founder_startups enable row level security;

drop policy if exists "Founders can read own row" on public.founder_startups;
create policy "Founders can read own row" on public.founder_startups
  for select using (auth.uid() = user_id);

drop policy if exists "Founders can insert own row" on public.founder_startups;
create policy "Founders can insert own row" on public.founder_startups
  for insert with check (auth.uid() = user_id);

drop policy if exists "Founders can update own row" on public.founder_startups;
create policy "Founders can update own row" on public.founder_startups
  for update using (auth.uid() = user_id);

-- Allow authenticated users to use the table (RLS still restricts to own row)
grant select, insert, update on public.founder_startups to authenticated;
