-- G‘ildirak juftligi platformasi — Umumiy reytingli test uchun Supabase jadvali
-- Ushbu SQL keyingi bosqichda Supabase SQL Editor ichida ishga tushiriladi.

create extension if not exists pgcrypto;

create table if not exists public.ranked_profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  company text not null,
  department text not null,
  position text not null,
  phone text not null unique,
  pin_hash text not null,
  avatar_data text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ranked_attempts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.ranked_profiles(id) on delete cascade,
  phone text not null,
  full_name text not null,
  company text not null,
  department text not null,
  position text not null,
  total_questions integer not null check (total_questions > 0),
  correct_count integer not null check (correct_count >= 0),
  percent integer not null check (percent >= 0 and percent <= 100),
  duration_seconds integer not null check (duration_seconds > 0),
  started_at timestamptz not null,
  finished_at timestamptz not null default now(),
  source text default 'ranked-general-test'
);

create index if not exists ranked_profiles_phone_idx on public.ranked_profiles(phone);
create index if not exists ranked_attempts_phone_idx on public.ranked_attempts(phone);
create index if not exists ranked_attempts_score_idx on public.ranked_attempts(percent desc, duration_seconds asc, finished_at asc);

-- Boshlang‘ich oddiy rejim uchun RLS o‘chirilgan holatda qoldiriladi.
-- Chunki static GitHub Pages + anon key bilan telefon+PIN tekshiruvi front-end orqali ishlaydi.
-- Keyingi professional bosqichda Supabase Auth / Telegram Login qo‘shilgach RLS policy alohida sozlanadi.

alter table public.ranked_profiles disable row level security;
alter table public.ranked_attempts disable row level security;
