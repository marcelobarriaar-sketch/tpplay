-- Academic identities augment existing accounts/courses; no historical data is removed.
begin;
create or replace function public.class_key(value text) returns text language sql immutable strict as $$
 select trim(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(regexp_replace(registry_name(value),'\m(primero|primer)\M','1','g'),'\msegundo\M','2','g'),'\mtercero\M','3','g'),'\mcuarto\M','4','g'),'[°º.]','','g'),'\s+',' ','g'));
$$;
create table public.subjects(id uuid primary key default gen_random_uuid(),name text not null check(length(name) between 2 and 120),name_key text generated always as (registry_name(name)) stored unique);
create table public.class_groups(id uuid primary key default gen_random_uuid(),school_id uuid not null references schools,school_year int not null check(school_year between 2020 and 2100),name text not null check(length(name) between 2 and 120),name_key text generated always as (class_key(name)) stored,unique(school_id,school_year,name_key));
create table public.teaching_assignments(id uuid primary key default gen_random_uuid(),teacher_id uuid not null references profiles,group_id uuid not null references class_groups,subject_id uuid not null references subjects,status text not null default 'pending' check(status in ('pending','approved','rejected')),approved_by uuid references profiles,created_at timestamptz not null default now(),unique(teacher_id,group_id,subject_id));
create table public.academic_enrollments(id uuid primary key default gen_random_uuid(),student_id uuid not null references profiles,group_id uuid not null references class_groups,subject_id uuid not null references subjects,created_at timestamptz not null default now(),unique(student_id,group_id,subject_id));
alter table public.profiles add column active_enrollment_id uuid references academic_enrollments;
create table public.challenge_subjects(mission_id text not null,subject_id uuid not null references subjects,primary key(mission_id,subject_id));
create table public.grading_scales(mission_id text primary key,minimum numeric not null default 0,optimum numeric not null check(optimum>minimum),grade_min numeric not null default 1 check(grade_min>=1),grade_pass numeric not null default 4,grade_max numeric not null default 7 check(grade_max<=7),requirement numeric not null default .6 check(requirement>0 and requirement<1),metric text not null check(metric in ('money','performance')),version int not null default 1,updated_by uuid references profiles,updated_at timestamptz not null default now(),check(grade_min<grade_pass and grade_pass<grade_max));
create table public.academic_results(id uuid primary key default gen_random_uuid(),attempt_id uuid references mission_attempts unique,game_id text,student_id uuid not null references profiles,enrollment_id uuid not null references academic_enrollments,mission_id text not null,status text not null,score numeric,maximum numeric,money_gained numeric,money_lost numeric,achievement numeric,grade numeric,scale jsonb,state_snapshot jsonb,recorded_at timestamptz not null default now(),foreign key(student_id,game_id) references game_progress(student_id,game_id),unique(student_id,enrollment_id,game_id));
create view academic_gradebook with (security_invoker=true) as select distinct on (enrollment_id,mission_id) * from academic_results order by enrollment_id,mission_id,(status='completed') desc,grade desc nulls last,recorded_at desc,id;
revoke all on academic_gradebook from anon,authenticated;grant select on academic_gradebook to service_role;
create index academic_roster on academic_enrollments(group_id,subject_id,student_id);
create index academic_teacher on teaching_assignments(teacher_id,status,group_id,subject_id);
create index academic_history on academic_results(enrollment_id,mission_id,recorded_at desc);
alter table public.mission_attempts add column academic_enrollment_id uuid references academic_enrollments;
create function public.chilean_grade(score numeric,minimum numeric,optimum numeric,requirement numeric default .6,grade_min numeric default 1,grade_pass numeric default 4,grade_max numeric default 7) returns numeric language plpgsql immutable as $$
declare ratio numeric;
begin
 if score is null then return null;end if;
 if optimum<=minimum or requirement<=0 or requirement>=1 or grade_min<1 or grade_max>7 or grade_min>=grade_pass or grade_pass>=grade_max then raise exception 'INVALID_SCALE';end if;
 ratio:=greatest(0,least(1,(score-minimum)/(optimum-minimum)));
 return case when ratio<=requirement then grade_min+(grade_pass-grade_min)*ratio/requirement else grade_pass+(grade_max-grade_pass)*(ratio-requirement)/(1-requirement) end;
