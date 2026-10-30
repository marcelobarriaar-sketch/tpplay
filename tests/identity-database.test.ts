import { evidenceConfirmation } from "../src/games/inicio/evaluation";
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import {
  freshAttempt as currentAttempt,
  reduceMission,
  importAttempt,
  scoreAttempt,
} from "../server/missionDomain";
import { missions } from "../src/data";
const student = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  teacher = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  admin = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
test("Identity migrations: public roles, server progress across sessions, immutable XP, RLS, suspension and admin audit", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth;create role anon;create role authenticated;create role service_role bypassrls;create table auth.sessions(id uuid primary key,user_id uuid);create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}',raw_app_meta_data jsonb not null default '{}',email_confirmed_at timestamptz,last_sign_in_at timestamptz);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
    );
    for (const file of [
      "001_learning.sql",
      "004_admin_recovery.sql",
      "005_admin_profile.sql",
      "006_identity.sql",
      "007_identity_operations.sql",
      "008_identity_sessions.sql",
      "012_camila_simulation.sql",
    ])
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    for (const [id, role] of [
      [student, "student"],
      [other, "student"],
      [teacher, "teacher"],
      [admin, "student"],
    ])
      await db.query(
        "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
        [
          id,
          `${id[0]}@example.test`,
          {
            first_name: "Persona",
            last_name: "Prueba",
            initial_role: role,
            terms_version: "2026-10",
            role: "admin",
          },
        ],
      );
    await assert.rejects(
      db.query("insert into auth.users(id,raw_user_meta_data) values($1,$2)", [
        randomUUID(),
        {
          first_name: "Persona",
          last_name: "Prueba",
          initial_role: "admin",
          terms_version: "2026-10",
        },
      ]),
    );
    await assert.rejects(
      db.query("insert into auth.users(id,raw_user_meta_data) values($1,$2)", [
        randomUUID(),
        { name: "Sin términos", initial_role: "student" },
      ]),
    );
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from profiles where id=$1",
          [teacher],
        )
      ).rows[0].role,
      "teacher",
    );
    assert.equal(
      (
        await db.query<{ role: string }>(
          "select role from profiles where id=$1",
          [student],
        )
      ).rows[0].role,
      "student",
    );
    await db.query("update profiles set role='admin' where id=$1", [admin]);
    const sessionId = randomUUID();
    await db.query("insert into auth.sessions values($1,$2)", [
      sessionId,
      student,
    ]);
    assert.equal(
      (
        await db.query<{ active: boolean }>(
          "select identity_session_active($1,$2) active",
          [student, sessionId],
        )
      ).rows[0].active,
      true,
    );
    await db.query("delete from auth.sessions where id=$1", [sessionId]);
    assert.equal(
      (
        await db.query<{ active: boolean }>(
          "select identity_session_active($1,$2) active",
          [student, sessionId],
        )
      ).rows[0].active,
      false,
    );
    await assert.rejects(
      db.query("select admin_identity($1,$2,$3)", [
        teacher,
        student,
        { role: "admin" },
      ]),
    );
    await db.query("select admin_identity($1,$2,$3)", [
      admin,
      teacher,
      { role: "institution_admin" },
    ]);
    await assert.rejects(
      db.query("select admin_identity($1,$2,$3)", [
        admin,
        admin,
        { status: "suspended" },
      ]),
    );
    let state = freshAttempt(randomUUID(), "mision-iva"),
      revision = 0;
    const m = missions.find((m) => m.slug === state.missionSlug)!;
    async function commit(eventId = randomUUID()) {
      const r = await db.query<{
        value: { state: typeof state; revision: number };
      }>("select commit_mission($1,$2,$3,$4,$5,$6,$7,$8,$9,false) as value", [
        student,
        state.id,
        m.slug,
        m.version,
        revision,
        state,
        scoreAttempt(state),
        m.steps.length,
        eventId,
      ]);
      revision = r.rows[0].value.revision;
      return r.rows[0].value;
    }
    await commit();
    state = reduceMission(state, { type: "answer", value: "0" });
    const eventId = randomUUID();
    const first = await commit(eventId);
    const duplicate = await db.query<{ value: { revision: number } }>(
      "select commit_mission($1,$2,$3,$4,0,$5,0,$6,$7,false) as value",
      [student, state.id, m.slug, m.version, state, m.steps.length, eventId],
    );
    assert.equal(duplicate.rows[0].value.revision, first.revision);
    const rlsSession = randomUUID();
    await db.query("insert into auth.sessions values($1,$2)", [
      rlsSession,
      student,
    ]);
    await db.query("select set_config('request.jwt.claims',$1,false)", [
      JSON.stringify({ session_id: rlsSession }),
    ]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      student,
    ]);
    assert.equal(
      (await db.query("select * from mission_attempts")).rows.length,
      1,
    );
    // Simulated second browser session sees the exact persisted answer.
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      other,
    ]);
    assert.equal(
      (await db.query("select * from mission_attempts")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("update profiles set role=$1 where id=$2", ["admin", other]),
    );
    await assert.rejects(
      db.query("insert into xp_events values($1,$2,$3,100,now())", [
        other,
        "fake",
        "first",
      ]),
    );
    await assert.rejects(
      db.query("select commit_mission($1,$2,$3,$4,0,$5,0,3,$6,false)", [
        other,
        randomUUID(),
        m.slug,
        m.version,
        state,
        randomUUID(),
      ]),
    );
    await db.exec("reset role");
    for (let i = 0; i < m.steps.length; i++) {
      if (i > 0)
        state = reduceMission(state, {
          type: "answer",
          value: String(m.steps[i].correct),
        });
      state = reduceMission(state, { type: "confirm" });
      state = reduceMission(state, { type: "next" });
    }
    state = reduceMission(state, {
      type: "evidence",
      value:
        "Explicación del caso con información suficiente para la revisión docente.",
    });
    state = reduceMission(state, { type: "complete" });
    await commit();
    assert.equal(
      (
        await db.query<{ xp: number }>(
          "select sum(amount)::integer xp from xp_events where student_id=$1",
          [student],
        )
      ).rows[0].xp,
      100,
    );
    assert.equal(
      (
        await db.query("select * from user_achievements where student_id=$1", [
          student,
        ])
      ).rows.length,
      2,
    );
    await assert.rejects(commit());
    assert.equal(
      (
        await db.query<{ xp: number }>(
          "select sum(amount)::integer xp from xp_events where student_id=$1",
          [student],
        )
      ).rows[0].xp,
      100,
    );
    for(let retry=0;retry<2;retry++) {
      state=freshAttempt(randomUUID(),m.slug);revision=0;await commit();for(let i=0;i<m.steps.length;i++){state=reduceMission(state,{type:'answer',value:String(m.steps[i].correct)});state=reduceMission(state,{type:'confirm'});state=reduceMission(state,{type:'next'});}state=reduceMission(state,{type:'evidence',value:'Explicación de una mejora con todos los criterios del caso.'});state=reduceMission(state,{type:'complete'});await commit();
    }
    assert.equal((await db.query<{xp:number}>('select sum(amount)::integer xp from xp_events where student_id=$1',[student])).rows[0].xp,150);
    // The opening badge is atomic with the saved server state, never auto-unlocked by generic XP.
    // New IVA desks round-trip through the existing persistent API commit contract.
    {
      const ivaStudent=randomUUID();
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[ivaStudent,'iva-desk@example.test',{first_name:'Alumno',last_name:'IVA',initial_role:'student',terms_version:'2026-10'}]);
      let iva=currentAttempt(randomUUID(),'mision-iva'), rev=0;
      async function saveIva(eventId=randomUUID()) {
        const saved=await db.query<{value:{state:typeof iva;revision:number}}>('select commit_mission($1,$2,$3,$4,$5,$6,$7,3,$8,false) value',[ivaStudent,iva.id,iva.missionSlug,iva.version,rev,iva,scoreAttempt(iva),eventId]);
        rev=saved.rows[0].value.revision;
        iva=saved.rows[0].value.state;
      }
      iva=reduceMission(iva,{type:'iva',value:JSON.stringify({action:'save',fields:{a:'purchase'}})});
      await saveIva(); assert.equal(iva.iva?.drafts[0].a,'purchase');assert.equal(iva.confirmed[0],undefined);
      for(const fields of [{a:'purchase',b:'sale'},{base:'200000',amount:'38000'},{debit:'38000',credit:'19000',operation:'subtract',amount:'19000'}]) {
        iva=reduceMission(iva,{type:'iva',value:JSON.stringify({action:'check',fields})});await saveIva();
        iva=reduceMission(iva,{type:'next'});await saveIva();
      }
      iva=reduceMission(iva,{type:'evidence',value:'Diego, el crédito de compras admitido se descuenta del débito. Revisaría las facturas y sus requisitos antes de usar el cálculo.'});await saveIva();
      iva=reduceMission(iva,{type:'complete'});const finalEvent=randomUUID();await saveIva(finalEvent);
      await db.query('select commit_mission($1,$2,$3,$4,$5,$6,$7,3,$8,false)',[ivaStudent,iva.id,iva.missionSlug,iva.version,rev-1,iva,scoreAttempt(iva),finalEvent]);
      const restored=(await db.query<{state:typeof iva}>('select state from mission_attempts where id=$1',[iva.id])).rows[0].state;
      assert.deepEqual(restored.iva,iva.iva);assert.equal(scoreAttempt(restored),3);assert.ok(restored.completedAt);
      assert.equal((await db.query<{n:number}>('select count(*)::integer n from xp_events where student_id=$1',[ivaStudent])).rows[0].n,1);
    }
    // The field notebook uses the same persistent transaction without a new table or migration.
    {
      const fieldStudent=randomUUID();
      await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[fieldStudent,'field-notebook@example.test',{first_name:'Alumno',last_name:'Campo',initial_role:'student',terms_version:'2026-10'}]);
      let field=currentAttempt(randomUUID(),'rescate-invernadero'),rev=0;
      async function saveField(eventId=randomUUID()) {
        const r=await db.query<{value:{state:typeof field;revision:number}}>('select commit_mission($1,$2,$3,$4,$5,$6,$7,3,$8,false) value',[fieldStudent,field.id,field.missionSlug,field.version,rev,field,scoreAttempt(field),eventId]);
        field=r.rows[0].value.state;rev=r.rows[0].value.revision;
      }
      field=reduceMission(field,{type:'greenhouse',value:JSON.stringify({action:'save',fields:{temperature:'seen'}})});await saveField();assert.equal(field.greenhouse?.drafts[0].temperature,'seen');assert.equal(field.confirmed[0],undefined);
      for(const fields of [{temperature:'seen',soil:'seen',ventilation:'seen',leaves:'seen',hypothesis:'heat',evidence1:'temperature',evidence2:'ventilation'},{authorization:'seen',ventilation:'open',irrigation:'hold',products:'none',record:'record'},{temperature:'25',trend:'down',crop:'partial',next:'consult'}]) {
        field=reduceMission(field,{type:'greenhouse',value:JSON.stringify({action:'check',fields})});await saveField();field=reduceMission(field,{type:'next'});await saveField();
      }
      field=reduceMission(field,{type:'evidence',value:'Teresa, observé el calor y las ventanas cerradas. Tras ventilar hubo una mejoría parcial y consultaría por las plantas que siguen decaídas.'});await saveField();field=reduceMission(field,{type:'complete'});const finalEvent=randomUUID();await saveField(finalEvent);
      await db.query('select commit_mission($1,$2,$3,$4,$5,$6,$7,3,$8,false)',[fieldStudent,field.id,field.missionSlug,field.version,rev-1,field,scoreAttempt(field),finalEvent]);
      const restored=(await db.query<{state:typeof field}>('select state from mission_attempts where id=$1',[field.id])).rows[0].state;assert.deepEqual(restored.greenhouse,field.greenhouse);assert.equal(scoreAttempt(restored),3);assert.ok(restored.completedAt);
      assert.equal((await db.query<{n:number}>('select count(*)::integer n from xp_events where student_id=$1',[fieldStudent])).rows[0].n,1);
    }
    {const simulationStudent=randomUUID();await db.query('insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)',[simulationStudent,'simulation@example.test',{first_name:'Alumno',last_name:'Integración',initial_role:'student',terms_version:'2026-10'}]);let opening=currentAttempt(randomUUID(),'inicio-actividades');const events=[{action:'begin'},{action:'talk',value:'business'},{action:'talk',value:'pending'},{action:'map'},{action:'travel',value:'sii'},{action:'investigate'},{action:'place',value:'notice',target:'sii'},{action:'place',value:'permit',target:'municipality'},{action:'prepare'},{action:'draft',value:'person',target:'natural'},{action:'draft',value:'activity',target:'meals'},{action:'draft',value:'procedure',target:'start'},{action:'submit'}];for(const event of events)opening=reduceMission(opening,{type:'simulation',value:JSON.stringify(event)});await db.query('select commit_mission($1,$2,$3,$4,0,$5,$6,8,$7,false)',[simulationStudent,opening.id,opening.missionSlug,opening.version,opening,scoreAttempt(opening),randomUUID()]);assert.equal((await db.query<{n:number}>("select count(*)::integer n from user_achievements where student_id=$1 and achievement_code='camila-primer-paso'",[simulationStudent])).rows[0].n,1);assert.equal((await db.query<{n:number}>("select count(*)::integer n from user_achievements where student_id=$1 and achievement_code='camila-primer-paso'",[other])).rows[0].n,0);opening=reduceMission(opening,{type:'next'});for(const [field,value] of Object.entries({origin:'restaurant',channel:'treasury'}))opening=reduceMission(opening,{type:'manage',value:JSON.stringify({field,value})});await db.query('select commit_mission($1,$2,$3,$4,1,$5,$6,8,$7,false)',[simulationStudent,opening.id,opening.missionSlug,opening.version,opening,scoreAttempt(opening),randomUUID()]);const savedManagement=(await db.query<{state:typeof opening}>('select state from mission_attempts where id=$1',[opening.id])).rows[0].state;assert.equal(savedManagement.management?.drafts[1].origin,'restaurant');assert.equal(savedManagement.answers[1],'2');assert.equal(savedManagement.confirmed[1],undefined);opening=reduceMission(savedManagement,{type:'confirm'});await db.query('select commit_mission($1,$2,$3,$4,2,$5,$6,8,$7,false)',[simulationStudent,opening.id,opening.missionSlug,opening.version,opening,scoreAttempt(opening),randomUUID()]);assert.equal((await db.query<{state:typeof opening}>('select state from mission_attempts where id=$1',[opening.id])).rows[0].state.confirmed[1],true);}

    // Camila evaluations use the same durable JSON transaction, event idempotency and RLS.
    {
      const camila=missions.find(m=>m.slug==='inicio-actividades')!;
      let note=freshAttempt(randomUUID(),camila.slug),rev=0;
      for(const step of camila.steps){note=reduceMission(note,{type:'answer',value:String(step.correct)});note=reduceMission(note,{type:'confirm'});note=reduceMission(note,{type:'next'});}
      for(let n=0;n<3;n++){
        note=reduceMission(note,{type:'evaluateEvidence',value:n===0?'Informamos al SII el inicio del negocio y su actividad comercial.':'Todavía debo repasar los conceptos.'});
        const event=randomUUID();
        const committed=await db.query<{value:{state:typeof note;revision:number}}>('select commit_mission($1,$2,$3,$4,$5,$6,$7,$8,$9,false) value',[student,note.id,camila.slug,camila.version,rev,note,scoreAttempt(note),camila.steps.length,event]);
        rev=committed.rows[0].value.revision;
        assert.equal(committed.rows[0].value.state.evidenceEvaluations?.length,n+1);
        const duplicate=await db.query<{value:{revision:number}}>('select commit_mission($1,$2,$3,$4,$5,$6,$7,$8,$9,false) value',[student,note.id,camila.slug,camila.version,rev-1,note,scoreAttempt(note),camila.steps.length,event]);
        assert.equal(duplicate.rows[0].value.revision,rev);
      }
      assert.equal(note.completedAt,undefined);
      note=reduceMission(note,{type:'continueEvidence',value:evidenceConfirmation(note.evidenceEvaluations)});
      await db.query('select commit_mission($1,$2,$3,$4,$5,$6,$7,$8,$9,false)',[student,note.id,camila.slug,camila.version,rev,note,scoreAttempt(note),camila.steps.length,randomUUID()]);
      const persisted=(await db.query<{state:typeof note}>('select state from mission_attempts where id=$1',[note.id])).rows[0].state;
      assert.equal(persisted.evidenceResult?.outcome,'Misión completada con apoyo');
      assert.equal(persisted.evidenceEvaluations?.length,3);
      assert.ok(persisted.completedAt);
      assert.equal(persisted.evidenceEvaluations?.[0].response,'Informamos al SII el inicio del negocio y su actividad comercial.');
    }
    await db.query("select admin_identity($1,$2,$3)", [
      admin,
      student,
      { status: "suspended" },
    ]);
    await db.exec("set role authenticated");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      student,
    ]);
    assert.equal(
      (await db.query("select * from mission_attempts")).rows.length,
      0,
    );
    await db.exec("reset role");
    await db.query("select admin_identity($1,$2,$3)", [
      admin,
      student,
      { status: "active" },
    ]);
    await db.query("delete from auth.sessions where user_id=$1", [student]);
    await db.exec("set role authenticated");
    assert.equal(
      (await db.query("select * from mission_attempts")).rows.length,
      0,
    );
    await db.exec("reset role");
    assert.ok((await db.query("select * from audit")).rows.length >= 2);
  } finally {
    await db.close();
  }
});
test("Mission reducer rejects skipped steps, forged completion and client-supplied results on local import", () => {
  const a = freshAttempt(randomUUID(), "mision-iva");
  assert.throws(() => reduceMission(a, { type: "complete" }));
  assert.throws(() => reduceMission(a, { type: "next" }));
  assert.throws(() => reduceMission(a, { type: "confirm" }));
  assert.throws(() =>
    importAttempt(
      { ...a, index: 3, completedAt: new Date().toISOString() },
      randomUUID(),
    ),
  );
  const partial = reduceMission(a, { type: "answer", value: "1" });
  const imported = importAttempt({ ...partial, xp: 99999 }, randomUUID());
  assert.equal(imported.answers[0], "1");
  assert.equal((imported as any).xp, undefined);
  assert.equal(imported.completedAt, undefined);
});

// Explicit historical fixtures: preserve saved questionnaire attempts alongside the new simulation.
function freshAttempt(...args:Parameters<typeof currentAttempt>){const a=currentAttempt(...args);delete a.simulation;return a;}
