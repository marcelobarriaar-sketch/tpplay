begin;
-- getUser validates the signed token; this additionally rejects sessions revoked by logout.
create function public.identity_session_active(p_user uuid,p_session uuid) returns boolean language plpgsql security definer set search_path=public,pg_temp as $$begin return exists(select 1 from auth.sessions where id=p_session and user_id=p_user);end;$$;
revoke execute on function identity_session_active(uuid,uuid) from public,anon,authenticated;
grant execute on function identity_session_active(uuid,uuid) to service_role;
create function public.identity_access() returns boolean language plpgsql stable security definer set search_path=public,pg_temp as $$declare sid uuid;begin
 sid:=nullif(auth.jwt()->>'session_id','')::uuid;
 return exists(select 1 from profiles where id=auth.uid() and active and status='active') and exists(select 1 from auth.sessions where id=sid and user_id=auth.uid());
end;$$;
revoke execute on function identity_access() from public,anon;
grant execute on function identity_access() to authenticated,service_role;
drop policy own_profile on profiles;
create policy own_profile on profiles for select to authenticated using(id=auth.uid() and (select identity_access()));
drop policy own_progress on game_progress;
create policy own_progress on game_progress for select to authenticated using(student_id=auth.uid() and (select identity_access()));
drop policy own_evidence on evidence;
create policy own_evidence on evidence for select to authenticated using(student_id=auth.uid() and (select identity_access()));
drop policy published_feedback on evaluations;
create policy published_feedback on evaluations for select to authenticated using(student_id=auth.uid() and published and (select identity_access()));
drop policy own_attempt on mission_attempts;
create policy own_attempt on mission_attempts for select to authenticated using(student_id=auth.uid() and (select identity_access()));
drop policy own_mission on mission_progress;
create policy own_mission on mission_progress for select to authenticated using(student_id=auth.uid() and (select identity_access()));
drop policy own_xp on xp_events;
create policy own_xp on xp_events for select to authenticated using(student_id=auth.uid() and (select identity_access()));
drop policy own_achievement on user_achievements;
create policy own_achievement on user_achievements for select to authenticated using(student_id=auth.uid() and (select identity_access()));
commit;
