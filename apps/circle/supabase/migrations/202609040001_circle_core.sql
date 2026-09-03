create extension if not exists pgcrypto;

create or replace function public.circle_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.circle_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  city text not null default '',
  family_shape text not null default 'family',
  cover_art text not null default '/art/circle-trusted-ring-v1.png',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.circle_household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.circle_households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  invited_email text,
  display_name text not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'helper', 'viewer')),
  permissions text[] not null default array['people', 'calendar', 'home'],
  status text not null default 'active' check (status in ('active', 'invited', 'paused')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (user_id is not null or invited_email is not null)
);

create unique index circle_member_user_unique
  on public.circle_household_members(household_id, user_id)
  where user_id is not null;
create unique index circle_member_email_unique
  on public.circle_household_members(household_id, lower(invited_email))
  where invited_email is not null;

create table public.circle_records (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.circle_households(id) on delete cascade,
  kind text not null check (kind in (
    'person', 'event', 'routine', 'care_need', 'maintenance', 'contract',
    'equipment', 'improvement', 'subscription', 'expense', 'document', 'school_booking'
  )),
  title text not null check (char_length(title) between 1 and 180),
  status text not null default 'active',
  starts_at timestamptz,
  due_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index circle_members_user_idx on public.circle_household_members(user_id, status);
create index circle_records_household_idx on public.circle_records(household_id, kind, created_at desc);
create index circle_records_due_idx on public.circle_records(household_id, due_at) where due_at is not null;

create or replace function public.circle_is_member(target_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_household_members
    where household_id = target_household_id
      and user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function public.circle_can_manage(target_household_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.circle_household_members
    where household_id = target_household_id
      and user_id = auth.uid()
      and status = 'active'
      and role in ('owner', 'admin')
  );
$$;

create or replace function public.circle_create_household(
  household_name text,
  household_city text default '',
  household_family_shape text default 'family'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  member_name text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;
  if char_length(trim(household_name)) < 1 then
    raise exception 'household_name_required';
  end if;

  select coalesce(nullif(display_name, ''), split_part(coalesce(auth.jwt() ->> 'email', 'Moi'), '@', 1))
    into member_name
    from public.circle_profiles
    where id = auth.uid();

  insert into public.circle_households(owner_id, name, city, family_shape)
  values (auth.uid(), trim(household_name), trim(household_city), household_family_shape)
  returning id into new_household_id;

  insert into public.circle_household_members(household_id, user_id, display_name, role, permissions)
  values (new_household_id, auth.uid(), coalesce(member_name, 'Moi'), 'owner', array['people', 'calendar', 'home', 'finance', 'documents', 'settings']);

  return new_household_id;
end;
$$;

create or replace function public.circle_create_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.circle_profiles(id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger circle_auth_profile
  after insert on auth.users
  for each row execute function public.circle_create_profile();

create trigger circle_profiles_updated_at before update on public.circle_profiles
  for each row execute function public.circle_set_updated_at();
create trigger circle_households_updated_at before update on public.circle_households
  for each row execute function public.circle_set_updated_at();
create trigger circle_members_updated_at before update on public.circle_household_members
  for each row execute function public.circle_set_updated_at();
create trigger circle_records_updated_at before update on public.circle_records
  for each row execute function public.circle_set_updated_at();

alter table public.circle_profiles enable row level security;
alter table public.circle_households enable row level security;
alter table public.circle_household_members enable row level security;
alter table public.circle_records enable row level security;

create policy "profiles_read_self" on public.circle_profiles
  for select using (id = auth.uid());
create policy "profiles_update_self" on public.circle_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "households_read_members" on public.circle_households
  for select using (public.circle_is_member(id));
create policy "households_update_managers" on public.circle_households
  for update using (public.circle_can_manage(id)) with check (public.circle_can_manage(id));

create policy "members_read_members" on public.circle_household_members
  for select using (public.circle_is_member(household_id));
create policy "members_manage_managers" on public.circle_household_members
  for all using (public.circle_can_manage(household_id)) with check (public.circle_can_manage(household_id));

create policy "records_read_members" on public.circle_records
  for select using (public.circle_is_member(household_id));
create policy "records_create_members" on public.circle_records
  for insert with check (public.circle_is_member(household_id) and created_by = auth.uid());
create policy "records_update_creators_or_managers" on public.circle_records
  for update using (created_by = auth.uid() or public.circle_can_manage(household_id))
  with check (public.circle_is_member(household_id));
create policy "records_delete_creators_or_managers" on public.circle_records
  for delete using (created_by = auth.uid() or public.circle_can_manage(household_id));

grant execute on function public.circle_create_household(text, text, text) to authenticated;
grant execute on function public.circle_is_member(uuid) to authenticated;
grant execute on function public.circle_can_manage(uuid) to authenticated;
grant select, update on public.circle_profiles to authenticated;
grant select, update on public.circle_households to authenticated;
grant select, insert, update, delete on public.circle_household_members to authenticated;
grant select, insert, update, delete on public.circle_records to authenticated;

alter publication supabase_realtime add table public.circle_records;
