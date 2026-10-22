begin;
alter table public.profiles drop constraint if exists profiles_name_check;
alter table public.profiles add constraint profiles_name_check check(length(name) between 2 and 121);
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check(role in ('student','teacher','institution_admin','admin'));
alter table public.profiles add column first_name text not null default '';
alter table public.profiles add column last_name text not null default '';
alter table public.profiles add column email text not null default '';
alter table public.profiles add column status text not null default 'active' check(status in ('active','pending','suspended'));
alter table public.profiles add column created_at timestamptz not null default now();
alter table public.profiles add column updated_at timestamptz not null default now();
alter table public.profiles add column last_login_at timestamptz;
alter table public.profiles add column email_verified boolean not null default false;
alter table public.profiles add column terms_version text;
alter table public.profiles add column terms_accepted_at timestamptz;
update public.profiles set status=case when active then 'active' else 'suspended' end;
update public.profiles p set created_at=coalesce((to_jsonb(u)->>'created_at')::timestamptz,p.created_at),email=coalesce(to_jsonb(u)->>'email',''),email_verified=(to_jsonb(u)->>'email_confirmed_at') is not null,last_login_at=(to_jsonb(u)->>'last_sign_in_at')::timestamptz from auth.users u where u.id=p.id;
update public.profiles set first_name=split_part(name,' ',1),last_name=trim(substr(name,length(split_part(name,' ',1))+1));
create or replace function public.create_student_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare city uuid;school uuid;f text;l text;r text;
begin
 if new.raw_app_meta_data->>'tpplay_admin_contact'='true' then return new;end if;
 f:=trim(coalesce(new.raw_user_meta_data->>'first_name',''));l:=trim(coalesce(new.raw_user_meta_data->>'last_name',''));
 if length(f)<2 or length(f)>60 or length(l)<2 or length(l)>60 then raise exception 'Invalid name';end if;
 r:=coalesce(new.raw_user_meta_data->>'initial_role','student');if r not in ('student','teacher') then raise exception 'Public role denied';end if;
 if new.raw_user_meta_data->>'terms_version' is distinct from '2026-10' then raise exception 'Terms and surname required';end if;
 city:=nullif(new.raw_user_meta_data->>'city_id','')::uuid;school:=nullif(new.raw_user_meta_data->>'school_id','')::uuid;
 if city is not null and not exists(select 1 from cities where id=city) then raise exception 'Invalid city';end if;
 if school is not null and not exists(select 1 from schools where id=school and (city is null or city_id=city)) then raise exception 'Invalid school';end if;
 insert into profiles(id,name,first_name,last_name,email,city_id,school_id,role,terms_version,terms_accepted_at) values(new.id,trim(f||' '||l),f,l,coalesce(to_jsonb(new)->>'email',''),city,school,r,new.raw_user_meta_data->>'terms_version',case when new.raw_user_meta_data->>'terms_version'='2026-10' then now() end);
 if school is null and city is not null and length(trim(coalesce(new.raw_user_meta_data->>'requested_school','')))>1 then
 insert into school_requests(student_id,city_id,name) values(new.id,city,trim(new.raw_user_meta_data->>'requested_school'));end if;
 return new;
