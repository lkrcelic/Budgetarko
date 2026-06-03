-- ─────────────────────────────────────────────────────────────
-- Budgetarko — initial schema
-- ─────────────────────────────────────────────────────────────

-- ── profiles ──────────────────────────────────────────────────
create table profiles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  name       text not null,
  initials   text not null,
  tint       text not null default '#1f8a5b',
  created_at timestamptz default now()
);

-- ── categories ────────────────────────────────────────────────
create table categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  name       text not null,
  type       text not null check (type in ('income', 'expense')),
  active     boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz default now(),
  unique (user_id, name, type)
);

-- ── entries ───────────────────────────────────────────────────
create table entries (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid references profiles not null,
  kind         text not null check (kind in ('expense', 'income', 'card', 'subscription')),
  amount       numeric(12, 2) not null check (amount > 0),
  category     text not null,
  description  text not null default '',
  year         int  not null,
  month        int  not null check (month between 1 and 12),
  -- card installment fields
  installments int,
  start_year   int,
  start_month  int  check (start_month between 1 and 12),
  -- subscription fields
  frequency    text check (frequency in ('monthly', 'yearly', 'once')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── auto-update updated_at ────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger entries_updated_at
  before update on entries
  for each row execute function update_updated_at();

-- ── Row Level Security ────────────────────────────────────────
alter table profiles   enable row level security;
alter table categories enable row level security;
alter table entries    enable row level security;

create policy "Users manage own profiles"
  on profiles for all
  using (auth.uid() = user_id);

create policy "Users manage own categories"
  on categories for all
  using (auth.uid() = user_id);

create policy "Users manage entries in own profiles"
  on entries for all
  using (
    exists (
      select 1 from profiles p
      where p.id = entries.profile_id
        and p.user_id = auth.uid()
    )
  );
