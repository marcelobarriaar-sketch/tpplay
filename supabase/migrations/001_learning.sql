-- Run once in Supabase SQL Editor. No passwords are stored in application tables.
begin;
create table public.cities(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.schools(id uuid primary key default gen_random_uuid(),city_id uuid not null references public.cities,name text not null,unique(city_id,name));
create table public.profiles(id uuid primary key references auth.users on delete cascade,name text not null check(length(name) between 2 and 120),city_id uuid references public.cities,school_id uuid references public.schools,role text not null default 'student' check(role in ('student','teacher','admin')),active boolean not null default true);
create table public.school_requests(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles,city_id uuid not null references public.cities,name text not null check(length(name) between 2 and 160),status text not null default 'pending' check(status in ('pending','approved','rejected')),created_at timestamptz not null default now());
create table public.courses(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references public.profiles,school_id uuid not null references public.schools,name text not null check(length(name) between 2 and 120),active boolean not null default true);
create table public.memberships(course_id uuid references public.courses on delete cascade,student_id uuid references public.profiles on delete cascade,primary key(course_id,student_id));
create table public.invitations(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses on delete cascade,code_hash text not null unique,expires_at timestamptz not null,uses integer not null default 0,max_uses integer not null check(max_uses between 1 and 500));
create table public.game_progress(student_id uuid references public.profiles on delete cascade,game_id text not null,content_version integer not null,revision integer not null default 0,state jsonb not null,updated_at timestamptz not null default now(),primary key(student_id,game_id));
create table public.evidence(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.profiles on delete cascade,game_id text not null,mission_id text,content_version integer not null,event_id uuid not null,event jsonb not null,details jsonb not null,created_at timestamptz not null default now(),unique(student_id,event_id));
create table public.rubrics(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses,version integer not null,definition jsonb not null,created_at timestamptz not null default now(),unique(course_id,version));
create table public.evaluations(id uuid primary key default gen_random_uuid(),course_id uuid not null references public.courses,student_id uuid not null references public.profiles,teacher_id uuid not null references public.profiles,rubric jsonb not null,ratings jsonb not null,comments jsonb not null,overall text not null default '',published boolean not null default false,published_at timestamptz,updated_at timestamptz not null default now(),unique(course_id,student_id));
create table public.audit(id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles,action text not null,target_id text,details jsonb not null default '{}',created_at timestamptz not null default now());
-- Stable seed IDs; establishments are added/approved by the administrator (not guessed).
insert into public.cities(id,name) values
 ('11111111-1111-4111-8111-111111111111','Puerto Montt'),('22222222-2222-4222-8222-222222222222','Puerto Varas'),('33333333-3333-4333-8333-333333333333','Osorno'),('44444444-4444-4444-8444-444444444444','Castro'),('55555555-5555-4555-8555-555555555555','Ancud');
create function public.create_student_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare city uuid;school uuid;
begin
 city:=nullif(new.raw_user_meta_data->>'city_id','')::uuid;school:=nullif(new.raw_user_meta_data->>'school_id','')::uuid;
 if city is null or not exists(select 1 from cities where id=city) then raise exception 'Invalid city';end if;
 if school is not null and not exists(select 1 from schools where id=school and city_id=city) then raise exception 'Invalid school';end if;
 insert into profiles(id,name,city_id,school_id,role) values(new.id,trim(new.raw_user_meta_data->>'name'),city,school,'student');
 if school is null then
  insert into school_requests(student_id,city_id,name) values(new.id,city,trim(new.raw_user_meta_data->>'requested_school'));
 end if;
 return new;
end;$$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.create_student_profile();
-- Authenticated clients may read only their own published records. All writes use the server.
do $$ declare t text;begin foreach t in array array['cities','schools','profiles','school_requests','courses','memberships','invitations','game_progress','evidence','rubrics','evaluations','audit'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);end loop;end $$;
grant select on public.profiles,public.game_progress,public.evidence,public.evaluations to authenticated;
create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());
create policy own_progress on public.game_progress for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
create policy own_evidence on public.evidence for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
create policy published_feedback on public.evaluations for select to authenticated using(student_id=auth.uid() and published and exists(select 1 from profiles where id=auth.uid() and active));
-- An optimistic revision and event UUID prevent races and duplicate attempts across devices.
create function public.commit_game(p_student uuid,p_game text,p_version integer,p_revision integer,p_state jsonb,p_event_id uuid,p_event jsonb,p_details jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r game_progress;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_student::text||p_game,0));
 select * into r from game_progress where student_id=p_student and game_id=p_game for update;
 if exists(select 1 from evidence where student_id=p_student and event_id=p_event_id) then return jsonb_build_object('state',r.state,'revision',r.revision);end if;
 if coalesce(r.revision,0)<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 insert into game_progress values(p_student,p_game,p_version,p_revision+1,p_state,now()) on conflict(student_id,game_id) do update set state=excluded.state,revision=excluded.revision,content_version=excluded.content_version,updated_at=now();
 insert into evidence(student_id,game_id,mission_id,content_version,event_id,event,details) values(p_student,p_game,p_details->>'mission_id',p_version,p_event_id,p_event,p_details);
 return jsonb_build_object('state',p_state,'revision',p_revision+1);
