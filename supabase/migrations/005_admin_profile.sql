begin;
alter table public.admin_recovery alter column auth_user_id drop not null;
alter table public.admin_recovery add column if not exists pending_auth_user_id uuid references auth.users(id) on delete restrict;
alter table public.admin_recovery add column if not exists display_name text not null default '';
alter table public.admin_recovery add column if not exists phone text not null default '';
create or replace function public.create_student_profile() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare city uuid;school uuid;
begin
 if new.raw_app_meta_data->>'tpplay_admin_contact'='true' then return new;end if;
 city:=nullif(new.raw_user_meta_data->>'city_id','')::uuid;school:=nullif(new.raw_user_meta_data->>'school_id','')::uuid;
 if city is null or not exists(select 1 from cities where id=city) then raise exception 'Invalid city';end if;
 if school is not null and not exists(select 1 from schools where id=school and city_id=city) then raise exception 'Invalid school';end if;
 insert into profiles(id,name,city_id,school_id,role) values(new.id,trim(new.raw_user_meta_data->>'name'),city,school,'student');
 if school is null then
  insert into school_requests(student_id,city_id,name) values(new.id,city,trim(new.raw_user_meta_data->>'requested_school'));
 end if;
 return new;
end;$$;

commit;
