import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import readExcel from "read-excel-file/node";
import {
  validateRoster,
  rosterFromCells,
} from "../src/accounts/rosterValidation";
import { mailFailure, rosterAssignment } from "../server/rosterImport";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../src/accounts/model";
test("Excel roster validation catches duplicate normalized emails, missing names and formula-like values", () => {
  assert.equal(
    validateRoster([
      { first_name: "Ana", last_name: "Soto", email: " ANA@EXAMPLE.CL " },
    ]).students[0].email,
    "ana@example.cl",
  );
  assert.ok(
    validateRoster([
      { first_name: "Ana", last_name: "Soto", email: "ana@example.cl" },
      { first_name: "Ana", last_name: "Soto", email: "ANA@example.cl" },
    ]).errors.length,
  );
  assert.ok(
    validateRoster([
      { first_name: "=HYPERLINK()", last_name: "", email: "bad" },
    ]).errors.length,
  );
  assert.ok(validateRoster(Array(201).fill({})).errors.length);
  assert.throws(() => rosterFromCells([["RUT", "Clave"]]));
});
test("downloadable template reads with the deployed parser and contains no sample identities", async () => {
  const sheets = await readExcel("public/plantillas/alumnos-tpplay.xlsx");
  const data = sheets.find((s) => s.sheet === "Alumnos")?.data;
  assert.ok(data);
  assert.deepEqual(data[0], ["Nombres", "Apellidos", "Correo"]);
  assert.equal(rosterFromCells(data).students.length, 0);
});
test("imports require approved ownership even with a forged assignment and report concrete mail limits", async () => {
  const actor = { id: randomUUID(), role: "teacher" } as Profile;
  const db = {
    from() {
      return {
        select() {
          return this;
        },
        eq() {
          return this;
        },
        async maybeSingle() {
          return {
            data: { teacher_id: randomUUID(), status: "approved" },
            error: null,
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  await assert.rejects(rosterAssignment(db, actor, randomUUID()));
  assert.match(mailFailure({ status: 429 }), /límite/);
  assert.match(mailFailure({ message: "SMTP sending error" }), /SMTP/);
});
test("bulk onboarding keeps terms unaccepted, enrollment scoped, and row leases idempotent", async () => {
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
      "010_school_registry_fresia.sql",
      "011_roster_import.sql",
    ])
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    const school = randomUUID(),
      teacher = randomUUID(),
      student = randomUUID(),
      batch = randomUUID();
    await db.query(
      "insert into schools(id,city_id,name) values($1,'11111111-1111-4111-8111-111111111111','Colegio de integración')",
      [school],
    );
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [
        teacher,
        "teacher@example.test",
        {
          first_name: "Docente",
          last_name: "Integración",
          initial_role: "teacher",
          terms_version: "2026-10",
        },
      ],
    );
    await db.query("select save_academic_setup($1,$2)", [
      teacher,
      {
        school_id: school,
        year: 2026,
        pairs: [
          {
            group_name: "3 Administración",
            subject_name: "Gestión Comercial y Tributaria",
          },
        ],
      },
    ]);
    const a = (
      await db.query<{ id: string; group_id: string; subject_id: string }>(
        "update teaching_assignments set status='approved' returning *",
      )
    ).rows[0];
    await db.query(
      "insert into roster_imports(id,teacher_id,assignment_id,fingerprint) values($1,$2,$3,$4)",
      [batch, teacher, a.id, "hash"],
    );
    await db.query(
      "insert into roster_import_rows(import_id,position,first_name,last_name,email) values($1,1,'Ana','Soto','ana@example.test')",
      [batch],
    );
    const row = (
      await db.query<{ id: string; lease: string }>(
        "select * from claim_roster_row($1)",
        [batch],
      )
    ).rows[0];
    assert.equal(
      (await db.query("select * from claim_roster_row($1)", [batch])).rows
        .length,
      0,
    );
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,$2,$3)",
      [
        student,
        "ana@example.test",
        {
          first_name: "Ana",
          last_name: "Soto",
          initial_role: "student",
          registration_source: "teacher_excel",
          academic_setup: {
            school_id: school,
            year: 2026,
            pairs: [{ group_id: a.group_id, subject_id: a.subject_id }],
          },
        },
      ],
    );
    const p = (
      await db.query<{
        onboarding_required: boolean;
        terms_accepted_at: null;
        school_id: string;
      }>("select * from profiles where id=$1", [student])
    ).rows[0];
    assert.equal(p.onboarding_required, true);
    assert.equal(p.terms_accepted_at, null);
    assert.equal(p.school_id, school);
    await db.query("select finish_roster_row($1,$2,$3,true)", [
      row.id,
      row.lease,
      student,
    ]);
    assert.equal(
      (
        await db.query<{ n: number }>(
          "select count(*)::int n from academic_enrollments where student_id=$1",
          [student],
        )
      ).rows[0].n,
      1,
    );
    await assert.rejects(
      db.query("select finish_roster_row($1,$2,$3,true)", [
        row.id,
        row.lease,
        student,
      ]),
    );
    assert.equal(
      (
        await db.query<{ status: string }>(
          "select status from roster_import_rows where id=$1",
          [row.id],
        )
      ).rows[0].status,
      "invited",
    );
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select * from roster_import_rows"));
    await assert.rejects(
      db.query("select * from claim_roster_row($1)", [batch]),
    );
  } finally {
    await db.close();
  }
});

