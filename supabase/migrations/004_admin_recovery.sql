begin;
create table if not exists public.admin_recovery (
 id text primary key check(id='primary'),
 auth_user_id uuid not null unique references auth.users(id) on delete restrict,
 updated_at timestamptz not null default now()
);
alter table public.admin_recovery enable row level security;
revoke all on public.admin_recovery from anon,authenticated;
grant all on public.admin_recovery to service_role;
commit;
