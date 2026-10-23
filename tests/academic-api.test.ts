import test from "node:test";
import assert from "node:assert/strict";
import { academicAction, chileBoundary } from "../server/academics";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Profile } from "../src/accounts/model";
const owner = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  assignmentId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  group = "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
  subject = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
  enrollment = "ffffffff-ffff-4fff-8fff-ffffffffffff";
function fixture(teacher = owner, status = "approved") {
  const reads: { table: string; filters: [string, unknown][] }[] = [];
  const db = {
    from(table: string) {
      const r = { table, filters: [] as [string, unknown][] };
      reads.push(r);
      const q = {
        select() {
          return q;
        },
        eq(k: string, v: unknown) {
          r.filters.push([k, v]);
          return q;
        },
        in(k: string, v: unknown) {
          r.filters.push([k, v]);
          return q;
        },
        order() {
          return q;
        },
        range() {
          return q;
        },
        limit() {
          return q;
        },
        maybeSingle() {
          return Promise.resolve({
            data:
              table === "teaching_assignments"
                ? {
                    id: assignmentId,
                    teacher_id: teacher,
                    status,
                    group_id: group,
                    subject_id: subject,
                  }
                : null,
            error: null,
          });
        },
        then(resolve: (v: unknown) => unknown) {
          return Promise.resolve({
            data:
              table === "academic_enrollments"
                ? [{ id: enrollment, student_id: other }]
                : [],
            error: null,
          }).then(resolve);
        },
      };
      return q;
    },
  } as unknown as SupabaseClient;
  const actor = {
    id: owner,
    role: "teacher",
    active: true,
    school_id: null,
    city_id: null,
    name: "Docente",
  } as Profile;
  return { db, reads, actor };
}
test("academic API scopes every roster and grade read to the approved teacher, group and subject", async () => {
  const f = fixture();
  const r = await academicAction(
    f.db,
    f.actor,
    "academicRows",
    {},
    new URLSearchParams({ assignment: assignmentId }),
  );
  assert.ok(r);
  const cohort = f.reads.find((r) => r.table === "academic_enrollments")!;
  assert.deepEqual(cohort.filters, [
    ["group_id", group],
    ["subject_id", subject],
  ]);
  for (const table of ["academic_results", "academic_gradebook"])
    assert.deepEqual(f.reads.find((r) => r.table === table)?.filters[0], [
      "enrollment_id",
      [enrollment],
    ]);
});
test("another teacher, unapproved assignment, forged enrollment and unauthorized grade edit are rejected on server", async () => {
  for (const [teacher, status] of [
    [other, "approved"],
    [owner, "pending"],
  ]) {
    const f = fixture(teacher, status);
    await assert.rejects(
      academicAction(
        f.db,
        f.actor,
        "academicRows",
        {},
        new URLSearchParams({ assignment: assignmentId }),
      ),
    );
    assert.ok(!f.reads.some((r) => r.table === "academic_enrollments"));
  }
  const f = fixture();
  await assert.rejects(
    academicAction(
      f.db,
      f.actor,
      "academicScale",
      { mission_id: "inicio-actividades" },
      new URLSearchParams(),
    ),
  );
  await assert.rejects(
    academicAction(
      f.db,
      f.actor,
      "academicDetail",
      {},
      new URLSearchParams({ assignment: assignmentId, id: other }),
    ),
  );
});
test("Chile date filters use the seasonal timezone offset", () => {
  assert.match(chileBoundary("2026-07-10"), /-04:00$/);
  assert.match(chileBoundary("2026-10-23"), /-03:00$/);
});
