-- Später in Supabase SQL Editor ausführen.
-- Noch nicht erforderlich, um das lokale UI zu starten.

create table if not exists public.areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid references public.areas(id) on delete set null,
  title text not null,
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  area_id uuid not null references public.areas(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.inbox_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  weekly_target integer not null default 1,
  created_at timestamptz not null default now()
);

create table if not exists public.tracking_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  note text not null default '',
  tracked_on date not null default current_date,
  created_at timestamptz not null default now()
);

alter table public.areas enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.inbox_items enable row level security;
alter table public.routines enable row level security;
alter table public.tracking_entries enable row level security;

create policy "Users manage own areas"
on public.areas for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own projects"
on public.projects for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own tasks"
on public.tasks for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own inbox"
on public.inbox_items for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own routines"
on public.routines for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users manage own tracking"
on public.tracking_entries for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
