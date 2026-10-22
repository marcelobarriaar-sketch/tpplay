import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { initialProgress } from "../src/games/coihue/progress";
import { initialRubric } from "../src/accounts/model";
const a = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  b = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  c = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  city = "11111111-1111-4111-8111-111111111111";
test("PostgreSQL migration enforces private records, immutable publication and atomic invitations/progress", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth;create role anon;create role authenticated;create role service_role bypassrls;create table auth.users(id uuid primary key,raw_user_meta_data jsonb not null);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to authenticated;grant execute on function auth.uid() to authenticated;`,
    );
    await db.exec(readFileSync("supabase/migrations/001_learning.sql", "utf8"));
    for (const id of [a, b, c])
      await db.query("insert into auth.users values($1,$2)", [
        id,
        {
          name: "Alumno " + id[0],
          city_id: city,
          role: "admin",
          requested_school: "Liceo del Lago",
        },
      ]);
    const profiles = await db.query<{ role: string }>(
      "select role from profiles",
    );
    assert.ok(profiles.rows.every((p) => p.role === "student"));
    await db.query("insert into schools(id,city_id,name) values($1,$2,$3)", [
      c,
      city,
      "Liceo del Lago",
    ]);
    await assert.rejects(
      db.query("insert into schools(city_id,name) values($1,$2)", [
        city,
        " LÍCEO   DEL LAGO ",
      ]),
    );
    await db.query(
      "insert into courses(id,teacher_id,school_id,name) values($1,$2,$3,$4)",
      [c, c, c, "Curso A"],
    );
    await db.query(
      "insert into invitations(course_id,code_hash,expires_at,max_uses) values($1,$2,now()+interval '1 day',1)",
      [c, "hash"],
    );
    await db.query("update profiles set role='admin' where id=$1", [c]);
    await assert.rejects(
      db.query("select admin_course($1,$2,$3,$4,$5,$6)", [
        a,
        c,
        c,
        c,
        "Manipulado",
        true,
      ]),
    );
    await db.query("select admin_course($1,$2,$3,$4,$5,$6)", [
      c,
      c,
      c,
      c,
      "Curso corregido",
      true,
    ]);
    assert.equal(
      (
        await db.query<{ name: string }>(
          "select name from courses where id=$1",
          [c],
        )
      ).rows[0].name,
      "Curso corregido",
    );
    const pending = await db.query<{ id: string }>(
      "select id from school_requests where student_id=$1",
      [a],
    );
    await db.query("select approve_school($1,$2,$3,$4)", [
      c,
      pending.rows[0].id,
      city,
      "Liceo del Lago",
    ]);
    assert.equal(
      (
        await db.query<{ school_id: string }>(
          "select school_id from profiles where id=$1",
          [a],
        )
      ).rows[0].school_id,
      c,
    );
    await assert.rejects(
      db.query("select admin_profile($1,$2,$3)", [a, b, { role: "admin" }]),
    );
    await db.query("select admin_profile($1,$2,$3)", [
      c,
      b,
      { name: "Nombre corregido" },
    ]);
    assert.equal(
      (
        await db.query<{ action: string }>(
          "select action from audit where target_id=$1",
          [b],
        )
      ).rows[0].action,
      "user.update",
    );
    await db.query("select admin_membership($1,$2,$3,$4)", [c, b, c, false]);
    await db.query("select admin_membership($1,$2,$3,$4)", [c, b, c, true]);
    await db.query("select join_course($1,$2)", [a, "hash"]);
    await assert.rejects(db.query("select join_course($1,$2)", [b, "hash"]));
    const params = [
      a,
      "mision-tributos",
      1,
      0,
      initialProgress(),
      a,
      { type: "start" },
      { mission_id: "plaza" },
    ];
    await db.query("select commit_game($1,$2,$3,$4,$5,$6,$7,$8)", params);
    await db.query("select commit_game($1,$2,$3,$4,$5,$6,$7,$8)", params); // same event is idempotent
    assert.equal(
      (
        await db.query<{ revision: number }>(
          "select revision from game_progress",
        )
      ).rows[0].revision,
      1,
    );
    await assert.rejects(
      db.query("select commit_game($1,$2,$3,$4,$5,$6,$7,$8)", [
        ...params.slice(0, 5),
        b,
        ...params.slice(6),
      ]),
    );
    await db.query(
      "insert into evaluations(course_id,student_id,teacher_id,rubric,ratings,comments,published) values($1,$2,$3,$4,$5,$6,false)",
      [c, a, c, initialRubric, { tributo: 2 }, { tributo: "Borrador" }],
    );
    await db.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${b}',false);`,
    );
    assert.equal(
      (await db.query("select * from game_progress")).rows.length,
      0,
    );
    assert.equal((await db.query("select * from evidence")).rows.length, 0);
    assert.equal((await db.query("select * from profiles")).rows.length, 1);
    await assert.rejects(
      db.query("update profiles set role='admin' where id=$1", [b]),
    );
    await assert.rejects(
      db.query("select commit_game($1,$2,$3,$4,$5,$6,$7,$8)", params),
    );
    await db.exec(`select set_config('request.jwt.claim.sub','${a}',false);`);
    assert.equal(
      (await db.query("select * from game_progress")).rows.length,
      1,
    );
    assert.equal((await db.query("select * from evaluations")).rows.length, 0);
    await db.exec("reset role;update evaluations set published=true");
    await assert.rejects(
      db.exec("update evaluations set overall='Manipulado'"),
    );
    await db.exec(
      `set role authenticated;select set_config('request.jwt.claim.sub','${a}',false);`,
    );
    assert.equal((await db.query("select * from evaluations")).rows.length, 1);
    await db.exec(
      `reset role;update profiles set active=false where id='${a}';set role authenticated;`,
    );
    assert.equal(
      (await db.query("select * from game_progress")).rows.length,
      0,
    );
    assert.equal((await db.query("select * from evaluations")).rows.length, 0);
  } finally {
    await db.close();
  }
});