end;$$;
create function public.join_course(p_student uuid,p_hash text) returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare i invitations;c uuid;
begin
 select * into i from invitations where code_hash=p_hash for update;
 if i.id is null or i.expires_at<=now() or i.uses>=i.max_uses or not exists(select 1 from courses where id=i.course_id and active) then raise exception 'INVITATION_INVALID';end if;
 if not exists(select 1 from profiles where id=p_student and role='student' and active) then raise exception 'DENIED';end if;
 insert into memberships values(i.course_id,p_student) on conflict do nothing;
 if found then update invitations set uses=uses+1 where id=i.id;end if;
 return i.course_id;
end;$$;
revoke execute on function public.commit_game(uuid,text,integer,integer,jsonb,uuid,jsonb,jsonb) from public,anon,authenticated;
revoke execute on function public.join_course(uuid,text) from public,anon,authenticated;
grant execute on function public.commit_game(uuid,text,integer,integer,jsonb,uuid,jsonb,jsonb),public.join_course(uuid,text) to service_role;

-- Normalize spelling variants to prevent duplicate city/school records.
create function public.registry_name(value text) returns text language sql immutable strict as $$
 select lower(regexp_replace(trim(translate(value,'ÁÉÍÓÚÜÑáéíóúüñ','AEIOUUNaeiouun')),'\s+',' ','g'));
$$;
create unique index cities_normalized on public.cities(public.registry_name(name));
create unique index schools_normalized on public.schools(city_id,public.registry_name(name));
-- Service access is explicit; clients cannot directly execute protected mutations.
grant all on public.cities,public.schools,public.profiles,public.school_requests,public.courses,public.memberships,public.invitations,public.game_progress,public.evidence,public.rubrics,public.evaluations,public.audit to service_role;
-- Immutable rubric versions and published feedback also withstand concurrent requests.
create function public.preserve_evaluation() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
 if old.published then raise exception 'Published evaluation is immutable';end if;
 if new.rubric<>old.rubric then raise exception 'Evaluation rubric version is immutable';end if;
 return new;
end;$$;
create trigger keep_evaluation before update on public.evaluations for each row execute function public.preserve_evaluation();
create function public.preserve_rubric() returns trigger language plpgsql set search_path=public,pg_temp as $$
begin raise exception 'Rubric versions are immutable';end;$$;
create trigger keep_rubric before update on public.rubrics for each row execute function public.preserve_rubric();
create index evidence_student_game on public.evidence(student_id,game_id,created_at);
create index membership_student on public.memberships(student_id);

