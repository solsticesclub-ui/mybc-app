-- ============================================================
-- MYBC schema v2 — token-based identity (no Supabase Auth)
-- Run this in the Supabase SQL editor to replace the old schema.
-- ============================================================

-- Users: each row is one customer. token IS their identity (it's the URL key).
create table if not exists public.users (
  token               uuid        primary key default gen_random_uuid(),
  email               text        not null,
  name                text        not null,
  birth_date          date        not null,
  birth_time          time        not null,
  birth_place         text        not null,
  language            text        not null default 'English',
  status              text        not null default 'pending',
  -- pending | active | past_due | cancelled
  ls_customer_id      text,
  ls_subscription_id  text,
  created_at          timestamptz not null default now()
);

-- Reports: one per user. Stores both structured JSON data and prose report.
create table if not exists public.reports (
  id                uuid        primary key default gen_random_uuid(),
  user_token        uuid        not null references public.users(token) on delete cascade unique,
  generation_status text        not null default 'pending',
  -- pending | generating_chart | generating_health | generating_protocols | generating_mission | complete | failed
  data              jsonb,
  generated_at      timestamptz,
  created_at        timestamptz not null default now()
);

-- No RLS — all server access uses the service role key which bypasses RLS.
alter table public.users   disable row level security;
alter table public.reports disable row level security;