end;$$;
-- Settings are data, not frontend constants. All published challenge IDs are supplied by the server registry.
insert into subjects(name) values('Gestión Comercial y Tributaria'),('Administración'),('Empleabilidad'),('Agropecuaria') on conflict do nothing;
insert into challenge_subjects select 'inicio-actividades',id from subjects where name='Gestión Comercial y Tributaria';
insert into grading_scales(mission_id,minimum,optimum,metric) values('inicio-actividades',0,300,'money');
create function public.save_academic_setup(p_user uuid,p_data jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare p profiles;s uuid;yr int;item jsonb;gid uuid;sid uuid;eid uuid;ids jsonb:='[]';nm text;
begin
 select * into p from profiles where id=p_user and active for update;
 if p.id is null or p.role not in ('teacher','student','admin') then raise exception 'DENIED';end if;
 s:=(p_data->>'school_id')::uuid;yr:=(p_data->>'year')::int;
 if not exists(select 1 from schools where id=s) or yr not between 2020 and 2100 or jsonb_typeof(p_data->'pairs')<>'array' or jsonb_array_length(p_data->'pairs') not between 1 and 20 then raise exception 'INVALID_ACADEMIC_SETUP';end if;
 for item in select * from jsonb_array_elements(p_data->'pairs') loop
   if p.role='student' then
     gid:=(item->>'group_id')::uuid;sid:=(item->>'subject_id')::uuid;
     if not exists(select 1 from class_groups where id=gid and school_id=s and school_year=yr) or not exists(select 1 from teaching_assignments where group_id=gid and subject_id=sid and status='approved') then raise exception 'GROUP_NOT_AVAILABLE';end if;
     insert into academic_enrollments(student_id,group_id,subject_id) values(p_user,gid,sid) on conflict(student_id,group_id,subject_id) do update set student_id=excluded.student_id returning id into eid;
     ids:=ids||to_jsonb(eid);
   else
     nm:=trim(item->>'group_name');if length(nm) not between 2 and 120 then raise exception 'INVALID_GROUP';end if;
     insert into class_groups(school_id,school_year,name) values(s,yr,nm) on conflict(school_id,school_year,name_key) do update set name=class_groups.name returning id into gid;
     nm:=trim(item->>'subject_name');if length(nm) not between 2 and 120 then raise exception 'INVALID_SUBJECT';end if;
     insert into subjects(name) values(nm) on conflict(name_key) do update set name=subjects.name returning id into sid;
     insert into teaching_assignments(teacher_id,group_id,subject_id,status,approved_by) values(p_user,gid,sid,case when p.role='admin' then 'approved' else 'pending' end,case when p.role='admin' then p_user end) on conflict(teacher_id,group_id,subject_id) do nothing;
   end if;
 end loop;
 update profiles set school_id=s,city_id=(select city_id from schools where id=s),active_enrollment_id=case when p.role='student' then (ids->>0)::uuid else active_enrollment_id end where id=p_user;
 return jsonb_build_object('ok',true,'enrollments',ids);
end;$$;
create function public.academic_registration() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare payload jsonb;
begin
 select raw_user_meta_data->'academic_setup' into payload from auth.users where id=new.id;
 if payload is not null and payload<>'null'::jsonb then perform save_academic_setup(new.id,payload);end if;
 return new;
end;$$;
create trigger academic_after_profile after insert on profiles for each row execute function academic_registration();
create function public.capture_academic_attempt() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare eid uuid;
begin
 if tg_op='INSERT' or old.academic_enrollment_id is null then
 select active_enrollment_id into eid from profiles where id=new.student_id;
 if exists(select 1 from academic_enrollments e join challenge_subjects cs on cs.subject_id=e.subject_id and cs.mission_id=new.mission_id where e.id=eid and e.student_id=new.student_id) then new.academic_enrollment_id:=eid;end if;
 else new.academic_enrollment_id:=old.academic_enrollment_id;end if;
 return new;
end;$$;
create trigger capture_academic before insert or update on mission_attempts for each row execute function capture_academic_attempt();
-- Scores passed here are derived by the server from actual game state, never from a client-supplied grade.
create function public.record_academic_result(p_attempt uuid,p_score numeric,p_gained numeric,p_lost numeric) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare a mission_attempts;s grading_scales;prior academic_results;snapshot jsonb;
begin
 select * into a from mission_attempts where id=p_attempt;
 if a.academic_enrollment_id is null then return;end if;
 select * into s from grading_scales where mission_id=a.mission_id;
 if s.mission_id is null then raise exception 'SCALE_NOT_CONFIGURED';end if;
 select * into prior from academic_results where attempt_id=p_attempt;
 if prior.status='completed' then return;end if;
 snapshot:=coalesce(prior.scale,to_jsonb(s));
 insert into academic_results(attempt_id,student_id,enrollment_id,mission_id,status,score,maximum,money_gained,money_lost,achievement,grade,scale,recorded_at)
 values(a.id,a.student_id,a.academic_enrollment_id,a.mission_id,case when a.completed_at is null then 'in_progress' else 'completed' end,p_score,(snapshot->>'optimum')::numeric,p_gained,p_lost,
 greatest(0,least(100,(p_score-(snapshot->>'minimum')::numeric)/((snapshot->>'optimum')::numeric-(snapshot->>'minimum')::numeric)*100)),
 case when a.completed_at is not null then chilean_grade(p_score,(snapshot->>'minimum')::numeric,(snapshot->>'optimum')::numeric,(snapshot->>'requirement')::numeric,(snapshot->>'grade_min')::numeric,(snapshot->>'grade_pass')::numeric,(snapshot->>'grade_max')::numeric) end,snapshot,now())
 on conflict(attempt_id) do update set status=excluded.status,score=excluded.score,money_gained=excluded.money_gained,money_lost=excluded.money_lost,achievement=excluded.achievement,grade=excluded.grade,recorded_at=excluded.recorded_at;
end;$$;
create function public.grade_saved_attempt() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare metric text;val numeric;
begin
 if new.academic_enrollment_id is null then return new;end if;
 select coalesce(r.scale->>'metric',s.metric) into metric from grading_scales s left join academic_results r on r.attempt_id=new.id where s.mission_id=new.mission_id;
 if metric is null then return new;end if;
 val:=case when metric='money' then (new.state->'financialResult'->>'balance')::numeric else new.score end;
 perform record_academic_result(new.id,val,(new.state->'financialResult'->>'gained')::numeric,(new.state->'financialResult'->>'spent')::numeric);
 return new;
end;$$;
create trigger grade_after_attempt after insert or update on mission_attempts for each row execute function grade_saved_attempt();
alter table public.game_progress add column academic_enrollment_id uuid references academic_enrollments;
create function public.capture_academic_game() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare eid uuid;
begin
 if tg_op='UPDATE' and old.academic_enrollment_id is not null then new.academic_enrollment_id:=old.academic_enrollment_id;return new;end if;
 select active_enrollment_id into eid from profiles where id=new.student_id;
 if exists(select 1 from academic_enrollments e join challenge_subjects cs on cs.subject_id=e.subject_id and cs.mission_id=new.game_id where e.id=eid and e.student_id=new.student_id) then new.academic_enrollment_id:=eid;end if;
 return new;
end;$$;
create trigger capture_game_academic before insert or update on game_progress for each row execute function capture_academic_game();
create function public.grade_saved_game() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare e uuid;s grading_scales;snapshot jsonb;score numeric;done boolean;
begin
 e:=new.academic_enrollment_id;
 if not exists(select 1 from academic_enrollments ae join challenge_subjects cs on cs.subject_id=ae.subject_id and cs.mission_id=new.game_id where ae.id=e and ae.student_id=new.student_id) then return new;end if;
 new.academic_enrollment_id:=e;
 select * into s from grading_scales where mission_id=new.game_id;
 if s.mission_id is null or s.metric<>'performance' then return new;end if;
 select r.scale into snapshot from academic_results r where student_id=new.student_id and enrollment_id=e and game_id=new.game_id;
 snapshot:=coalesce(snapshot,to_jsonb(s));score:=(new.state->'academicPerformance'->>'score')::numeric;done:=coalesce((new.state->'academicPerformance'->>'completed')::boolean,false);
 -- This is an AFTER trigger: no mutation of the underlying progress row is attempted.
 insert into academic_results(student_id,enrollment_id,mission_id,game_id,status,score,maximum,achievement,grade,scale,state_snapshot)
 values(new.student_id,e,new.game_id,new.game_id,case when done then 'completed' else 'in_progress' end,score,(snapshot->>'optimum')::numeric,greatest(0,least(100,(score-(snapshot->>'minimum')::numeric)/((snapshot->>'optimum')::numeric-(snapshot->>'minimum')::numeric)*100)),case when done then chilean_grade(score,(snapshot->>'minimum')::numeric,(snapshot->>'optimum')::numeric,(snapshot->>'requirement')::numeric,(snapshot->>'grade_min')::numeric,(snapshot->>'grade_pass')::numeric,(snapshot->>'grade_max')::numeric) end,snapshot,new.state)
 on conflict(student_id,enrollment_id,game_id) do update set status=case when academic_results.status='completed' then 'completed' else excluded.status end,score=case when academic_results.status='completed' and academic_results.score>=excluded.score then academic_results.score else excluded.score end,grade=greatest(academic_results.grade,excluded.grade),achievement=greatest(academic_results.achievement,excluded.achievement),recorded_at=now(),state_snapshot=case when excluded.grade>=academic_results.grade or academic_results.grade is null then excluded.state_snapshot else academic_results.state_snapshot end where academic_results.status<>'completed' or academic_results.grade is null or excluded.grade>academic_results.grade;
 return new;
end;$$;
create trigger grade_after_game after insert or update on game_progress for each row execute function grade_saved_game();
do $$declare t text;begin foreach t in array array['subjects','class_groups','teaching_assignments','academic_enrollments','challenge_subjects','grading_scales','academic_results'] loop execute format('alter table %I enable row level security',t);execute format('revoke all on %I from anon,authenticated',t);execute format('grant all on %I to service_role',t);end loop;end$$;
revoke execute on function save_academic_setup(uuid,jsonb),record_academic_result(uuid,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function save_academic_setup(uuid,jsonb),record_academic_result(uuid,numeric,numeric,numeric) to service_role;
insert into grading_scales(mission_id,optimum,metric) values('mision-iva',3,'performance') on conflict do nothing;
insert into challenge_subjects select 'mision-iva',id from subjects where name='Gestión Comercial y Tributaria' on conflict do nothing;
insert into grading_scales(mission_id,optimum,metric) values('rescate-invernadero',3,'performance') on conflict do nothing;
insert into challenge_subjects select 'rescate-invernadero',id from subjects where name='Agropecuaria' on conflict do nothing;
insert into grading_scales(mission_id,optimum,metric) values('primera-entrevista',3,'performance') on conflict do nothing;
insert into challenge_subjects select 'primera-entrevista',id from subjects where name='Empleabilidad' on conflict do nothing;
insert into grading_scales(mission_id,optimum,metric) values('mision-tributos',100,'performance');
insert into challenge_subjects select 'mision-tributos',id from subjects where name='Gestión Comercial y Tributaria';

commit;