-- Administrative account changes and their audit entries form one transaction.
create function public.admin_profile(p_actor uuid,p_target uuid,p_updates jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare current_profile profiles;next_profile profiles;
begin
 perform pg_advisory_xact_lock(hashtextextended('tpplay-admin-accounts',0));
 if not exists(select 1 from profiles where id=p_actor and role='admin' and active) or p_actor=p_target then raise exception 'DENIED';end if;
 if exists(select 1 from jsonb_object_keys(p_updates) k where k not in ('name','city_id','school_id','role','active')) then raise exception 'Invalid fields';end if;
 select * into current_profile from profiles where id=p_target for update;
 if current_profile.id is null then raise exception 'Unknown account';end if;
 select * into next_profile from jsonb_populate_record(current_profile,p_updates);
 if next_profile.school_id is not null and not exists(select 1 from schools where id=next_profile.school_id and city_id=next_profile.city_id) then raise exception 'Invalid school/city';end if;
 update profiles set name=next_profile.name,city_id=next_profile.city_id,school_id=next_profile.school_id,role=next_profile.role,active=next_profile.active where id=p_target;
 insert into audit(actor_id,action,target_id,details) values(p_actor,'user.update',p_target::text,jsonb_build_object('fields',(select jsonb_agg(k) from jsonb_object_keys(p_updates) k)));
end;$$;
create function public.admin_membership(p_actor uuid,p_student uuid,p_course uuid,p_remove boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from profiles where id=p_actor and role='admin' and active) or not exists(select 1 from profiles where id=p_student and role='student') then raise exception 'DENIED';end if;
 if p_remove then delete from memberships where student_id=p_student and course_id=p_course;
 else insert into memberships values(p_course,p_student) on conflict do nothing;end if;
 insert into audit(actor_id,action,target_id,details) values(p_actor,case when p_remove then 'membership.remove' else 'membership.assign' end,p_student::text,jsonb_build_object('course_id',p_course));
end;$$;
create function public.approve_school(p_actor uuid,p_request uuid,p_city uuid,p_name text) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r school_requests;school uuid;
begin
 if not exists(select 1 from profiles where id=p_actor and role='admin' and active) then raise exception 'DENIED';end if;
 select * into r from school_requests where id=p_request for update;
 if r.id is null or r.status<>'pending' or r.city_id<>p_city then raise exception 'Invalid request';end if;
 select id into school from schools where city_id=p_city and registry_name(name)=registry_name(p_name);
 if school is null then insert into schools(city_id,name) values(p_city,trim(p_name)) returning id into school;end if;
 update school_requests set status='approved' where id=r.id;
 update profiles set school_id=school,city_id=p_city where id=r.student_id;
 insert into audit(actor_id,action,target_id,details) values(p_actor,'school.approve',r.student_id::text,jsonb_build_object('school_id',school,'request_id',p_request));
end;$$;
revoke execute on function public.admin_profile(uuid,uuid,jsonb),public.admin_membership(uuid,uuid,uuid,boolean),public.approve_school(uuid,uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_profile(uuid,uuid,jsonb),public.admin_membership(uuid,uuid,uuid,boolean),public.approve_school(uuid,uuid,uuid,text) to service_role;
create function public.admin_course(p_actor uuid,p_course uuid,p_teacher uuid,p_school uuid,p_name text,p_active boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if not exists(select 1 from profiles where id=p_actor and role='admin' and active) or not exists(select 1 from profiles where id=p_teacher and role in ('teacher','admin') and active) then raise exception 'DENIED';end if;
 update courses set teacher_id=p_teacher,school_id=p_school,name=p_name,active=p_active where id=p_course;
 if not found then raise exception 'Unknown course';end if;
 insert into audit(actor_id,action,target_id,details) values(p_actor,'course.update',p_course::text,jsonb_build_object('teacher_id',p_teacher,'school_id',p_school,'active',p_active));
end;$$;
revoke execute on function public.admin_course(uuid,uuid,uuid,uuid,text,boolean) from public,anon,authenticated;
grant execute on function public.admin_course(uuid,uuid,uuid,uuid,text,boolean) to service_role;
commit;
