import { test } from "node:test";
import assert from "node:assert/strict";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { createClient } from "@supabase/supabase-js";
import { learningHandler } from "../server/learning";
const verifiedToken =
  "header." +
  Buffer.from(
    JSON.stringify({
      sub: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      session_id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    }),
  ).toString("base64url") +
  ".signature";
const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  other = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
// An isolated provider adapter verifies the HTTP authorization boundary without claiming a live Supabase deployment.
function fixture(
  role = "student",
  active = true,
  verified = true,
  valid = true,
) {
  const reads: { table: string; filters: [string, unknown][] }[] = [];
  const factory = (() => ({
    auth: {
      getUser: async (token: string) => ({
        error: !valid || token !== verifiedToken ? new Error("rejected") : null,
        data: {
          user: {
            id,
            email_confirmed_at: verified ? "2026-10-08" : null,
            user_metadata: { role: "admin" },
          },
        },
      }),
    },
    rpc: async () => ({ data: true, error: null }),
    from(table: string) {
      const record = { table, filters: [] as [string, unknown][] };
      reads.push(record);
      const builder = {
        select() {
          return builder;
        },
        eq(key: string, value: unknown) {
          record.filters.push([key, value]);
          return builder;
        },
        order() {
          return builder;
        },
        range() { return builder; },
        not() { return builder; },
        maybeSingle() {
          return Promise.resolve({
            data:
              table === "profiles"
                ? { id, name: "Alumno", role, active }
                : table === "courses"
                  ? { id: other, teacher_id: other }
                  : null,
            error: null,
          });
        },
        then(resolve: (value: unknown) => unknown) {
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
      };
      return builder;
    },
  })) as unknown as typeof createClient;
  return { handler: learningHandler(factory), reads };
}
async function call(
  handler: ReturnType<typeof learningHandler>,
  path: string,
  {
    method = "GET",
    token = verifiedToken,
    origin = "https://tpplay.test",
    body = {},
  } = {},
) {
  let output = "";
  const response = {
    statusCode: 0,
    setHeader() {},
    end(value: string) {
      output = value;
    },
  } as unknown as ServerResponse;
  const request = {
    url: "/api/learning?action=" + path,
    method,
    body,
    headers: {
      authorization: "Bearer " + token,
      origin,
      "content-type": "application/json",
      host: "tpplay.test",
    },
  } as unknown as IncomingMessage;
  await handler(request, response);
  return { status: response.statusCode, data: JSON.parse(output) };
}
test("API trusts confirmed provider identity and stored role, rejecting fake roles, revoked profiles and other courses", async () => {
  const previous = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    TPPLAY_APP_ORIGIN: process.env.TPPLAY_APP_ORIGIN,
  };
  process.env.SUPABASE_URL = "https://isolated.test";
  process.env.SUPABASE_SECRET_KEY = "test-only";
  process.env.TPPLAY_APP_ORIGIN = "https://tpplay.test";
  try {
    let f = fixture();
    for (const role of ["student", "teacher", "institution_admin"]) {
      const restricted = fixture(role);
      assert.equal(
        (await call(restricted.handler, "roleAccess&role=admin")).status,
        403,
      );
      assert.equal((await call(restricted.handler, "adminUsers")).status, 403);
      if (role === "student")
        assert.equal(
          (await call(restricted.handler, "roleAccess&role=teacher")).status,
          403,
        );
    }
    assert.equal(
      (await call(fixture("admin").handler, "roleAccess&role=admin")).status,
      200,
    );
    for (const body of [
      { role: "admin" },
      { xp: 99999 },
      { student_id: other },
    ])
      assert.equal(
        (await call(f.handler, "event", { method: "POST", body })).status,
        403,
      );
    assert.equal(
      (
        await call(fixture("admin").handler, "adminUser", {
          method: "POST",
          body: { id: other, role: "admin" },
        })
      ).status,
      403,
    );
    assert.equal((await call(f.handler, "ranking")).status, 200);
    assert.ok(f.reads.find(r=>r.table==='xp_events')?.filters.some(([k,v])=>k==='profiles.role'&&v==='student'));
    assert.equal((await call(f.handler, "ranking", {method:'POST'})).status,405);
    assert.equal((await call(f.handler, "courses")).status, 403); // claimed metadata admin is ignored
    assert.equal(
      (await call(f.handler, "progress&student=" + other)).status,
      200,
    );
    assert.ok(
      f.reads
        .filter((r) => ["game_progress", "evidence"].includes(r.table))
        .every((r) =>
          r.filters.some(
            ([key, value]) => key === "student_id" && value === id,
          ),
        ),
    );
    assert.equal(
      (
        await call(f.handler, "event", {
          method: "POST",
          origin: "https://evil.test",
        })
      ).status,
      403,
    );
    f = fixture("student", false);
    assert.equal((await call(f.handler, "me")).status, 403);
    f = fixture("student", true, false);
    assert.equal((await call(f.handler, "me")).status, 403);
    f = fixture("student", true, true, false);
    assert.equal((await call(f.handler, "me")).status, 401);
    f = fixture("teacher");
    assert.equal(
      (await call(f.handler, "evidence&course=" + other + "&student=" + id))
        .status,
      403,
    );
    assert.ok(!f.reads.some((r) => r.table === "evidence"));
    f = fixture("teacher");
    assert.equal((await call(f.handler, "ranking")).status, 403);
    assert.equal((await call(f.handler, "courses")).status, 200);
    assert.ok(
      f.reads
        .find((r) => r.table === "courses")
        ?.filters.some(([k, v]) => k === "teacher_id" && v === id),
    );
    delete process.env.SUPABASE_SECRET_KEY;
    assert.equal((await call(f.handler, "me")).status, 503);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
