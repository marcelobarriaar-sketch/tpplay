import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import type { IncomingMessage, ServerResponse } from "node:http";
import { createSession } from "../server/admin";
import handler from "../server/modules";
import { orderedMissionIds } from "../src/modules";
test("Module ordering preserves all available missions and drops unknown ids", () => {
  assert.deepEqual(
    orderedMissionIds("administracion/gestion-comercial-y-tributaria", [
      "mision-iva",
      "unknown",
      "mision-iva",
    ]),
    ["mision-iva", "mision-tributos", "inicio-actividades"],
  );
});
test("Module editor requires admin session and same origin before data access", async () => {
  const secret = "test-session-secret-at-least-thirty-two-characters";
  process.env.ADMIN_SESSION_SECRET = secret;
  process.env.ADMIN_USER = "admin";
  async function request(headers: Record<string, string>, body: unknown) {
    const req = Readable.from([]) as unknown as IncomingMessage & {
      body: unknown;
    };
    req.method = "POST";
    req.headers = headers;
    req.body = body;
    let status = 0;
    let data = "";
    const res = {
      setHeader() {},
      set statusCode(v: number) {
        status = v;
      },
      end(v: string) {
        data = v;
      },
    } as unknown as ServerResponse;
    await handler(req, res);
    return { status, data };
  }
  assert.equal(
    (await request({ host: "tpplay.cl", origin: "https://tpplay.cl" }, {}))
      .status,
    401,
  );
  const cookie = `tpplay_admin=${createSession("admin", secret)}`;
  assert.equal(
    (
      await request(
        { host: "tpplay.cl", origin: "https://elsewhere.example", cookie },
        {},
      )
    ).status,
    403,
  );
  assert.equal(
    (
      await request(
        {
          host: "tpplay.cl",
          origin: "https://tpplay.cl",
          cookie,
          "content-type": "text/plain",
        },
        {},
      )
    ).status,
    415,
  );
});
