begin;
create or replace function public.unlock_achievements(p_student uuid) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare xp integer;n integer;begin
 select coalesce(sum(amount),0) into xp from xp_events where student_id=p_student;select count(*) into n from mission_progress where student_id=p_student and status='completed';
 insert into user_achievements(student_id,achievement_code) select p_student,code from achievements where active and not(condition ? 'simulation') and (not(condition ? 'xp') or xp >= (condition->>'xp')::integer) and (not(condition ? 'completed') or n >= (condition->>'completed')::integer) on conflict do nothing;end;$$;

insert into achievements(code,name,description,icon,condition) values('camila-primer-paso','Primer paso formal','Organizaste el encargo inicial de Camila y distinguiste el aviso al SII de los permisos municipales.','🏅','{"simulation":"camila-opening-v1"}') on conflict(code) do nothing;
create function public.unlock_camila_opening() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.mission_id='inicio-actividades' and new.state->'simulation'->>'version'='1' and new.state->'simulation'->>'phase'='reward' and new.state->'confirmed'->>0='true' then
 insert into user_achievements(student_id,achievement_code) values(new.student_id,'camila-primer-paso') on conflict do nothing;
 end if;return new;
end $$;
create trigger camila_opening_badge after insert or update on mission_attempts for each row execute function unlock_camila_opening();
commit;
