-- Correct the duplicated school without deleting history or changing group IDs.
begin;
alter table public.schools add column if not exists merged_into_id uuid references public.schools;
do $$
declare canonical uuid; duplicate uuid; fresia uuid;
begin
 select id into fresia from cities where registry_name(name)='fresia';
 select s.id into canonical from schools s where s.city_id=fresia and registry_name(s.name)='liceo carlos ibanez del campo';
 select s.id into duplicate from schools s join cities c on c.id=s.city_id where registry_name(s.name)='liceo carlos ibanez del campo' and registry_name(c.name)='puerto montt';
 if canonical is not null and duplicate is not null and canonical<>duplicate then
   -- A conflicting cohort requires an explicit merge; never discard grades or rosters.
   if exists(select 1 from class_groups a join class_groups b on a.school_year=b.school_year and a.name_key=b.name_key where a.school_id=duplicate and b.school_id=canonical) then raise exception 'SCHOOL_GROUP_CONFLICT: review matching cohorts before consolidation'; end if;
   update class_groups set school_id=canonical where school_id=duplicate;
   update courses set school_id=canonical where school_id=duplicate;
   update profiles set school_id=canonical,city_id=fresia where school_id=duplicate;
   update subscriptions set school_id=canonical where school_id=duplicate;
   update schools set merged_into_id=canonical where id=duplicate;
   if not exists(select 1 from audit where action='registry.school_consolidated' and target_id=duplicate::text) then
    insert into audit(action,target_id,details) values('registry.school_consolidated',duplicate::text,jsonb_build_object('canonical_school_id',canonical,'commune','Fresia','reason','Corrección de ubicación solicitada; registros y cursos conservados'));
   end if;
 end if;
end $$;
-- Old saved links and signup metadata resolve to the canonical school as well.
create function public.canonical_school_reference() returns trigger language plpgsql set search_path=public,pg_temp as $$
declare canonical uuid;
begin
 select merged_into_id into canonical from schools where id=new.school_id;
 if canonical is not null then
  new.school_id:=canonical;
  if tg_table_name='profiles' then new.city_id:=(select city_id from schools where id=canonical); end if;
 end if;
 return new;
end $$;
create trigger canonical_profile_school before insert or update of school_id on profiles for each row execute function canonical_school_reference();
create trigger canonical_group_school before insert or update of school_id on class_groups for each row execute function canonical_school_reference();
create trigger canonical_course_school before insert or update of school_id on courses for each row execute function canonical_school_reference();
commit;