test("server sends one invitation without a password and never reinvites or overwrites an existing account", async () => {
  const { rosterAction } = await import("../server/rosterImport");
  const teacher = randomUUID(),
    assignment = randomUUID(),
    batch = randomUUID(),
    student = randomUUID(),
    school = randomUUID(),
    row = randomUUID(),
    lease = randomUUID();
  let created = false,
    finished = false,
    invites = 0;
  const actor = { id: teacher, role: "teacher", active: true } as Profile;
  const db = {
    auth: {
      admin: {
        async inviteUserByEmail(
          email: string,
          options: { data: Record<string, unknown>; redirectTo: string },
        ) {
          invites++;
          assert.equal(email, "ana@example.test");
          assert.equal(
            options.redirectTo,
            "https://www.tpplay.cl/cuenta/activar",
          );
          assert.equal("password" in options.data, false);
          assert.equal("terms_version" in options.data, false);
          created = true;
          return { data: { user: { id: student } }, error: null };
        },
      },
    },
    from(table: string) {
      const q = {
        select() {
          return q;
        },
        eq() {
          return q;
        },
        ilike() {
          return q;
        },
        async maybeSingle() {
          return {
            data:
              table === "roster_imports"
                ? { id: batch, teacher_id: teacher, assignment_id: assignment }
                : table === "teaching_assignments"
                  ? {
                      id: assignment,
                      status: "approved",
                      teacher_id: teacher,
                      group_id: randomUUID(),
                      subject_id: randomUUID(),
                      class_groups: { school_id: school, school_year: 2026 },
                    }
                  : table === "profiles" && created
                    ? {
                        id: student,
                        role: "student",
                        active: true,
                        school_id: school,
                      }
                    : null,
            error: null,
          };
        },
      };
      return q;
    },
    async rpc(name: string) {
      if (name === "claim_roster_row")
        return {
          data: finished
            ? []
            : [
                {
                  id: row,
                  lease,
                  email: "ana@example.test",
                  first_name: "Ana",
                  last_name: "Soto",
                },
              ],
          error: null,
        };
      if (name === "finish_roster_row") {
        finished = true;
        return { data: null, error: null };
      }
      throw Error(name);
    },
  } as unknown as SupabaseClient;
  await rosterAction(
    db,
    actor,
    "rosterProcess",
    { id: batch },
    new URLSearchParams(),
    "https://www.tpplay.cl",
  );
  assert.equal(invites, 1);
  assert.equal(finished, true);
  await rosterAction(
    db,
    actor,
    "rosterProcess",
    { id: batch },
    new URLSearchParams(),
    "https://www.tpplay.cl",
  );
  assert.equal(invites, 1);
  finished = false;
  await rosterAction(
    db,
    actor,
    "rosterProcess",
    { id: batch },
    new URLSearchParams(),
    "https://www.tpplay.cl",
  );
  assert.equal(invites, 1);
  assert.equal(finished, true);
});
