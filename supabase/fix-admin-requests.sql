-- ============================================================
-- Fix: admin cannot see staff approval requests
-- Run ONCE in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1) is_admin() helper — SECURITY DEFINER avoids infinite recursion
--    when profiles policies check the profiles table itself.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'admin'
      and is_active = true
  );
$$;

-- 2) Trigger: auto-create a profiles row for every new auth user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Students live in the students table, not profiles
  -- (profiles_role_check only allows staff roles).
  if coalesce(new.raw_user_meta_data ->> 'role', 'teacher') = 'student' then
    return new;
  end if;

  insert into public.profiles (id, email, full_name, role, is_approved, is_active)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'teacher'),
    false,
    true
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Backfill: create profiles for EXISTING auth users that have none
--    (this makes the staff account you already signed up appear).
insert into public.profiles (id, email, full_name, role, is_approved, is_active)
select
  u.id,
  u.email,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  coalesce(u.raw_user_meta_data ->> 'role', 'teacher'),
  false,
  true
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
  and coalesce(u.raw_user_meta_data ->> 'role', 'teacher') <> 'student'
on conflict (id) do nothing;

-- 4) RLS on profiles: everyone reads their own row, admins read/update all.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin" on public.profiles
  for select using (public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_admin" on public.profiles;
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin())
  with check (public.is_admin());

-- 5) IMPORTANT: if you deleted & re-registered your account after the
--    password change, your new account is a TEACHER. Promote it back
--    to admin (uncomment and set your email):
--
-- update public.profiles
-- set role = 'admin', is_approved = true, is_active = true
-- where email = 'you@example.com';
