begin;
-- Only newly finalized attempts carrying the server policy use the evidence weight.
-- Closed historical results remain immutable in record_academic_result.
create or replace function public.grade_saved_attempt() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare metric text; val numeric; minimum numeric; optimum numeric; weighted boolean;
begin
 if new.academic_enrollment_id is null then return new;end if;
 select coalesce(r.scale->>'metric',s.metric),coalesce((r.scale->>'minimum')::numeric,s.minimum),coalesce((r.scale->>'optimum')::numeric,s.optimum)
 into metric,minimum,optimum from grading_scales s left join academic_results r on r.attempt_id=new.id where s.mission_id=new.mission_id;
 if metric is null then return new;end if;
 val:=case when metric='money' then (new.state->'financialResult'->>'balance')::numeric else new.score end;
 weighted:=new.mission_id='inicio-actividades' and new.completed_at is not null and new.state->>'evidenceGradePolicy'='camila-evidence-20-v1';
 if weighted then
 val:=minimum+0.8*greatest(0,least(optimum-minimum,val-minimum))+0.2*(optimum-minimum)*greatest(0,least(100,(new.state->'evidenceResult'->>'bestScore')::numeric))/100;
 end if;
 perform record_academic_result(new.id,val,(new.state->'financialResult'->>'gained')::numeric,(new.state->'financialResult'->>'spent')::numeric);
 if weighted and (tg_op='INSERT' or old.completed_at is null) then
 update academic_results set scale=scale||'{"evidence_weight":0.2,"formula_version":"camila-evidence-20-v1"}'::jsonb where attempt_id=new.id;
 end if;
 return new;
end;$$;
commit;
