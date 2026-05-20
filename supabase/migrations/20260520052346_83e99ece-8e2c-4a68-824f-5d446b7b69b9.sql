
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  unit_preference text not null default 'metric' check (unit_preference in ('metric','imperial')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
create policy "profiles_delete_own" on public.profiles for delete using (auth.uid() = id);

-- updated_at trigger function
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Calculations
create table public.calculations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gender text not null check (gender in ('male','female')),
  age integer not null check (age between 2 and 120),
  weight_kg numeric(6,2) not null check (weight_kg between 10 and 500),
  height_cm numeric(6,2) not null check (height_cm between 50 and 300),
  activity_level text not null default 'sedentary' check (activity_level in ('sedentary','light','moderate','active','very_active')),
  bmi numeric(5,2) not null,
  category text not null,
  ideal_weight_kg numeric(6,2) not null,
  daily_calories integer not null,
  notes text,
  created_at timestamptz not null default now()
);
alter table public.calculations enable row level security;

create policy "calc_select_own" on public.calculations for select using (auth.uid() = user_id);
create policy "calc_insert_own" on public.calculations for insert with check (auth.uid() = user_id);
create policy "calc_update_own" on public.calculations for update using (auth.uid() = user_id);
create policy "calc_delete_own" on public.calculations for delete using (auth.uid() = user_id);

create index calc_user_created_idx on public.calculations(user_id, created_at desc);

-- Shared results (public read)
create table public.shared_results (
  id text primary key,
  payload jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.shared_results enable row level security;

create policy "shared_select_all" on public.shared_results for select to anon, authenticated using (true);
create policy "shared_insert_all" on public.shared_results for insert to anon, authenticated with check (true);
create policy "shared_delete_own" on public.shared_results for delete using (auth.uid() = created_by);
