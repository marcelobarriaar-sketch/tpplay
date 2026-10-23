begin;
alter table profiles add column onboarding_required boolean not null default false;
create or replace function public.create_student_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare city uuid;school uuid;f text;l text;r text;
begin
 if new.raw_app_meta_data->>'tpplay_admin_contact'='true' then return new;end if;
 f:=trim(coalesce(new.raw_user_meta_data->>'first_name',''));l:=trim(coalesce(new.raw_user_meta_data->>'last_name',''));
 if length(f)<2 or length(f)>60 or length(l)<2 or length(l)>60 then raise exception 'Invalid name';end if;
 r:=coalesce(new.raw_user_meta_data->>'initial_role','student');if r not in ('student','teacher') then raise exception 'Public role denied';end if;
 if new.raw_user_meta_data->>'registration_source'='teacher_excel' and r='student' then
 insert into profiles(id,name,first_name,last_name,email,city_id,school_id,role,onboarding_required) values(new.id,trim(f||' '||l),f,l,coalesce(to_jsonb(new)->>'email',''),null,null,'student',true);
 return new;
 end if;
 if new.raw_user_meta_data->>'terms_version' is distinct from '2026-10' then raise exception 'Terms and surname required';end if;
 city:=nullif(new.raw_user_meta_data->>'city_id','')::uuid;school:=nullif(new.raw_user_meta_data->>'school_id','')::uuid;
 if city is not null and not exists(select 1 from cities where id=city) then raise exception 'Invalid city';end if;
 if school is not null and not exists(select 1 from schools where id=school and (city is null or city_id=city)) then raise exception 'Invalid school';end if;
 insert into profiles(id,name,first_name,last_name,email,city_id,school_id,role,terms_version,terms_accepted_at) values(new.id,trim(f||' '||l),f,l,coalesce(to_jsonb(new)->>'email',''),city,school,r,new.raw_user_meta_data->>'terms_version',case when new.raw_user_meta_data->>'terms_version'='2026-10' then now() end);
 if school is null and city is not null and length(trim(coalesce(new.raw_user_meta_data->>'requested_school','')))>1 then
 insert into school_requests(student_id,city_id,name) values(new.id,city,trim(new.raw_user_meta_data->>'requested_school'));end if;
 return new;
end;$$;

create table roster_imports(id uuid primary key,teacher_id uuid not null references profiles,assignment_id uuid not null references teaching_assignments,fingerprint text not null,created_at timestamptz not null default now());
create table roster_import_rows(id uuid primary key default gen_random_uuid(),import_id uuid not null references roster_imports,position int not null,first_name text not null,last_name text not null,email text not null,status text not null default 'pending' check(status in ('pending','processing','invited','enrolled','error')),message text not null default '',student_id uuid references profiles,lease uuid,updated_at timestamptz not null default now(),unique(import_id,email),unique(import_id,position));
alter table roster_imports enable row level security;alter table roster_import_rows enable row level security;
revoke all on roster_imports,roster_import_rows from anon,authenticated;grant all on roster_imports,roster_import_rows to service_role;
create function claim_roster_row(p_import uuid) returns setof roster_import_rows language sql security definer set search_path=public,pg_temp as $$
 update roster_import_rows set status='processing',lease=gen_random_uuid(),updated_at=now() where id=(select id from roster_import_rows where import_id=p_import and (status='pending' or (status='processing' and updated_at<now()-interval '3 minutes')) order by position for update skip locked limit 1) returning *;
$$;
create function finish_roster_row(p_row uuid,p_lease uuid,p_student uuid,p_invited boolean) returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare r roster_import_rows;b roster_imports;a teaching_assignments;g class_groups;p profiles;eid uuid;
begin
 select * into r from roster_import_rows where id=p_row and lease=p_lease and status='processing' for update;
 if r.id is null then raise exception 'ROSTER_LEASE_EXPIRED';end if;
 select * into b from roster_imports where id=r.import_id;
 select * into a from teaching_assignments where id=b.assignment_id;
 select * into g from class_groups where id=a.group_id;
 select * into p from profiles where id=p_student;
 if a.status<>'approved' or p.role<>'student' or not p.active or p.school_id is distinct from g.school_id then raise exception 'ROSTER_SCOPE_DENIED';end if;
 insert into academic_enrollments(student_id,group_id,subject_id) values(p.id,a.group_id,a.subject_id) on conflict(student_id,group_id,subject_id) do update set student_id=excluded.student_id returning id into eid;
 update profiles set active_enrollment_id=coalesce(active_enrollment_id,eid) where id=p.id;
 update roster_import_rows set status=case when p_invited then 'invited' else 'enrolled' end,student_id=p.id,message=case when p_invited then 'Alumno registrado. Invitación aceptada por el servicio de correo.' else 'Cuenta existente incorporada; contraseña y datos conservados.' end,updated_at=now() where id=r.id;
 insert into audit(actor_id,action,target_id,details) values(b.teacher_id,'academic.student_imported',p.id::text,jsonb_build_object('import_id',b.id,'assignment_id',a.id,'invited',p_invited));
end $$;
revoke execute on function claim_roster_row(uuid),finish_roster_row(uuid,uuid,uuid,boolean) from public,anon,authenticated;grant execute on function claim_roster_row(uuid),finish_roster_row(uuid,uuid,uuid,boolean) to service_role;
commit;
