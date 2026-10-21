begin;
create function public.identity_counts() returns jsonb language sql security definer set search_path=public,pg_temp as $$select jsonb_build_object('total',count(*),'student',count(*) filter(where role='student'),'teacher',count(*) filter(where role='teacher'),'institution_admin',count(*) filter(where role='institution_admin'),'active',count(*) filter(where status='active'),'suspended',count(*) filter(where status='suspended')) from profiles$$;
create function public.admin_identity(p_actor uuid,p_target uuid,p_updates jsonb) returns void language plpgsql security definer set search_path=public,pg_temp as $$declare p profiles;begin
 perform pg_advisory_xact_lock(hashtextextended('tpplay-admin-accounts',0));
 if p_actor=p_target or not exists(select 1 from profiles where id=p_actor and role='admin' and active and status='active') then raise exception 'DENIED';end if;
 if exists(select 1 from jsonb_object_keys(p_updates) k where k not in ('role','status','active')) then raise exception 'Invalid fields';end if;
 select * into p from profiles where id=p_target for update;if p.id is null then raise exception 'Unknown account';end if;
 if p.role='admin' and ((p_updates ? 'role' and p_updates->>'role'<>'admin') or (p_updates ? 'status' and p_updates->>'status'<>'active')) and (select count(*) from profiles where role='admin' and status='active')<=1 then raise exception 'LAST_ADMIN';end if;
 update profiles set role=coalesce(p_updates->>'role',role),status=coalesce(p_updates->>'status',status) where id=p_target;
 insert into audit(actor_id,action,target_id,details) values(p_actor,'identity.update',p_target::text,jsonb_build_object('before',jsonb_build_object('role',p.role,'status',p.status),'after',p_updates));end;$$;
alter function public.commit_game(uuid,text,integer,integer,jsonb,uuid,jsonb,jsonb) rename to commit_game_base;
create function public.commit_game(p_student uuid,p_game text,p_version integer,p_revision integer,p_state jsonb,p_event_id uuid,p_event jsonb,p_details jsonb) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare saved jsonb;m jsonb;done boolean;n integer;pct integer;begin
 perform pg_advisory_xact_lock(hashtextextended(p_student::text,0));
 if not exists(select 1 from profiles where id=p_student and role='student' and active and status='active') then raise exception 'DENIED';end if;
 saved:=commit_game_base(p_student,p_game,p_version,p_revision,p_state,p_event_id,p_event,p_details);
 select count(*)+1 into n from evidence where student_id=p_student and game_id=p_game and event->>'type'='restart';
 for m in select * from jsonb_array_elements(coalesce(p_details->'missions','[]')) loop
 done:=(m->>'completed')::boolean;pct:=(m->>'percentage')::integer;
 if done then insert into xp_events(student_id,mission_id,rule,amount) values(p_student,'coihue:'||(m->>'id'),'first',100) on conflict do nothing;end if;
 insert into mission_progress(student_id,mission_id,status,progress_percentage,current_step,attempts,xp_earned,completed_at,version) values(p_student,'coihue:'||(m->>'id'),case when done then 'completed' else 'in_progress' end,pct,(m->>'step')::integer,n,case when done then 100 else 0 end,case when done then now() end,p_version::text)
 on conflict(student_id,mission_id) do update set status=case when mission_progress.status='completed' then 'completed' else excluded.status end,progress_percentage=greatest(mission_progress.progress_percentage,excluded.progress_percentage),current_step=excluded.current_step,attempts=greatest(mission_progress.attempts,excluded.attempts),xp_earned=greatest(mission_progress.xp_earned,excluded.xp_earned),last_activity_at=now(),completed_at=coalesce(mission_progress.completed_at,excluded.completed_at);
 end loop;perform unlock_achievements(p_student);return saved;end;$$;
revoke execute on function identity_counts(),admin_identity(uuid,uuid,jsonb),commit_game(uuid,text,integer,integer,jsonb,uuid,jsonb,jsonb) from public,anon,authenticated;
grant execute on function identity_counts(),admin_identity(uuid,uuid,jsonb),commit_game(uuid,text,integer,integer,jsonb,uuid,jsonb,jsonb) to service_role;
commit;
