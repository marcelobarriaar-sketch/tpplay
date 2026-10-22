begin;
create table if not exists public.module_settings (
 id text primary key,
 objectives jsonb not null default '[]'::jsonb check (jsonb_typeof(objectives)='array'),
 mission_order jsonb not null default '[]'::jsonb check (jsonb_typeof(mission_order)='array'),
 updated_at timestamptz not null default now()
);
alter table public.module_settings enable row level security;
revoke all on public.module_settings from anon, authenticated;
grant all on public.module_settings to service_role;
commit;
