import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { gradeFor, gradeLabel, type Scale } from "../src/accounts/grading";
const scale: Scale = {
  mission_id: "test",
  minimum: 0,
  optimum: 100000,
  grade_min: 1,
  grade_pass: 4,
  grade_max: 7,
  requirement: 0.6,
  metric: "money",
  version: 1,
};
test("Chilean two-segment scale, boundaries and one-decimal display", () => {
  for (const [score, expected] of [
    [100000, 7],
    [60000, 4],
    [0, 1],
    [-15000, 1],
    [120000, 7],
    [92000, 6.4],
    [75000, 5.125],
    [38000, 2.9],
  ])
    assert.ok(Math.abs(gradeFor(score, scale) - expected) < 1e-9);
  assert.equal(gradeLabel(6.74), "6,7");
  assert.equal(gradeLabel(5.26), "5,3");
  assert.equal(gradeLabel(3.95), "4,0");
  assert.throws(() => gradeFor(50, { ...scale, optimum: 0 }));
});
test("academic migration: normalized identities, automatic cohorts, grade snapshots, one challenge one grade and RLS", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create schema auth;create role anon;create role authenticated;create role service_role bypassrls;create table auth.sessions(id uuid primary key,user_id uuid);create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb not null default '{}',raw_app_meta_data jsonb not null default '{}',email_confirmed_at timestamptz,last_sign_in_at timestamptz);create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;create function auth.jwt() returns jsonb language sql as $$select '{}'::jsonb$$;grant usage on schema auth to authenticated;`,
    );
    for (const file of [
      "001_learning.sql",
      "004_admin_recovery.sql",
      "005_admin_profile.sql",
      "006_identity.sql",
      "007_identity_operations.sql",
      "008_identity_sessions.sql",
      "009_academic_grades.sql",
    ])
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    const city = "11111111-1111-4111-8111-111111111111",
      school = randomUUID(),
      school2 = randomUUID(),
      teacher = randomUUID(),
      otherTeacher = randomUUID(),
      student = randomUUID(),
      otherCourse = randomUUID(),
      otherSubject = randomUUID(),
      otherSchool = randomUUID();
    await db.query(
      "insert into schools(id,city_id,name) values($1,$2,$3),($4,$2,$5)",
      [
        school,
        city,
        "Establecimiento de prueba",
        school2,
        "Otro establecimiento de prueba",
      ],
    );
    for (const [id, role] of [
      [teacher, "teacher"],
      [otherTeacher, "teacher"],
      [student, "student"],
      [otherCourse, "student"],
      [otherSubject, "student"],
      [otherSchool, "student"],
    ])
      await db.query(
        "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
        [
          id,
          id + "@example.test",
          {
            first_name: "Persona",
            last_name: "Prueba",
            initial_role: role,
            terms_version: "2026-10",
          },
        ],
      );
    const setup = (id: string, s: string, g: string, subject: string) =>
      db.query("select save_academic_setup($1,$2)", [
        id,
        {
          school_id: s,
          year: 2026,
          pairs: [{ group_name: g, subject_name: subject }],
        },
      ]);
    await setup(
      teacher,
      school,
      "3° Medio Administración",
      "Gestión Comercial y Tributaria",
    );
    await setup(
      teacher,
      school,
      "Tercero Medio Administración",
      "gestión comercial y tributaria",
    );
    assert.equal(
      (
        await db.query("select * from class_groups where school_id=$1", [
          school,
        ])
      ).rows.length,
      1,
    );
    const registeredTeacher = randomUUID();
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [
        registeredTeacher,
        "registro@example.test",
        {
          first_name: "Docente",
          last_name: "Registro",
          initial_role: "teacher",
          terms_version: "2026-10",
          academic_setup: {
            school_id: school,
            year: 2026,
            pairs: [{ group_name: "2° Medio A", subject_name: "Matemática" }],
          },
        },
      ],
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from teaching_assignments where teacher_id=$1",
          [registeredTeacher],
        )
      ).rows[0].status,
      "pending",
    );
    await setup(
      otherTeacher,
      school,
      "4° Medio Administración",
      "Gestión Comercial y Tributaria",
    );
    await setup(
      otherTeacher,
      school,
      "3 medio administración",
      "Administración",
    );
    await setup(
      otherTeacher,
      school2,
      "3° Medio Administración",
      "Gestión Comercial y Tributaria",
    );
    const assignments = (
      await db.query<{
        id: string;
        group_id: string;
        subject_id: string;
        teacher_id: string;
      }>("select * from teaching_assignments")
    ).rows;
    const own = assignments.find((a) => a.teacher_id === teacher)!;
    const other = assignments.filter((a) => a.teacher_id !== teacher);
    const enroll = (id: string, a: typeof own, s = school) =>
      db.query("select save_academic_setup($1,$2)", [
        id,
        {
          school_id: s,
          year: 2026,
          pairs: [{ group_id: a.group_id, subject_id: a.subject_id }],
        },
      ]);
    await assert.rejects(enroll(student, own));
    await db.exec("update teaching_assignments set status='approved'");
    await enroll(student, own);
    const groups = (
      await db.query<{ id: string; school_id: string; name: string }>(
        "select * from class_groups",
      )
    ).rows;
    await enroll(
      otherCourse,
      other.find((a) =>
        groups.find((g) => g.id === a.group_id)?.name.startsWith("4"),
      )!,
    );
    await enroll(
      otherSubject,
      other.find((a) => a.group_id === own.group_id)!,
    );
    await enroll(
      otherSchool,
      other.find(
        (a) => groups.find((g) => g.id === a.group_id)?.school_id === school2,
      )!,
      school2,
    );
    const roster = await db.query<{ student_id: string }>(
      `select e.student_id from academic_enrollments e join teaching_assignments t on t.group_id=e.group_id and t.subject_id=e.subject_id where t.teacher_id=$1 and t.status='approved'`,
      [teacher],
    );
    assert.deepEqual(
      roster.rows.map((r) => r.student_id),
      [student],
    );
    for (const [score, expected] of [
      [300, 7],
      [180, 4],
      [0, 1],
      [-1, 1],
      [999, 7],
    ])
      assert.equal(
        Number(
          (
            await db.query<{ g: string }>("select chilean_grade($1,0,300) g", [
              score,
            ])
          ).rows[0].g,
        ),
        expected,
      );
    const attempt = randomUUID();
    await db.query(
      "insert into mission_attempts(id,student_id,mission_id,content_version,state,score) values($1,$2,$3,$4,$5,8)",
      [
        attempt,
        student,
        "inicio-actividades",
        "inicio-1.0",
        { financialResult: { balance: 180, gained: 0, spent: 120 } },
      ],
    );
    assert.equal(
      Number(
        (
          await db.query<{ g: string }>(
            "select (scale->>'optimum') g from academic_results where attempt_id=$1",
            [attempt],
          )
        ).rows[0].g,
      ),
      300,
    );
    await db.exec(
      "update grading_scales set optimum=600,version=version+1 where mission_id='inicio-actividades'",
    );
    await db.query(
      "update mission_attempts set completed_at=now() where id=$1",
      [attempt],
    );
    assert.equal(
      Number(
        (
          await db.query<{ grade: string }>(
            "select grade from academic_results where attempt_id=$1",
            [attempt],
          )
        ).rows[0].grade,
      ),
      4,
    );
    const attempt2 = randomUUID();
    await db.query(
      "insert into mission_attempts(id,student_id,mission_id,content_version,state,score,completed_at) values($1,$2,$3,$4,$5,8,now())",
      [
        attempt2,
        student,
        "inicio-actividades",
        "inicio-1.0",
        { financialResult: { balance: 600, gained: 0, spent: 0 } },
      ],
    );
    const book = (
      await db.query<{ grade: string }>(
        "select grade from academic_gradebook where student_id=$1",
        [student],
      )
    ).rows;
    assert.equal(book.length, 1);
    assert.equal(Number(book[0].grade), 7);
    await db.query(
      "insert into game_progress(student_id,game_id,content_version,revision,state) values($1,$2,1,1,$3)",
      [
        student,
        "mision-tributos",
        { academicPerformance: { score: 60, completed: true } },
      ],
    );
    assert.equal(
      Number(
        (
          await db.query<{ grade: string }>(
            "select grade from academic_results where student_id=$1 and game_id=$2",
            [student, "mision-tributos"],
          )
        ).rows[0].grade,
      ),
      4,
    );
    await db.query(
      "update game_progress set state=$1 where student_id=$2 and game_id=$3",
      [
        { academicPerformance: { score: 30, completed: true } },
        student,
        "mision-tributos",
      ],
    );
    assert.equal(
      Number(
        (
          await db.query<{ grade: string }>(
            "select grade from academic_results where student_id=$1 and game_id=$2",
            [student, "mision-tributos"],
          )
        ).rows[0].grade,
      ),
      4,
    );
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select * from academic_results"));
    await assert.rejects(
      db.query("select save_academic_setup($1,$2)", [student, {}]),
    );
  } finally {
    await db.close();
  }
});

test("school consolidation preserves cohorts and records and resolves old school references", async () => {
  const db = new PGlite();
  try {
    await db.exec(
      `create table cities(id uuid primary key,name text);create table schools(id uuid primary key,city_id uuid references cities,name text);create table profiles(id uuid primary key,school_id uuid references schools,city_id uuid references cities);create table class_groups(id uuid primary key,school_id uuid references schools,school_year int,name_key text);create table courses(id uuid primary key,school_id uuid references schools);create table subscriptions(id uuid primary key,school_id uuid references schools);create table audit(action text,target_id text,details jsonb);create function registry_name(text) returns text language sql immutable as $$select lower(translate($1,'áéíóúñÁÉÍÓÚÑ','aeiounAEIOUN'))$$;`,
    );
    const fresia = randomUUID(),
      pm = randomUUID(),
      canonical = randomUUID(),
      duplicate = randomUUID(),
      group = randomUUID(),
      person = randomUUID();
    await db.query("insert into cities values($1,$2),($3,$4)", [
      fresia,
      "Fresia",
      pm,
      "Puerto Montt",
    ]);
    await db.query("insert into schools values($1,$2,$3),($4,$5,$3)", [
      canonical,
      fresia,
      "Liceo Carlos Ibáñez del Campo",
      duplicate,
      pm,
    ]);
    await db.query("insert into class_groups values($1,$2,2026,$3)", [
      group,
      duplicate,
      "3 administracion",
    ]);
    await db.query("insert into profiles values($1,$2,$3)", [
      person,
      duplicate,
      pm,
    ]);
    await db.exec(
      readFileSync(
        "supabase/migrations/010_school_registry_fresia.sql",
        "utf8",
      ),
    );
    assert.equal(
      (
        await db.query<{ school_id: string }>(
          "select school_id from class_groups where id=$1",
          [group],
        )
      ).rows[0].school_id,
      canonical,
    );
    assert.deepEqual(
      (
        await db.query("select school_id,city_id from profiles where id=$1", [
          person,
        ])
      ).rows[0],
      { school_id: canonical, city_id: fresia },
    );
    assert.equal(
      (await db.query<{ n: number }>("select count(*)::int n from schools"))
        .rows[0].n,
      2,
    );
    assert.equal(
      (
        await db.query<{ merged_into_id: string }>(
          "select merged_into_id from schools where id=$1",
          [duplicate],
        )
      ).rows[0].merged_into_id,
      canonical,
    );
    await db.query("insert into class_groups values($1,$2,2026,$3)", [
      randomUUID(),
      duplicate,
      "4 administracion",
    ]);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from class_groups where school_id=$1",
          [canonical],
        )
      ).rows[0].n,
      2,
    );
  } finally {
    await db.close();
  }
});