end;$$;
create function public.sync_identity() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 update profiles set email=coalesce(to_jsonb(new)->>'email',''),email_verified=(to_jsonb(new)->>'email_confirmed_at') is not null,last_login_at=(to_jsonb(new)->>'last_sign_in_at')::timestamptz,updated_at=now() where id=new.id;return new;end;$$;
create trigger identity_updated after update on auth.users for each row execute function public.sync_identity();
create function public.profile_stamp() returns trigger language plpgsql as $$begin new.active:=new.status='active';new.updated_at:=now();return new;end;$$;
create trigger profile_stamped before update on profiles for each row execute function public.profile_stamp();
create index profiles_filter on profiles(role,status,created_at desc);
create index profiles_school on profiles(school_id);
create table public.mission_attempts(id uuid primary key,student_id uuid not null references profiles on delete cascade,mission_id text not null,content_version text not null,state jsonb not null,revision integer not null default 0,score integer not null default 0,started_at timestamptz not null default now(),last_activity_at timestamptz not null default now(),completed_at timestamptz,source text not null default 'server' check(source in ('server','local_import')));
create unique index one_mission_draft on mission_attempts(student_id,mission_id) where completed_at is null;
create index attempts_student on mission_attempts(student_id,last_activity_at desc);
create table public.mission_events(student_id uuid references profiles on delete cascade,event_id uuid not null,attempt_id uuid not null references mission_attempts on delete cascade,created_at timestamptz not null default now(),primary key(student_id,event_id));
create table public.mission_progress(student_id uuid references profiles on delete cascade,mission_id text not null,status text not null check(status in ('not_started','in_progress','completed')),progress_percentage integer not null check(progress_percentage between 0 and 100),current_step integer not null default 0,attempts integer not null default 0,xp_earned integer not null default 0,started_at timestamptz not null default now(),last_activity_at timestamptz not null default now(),completed_at timestamptz,version text not null,primary key(student_id,mission_id));
create table public.xp_events(student_id uuid references profiles on delete cascade,mission_id text not null,rule text not null,amount integer not null check(amount between 0 and 150),created_at timestamptz not null default now(),primary key(student_id,mission_id,rule));
create table public.achievements(code text primary key,name text not null,description text not null,icon text not null,condition jsonb not null,active boolean not null default true);
insert into achievements values('first','Primera misión','Completaste tu primera misión.','flag','{"completed":1}',true),('xp100','100 XP','Alcanzaste tus primeros 100 XP.','sparkles','{"xp":100}',true),('three','Tres misiones','Completaste tres misiones distintas.','trophy','{"completed":3}',true);
create table public.user_achievements(student_id uuid references profiles on delete cascade,achievement_code text references achievements,unlocked_at timestamptz not null default now(),primary key(student_id,achievement_code));
create table public.local_imports(student_id uuid references profiles on delete cascade,source text not null,source_id text not null,created_at timestamptz not null default now(),primary key(student_id,source,source_id));
create table public.assignments(id uuid primary key default gen_random_uuid(),course_id uuid references courses not null,mission_id text not null,due_at timestamptz,created_by uuid references profiles not null,created_at timestamptz not null default now());
create table public.submissions(id uuid primary key default gen_random_uuid(),assignment_id uuid references assignments not null,student_id uuid references profiles not null,attempt_id uuid references mission_attempts,submitted_at timestamptz not null default now(),unique(assignment_id,student_id));
create table public.feedback(id uuid primary key default gen_random_uuid(),submission_id uuid references submissions not null,teacher_id uuid references profiles not null,body text not null,created_at timestamptz not null default now());
create table public.subscriptions(id uuid primary key default gen_random_uuid(),school_id uuid references schools not null,plan text not null,status text not null default 'pending',expires_at timestamptz);
create index assignments_course on assignments(course_id);
create index submissions_student on submissions(student_id);
create index feedback_submission on feedback(submission_id);
create index subscriptions_school on subscriptions(school_id);
create function public.unlock_achievements(p_student uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare xp integer;n integer;begin
 select coalesce(sum(amount),0) into xp from xp_events where student_id=p_student;select count(*) into n from mission_progress where student_id=p_student and status='completed';
 insert into user_achievements(student_id,achievement_code) select p_student,code from achievements where active and (not(condition ? 'xp') or xp >= (condition->>'xp')::integer) and (not(condition ? 'completed') or n >= (condition->>'completed')::integer) on conflict do nothing;end;$$;
create function public.commit_mission(p_student uuid,p_id uuid,p_mission text,p_version text,p_revision integer,p_state jsonb,p_score integer,p_steps integer,p_event uuid,p_import boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare a mission_attempts;original_score integer;done boolean;pct integer;
begin
 perform pg_advisory_xact_lock(hashtextextended(p_student::text,0));
 if not exists(select 1 from profiles where id=p_student and role='student' and active and status='active') then raise exception 'DENIED';end if;
 select * into a from mission_attempts where id=p_id;
 if a.id is not null and a.student_id<>p_student then raise exception 'DENIED';end if;
 if exists(select 1 from mission_events where student_id=p_student and event_id=p_event) then return jsonb_build_object('state',a.state,'revision',a.revision);end if;
 if coalesce(a.revision,0)<>p_revision then raise exception 'REVISION_CONFLICT';end if;
 if a.completed_at is not null then raise exception 'COMPLETED_IMMUTABLE';end if;
 done:=p_state->>'completedAt' is not null;pct:=case when done then 100 else least(99,((p_state->>'index')::integer*100)/(p_steps+1)) end;
 insert into mission_attempts(id,student_id,mission_id,content_version,state,revision,score,completed_at,source) values(p_id,p_student,p_mission,p_version,p_state,p_revision+1,p_score,case when done then now() end,case when p_import then 'local_import' else 'server' end) on conflict(id) do update set state=excluded.state,revision=excluded.revision,score=excluded.score,last_activity_at=now(),completed_at=excluded.completed_at returning * into a;
 insert into mission_events(student_id,event_id,attempt_id) values(p_student,p_event,p_id);
 if p_import then insert into local_imports values(p_student,'demo',p_id,now()) on conflict do nothing;end if;
 if done then
 select score into original_score from mission_attempts where student_id=p_student and mission_id=p_mission and completed_at is not null and id<>p_id order by completed_at,id limit 1;
 insert into xp_events(student_id,mission_id,rule,amount) values(p_student,p_mission,'first',100) on conflict do nothing;
 if original_score is not null and p_score>original_score then insert into xp_events(student_id,mission_id,rule,amount) values(p_student,p_mission,'improve',50) on conflict do nothing;end if;end if;
 insert into mission_progress(student_id,mission_id,status,progress_percentage,current_step,attempts,xp_earned,completed_at,version) values(p_student,p_mission,case when done then 'completed' else 'in_progress' end,pct,(p_state->>'index')::integer,1,(select coalesce(sum(amount),0) from xp_events where student_id=p_student and mission_id=p_mission),case when done then now() end,p_version)
 on conflict(student_id,mission_id) do update set status=case when mission_progress.status='completed' then 'completed' else excluded.status end,progress_percentage=greatest(mission_progress.progress_percentage,excluded.progress_percentage),current_step=excluded.current_step,attempts=(select count(*) from mission_attempts where student_id=p_student and mission_id=p_mission),xp_earned=excluded.xp_earned,last_activity_at=now(),completed_at=coalesce(mission_progress.completed_at,excluded.completed_at),version=excluded.version;
 perform unlock_achievements(p_student);return jsonb_build_object('state',a.state,'revision',a.revision);
end;$$;
create table public.api_limits(bucket text primary key,count integer not null,expires_at timestamptz not null);
create function public.consume_limit(p_bucket text,p_max integer,p_seconds integer) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$declare n integer;begin
 insert into api_limits values(p_bucket,1,now()+make_interval(secs=>p_seconds)) on conflict(bucket) do update set count=case when api_limits.expires_at<now() then 1 else api_limits.count+1 end,expires_at=case when api_limits.expires_at<now() then excluded.expires_at else api_limits.expires_at end returning count into n;
 delete from api_limits where expires_at<now()-interval '1 day';return n<=p_max;end;$$;
-- No browser role can write or execute these server-owned mutations.
do $$declare t text;begin foreach t in array array['mission_attempts','mission_events','mission_progress','xp_events','achievements','user_achievements','local_imports','assignments','submissions','feedback','subscriptions','api_limits'] loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon,authenticated',t);execute format('grant all on public.%I to service_role',t);end loop;end$$;
grant select on mission_attempts,mission_progress,xp_events,user_achievements to authenticated;
create policy own_attempt on mission_attempts for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
create policy own_mission on mission_progress for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
create policy own_xp on xp_events for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
create policy own_achievement on user_achievements for select to authenticated using(student_id=auth.uid() and exists(select 1 from profiles where id=auth.uid() and active));
revoke execute on function unlock_achievements(uuid),commit_mission(uuid,uuid,text,text,integer,jsonb,integer,integer,uuid,boolean),consume_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function unlock_achievements(uuid),commit_mission(uuid,uuid,text,text,integer,jsonb,integer,integer,uuid,boolean),consume_limit(text,integer,integer) to service_role;
commit;
