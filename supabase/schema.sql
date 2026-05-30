-- ============================================================
-- MYBC — Supabase schema
-- Run this in the Supabase SQL editor
-- ============================================================

-- Enable UUID extension (already on by default in Supabase)
create extension if not exists "uuid-ossp";

-- ── profiles ──────────────────────────────────────────────────
-- Extends auth.users. Created after email confirmation.
create table if not exists public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text        not null,
  birth_date  date        not null,
  birth_time  time        not null,
  birth_place text        not null,
  birth_lat   numeric,
  birth_lng   numeric,
  language    text        not null default 'English',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── subscriptions ──────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  stripe_customer_id      text        unique,
  stripe_subscription_id  text        unique,
  status                  text        not null default 'incomplete',
  current_period_end      timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role can do anything (used by webhook handler)
create policy "Service role full access on subscriptions"
  on public.subscriptions for all
  using (true)
  with check (true);

-- ── reports ────────────────────────────────────────────────────
create table if not exists public.reports (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade unique,
  generation_status   text        not null default 'pending',
  data                jsonb,
  generated_at        timestamptz,
  created_at          timestamptz not null default now()
);

alter table public.reports enable row level security;

create policy "Users can read own report"
  on public.reports for select
  using (auth.uid() = user_id);

-- Service role can do anything
create policy "Service role full access on reports"
  on public.reports for all
  using (true)
  with check (true);

-- ── Helper: get active subscription status for a user ──────────
create or replace function public.get_user_subscription_status(uid uuid)
returns text
language sql
security definer
as $$
  select status
  from public.subscriptions
  where user_id = uid
  order by created_at desc
  limit 1;
$$;
