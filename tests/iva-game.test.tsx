import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  freshAttempt,
  reduceMission,
  importAttempt,
  scoreAttempt,
} from "../server/missionDomain";
import { applyIva, type IvaFields } from "../src/games/iva/domain";
import { IvaGame, IvaOutcome } from "../src/games/iva/Game";
import { parseDemoState } from "../src/progress";
const stages: IvaFields[] = [
  { a: "purchase", b: "sale" },
  { base: "200000", amount: "38000" },
  { debit: "38000", credit: "19000", operation: "subtract", amount: "19000" },
];
const event = (fields: IvaFields, action = "check") => ({
  type: "iva",
  value: JSON.stringify({ action, fields }),
});
function completed() {
  let a = freshAttempt(randomUUID(), "mision-iva");
  for (const fields of stages) {
    a = reduceMission(a, event(fields));
    a = reduceMission(a, { type: "next" });
  }
  a = reduceMission(a, {
    type: "evidence",
    value:
      "Diego, descontamos el crédito admitido del débito de ventas; antes revisaría los documentos y los requisitos aplicables.",
  });
  return reduceMission(a, { type: "complete" });
}
test("IVA: three interactive desks and final evidence use the existing three-criterion score", () => {
  const a = completed();
  assert.equal(scoreAttempt(a), 3);
  assert.ok(a.completedAt);
  assert.deepEqual(a.answers, ["1", "38000", "1"]);
  const imported = importAttempt(a, randomUUID());
  assert.equal(scoreAttempt(imported), 3);
  assert.deepEqual(imported.iva, a.iva);
  assert.throws(() => reduceMission(a, event(stages[0])));
});
test("IVA: wrong base, reversed ledger, wrong operation or amount cannot claim a correct canonical score", () => {
  let a = freshAttempt(randomUUID(), "mision-iva");
  a = reduceMission(a, event({ a: "purchase", b: "purchase" }));
  assert.equal(scoreAttempt(a), 0);
  a = reduceMission(a, { type: "next" });
  const wrongBase = reduceMission(
    a,
    event({ base: "238000", amount: "38000" }),
  );
  assert.equal(wrongBase.answers[1], "0");
  a = reduceMission(a, event(stages[1]));
  a = reduceMission(a, { type: "next" });
  for (const fields of [
    { ...stages[2], debit: "19000", credit: "38000" },
    { ...stages[2], operation: "add" },
    { ...stages[2], amount: "57000" },
  ])
    assert.notEqual(reduceMission(a, event(fields)).answers[2], "1");
});
test("IVA: draft save/restoration, locks, validation and local import recompute answers without trusting browser results", () => {
  let a = freshAttempt(randomUUID(), "mision-iva");
  assert.throws(() => reduceMission(a, event({ a: "purchase" })));
  assert.throws(() => reduceMission(a, event({ ...stages[0], injected: "1" })));
  assert.throws(() =>
    applyIva(
      { ...a, missionSlug: "rescate-invernadero" },
      { action: "check", fields: stages[0] },
    ),
  );
  a = reduceMission(a, event({ a: "purchase" }, "save"));
  assert.equal(a.confirmed[0], undefined);
  assert.equal(a.answers[0], "");
  assert.throws(() => reduceMission(a, { type: "confirm" }));
  assert.throws(() => reduceMission(a, { type: "answer", value: "1" }));
  const restored = parseDemoState(JSON.stringify({ schema: 1, attempts: [a] }))
    .attempts[0];
  assert.deepEqual(restored.iva, a.iva);
  a = reduceMission(a, event(stages[0]));
  assert.throws(() => reduceMission(a, event(stages[0])));
  const forged = { ...a, answers: ["0"] };
  assert.equal(importAttempt(forged, randomUUID()).answers[0], "1");
  const normalized = parseDemoState(
    JSON.stringify({ schema: 1, attempts: [forged] }),
  ).attempts[0];
  assert.equal(normalized.answers[0], "1");
  assert.throws(() =>
    parseDemoState(
      JSON.stringify({
        schema: 1,
        attempts: [
          { ...a, iva: { version: 1, drafts: { 0: { a: "invalid" } } } },
        ],
      }),
    ),
  );
  assert.throws(() => reduceMission(a, { type: "complete" }));
});
test("IVA: historical questionnaire attempts resume and import without losing answers or scores", () => {
  let a = freshAttempt(randomUUID(), "mision-iva");
  for (const answer of ["1", "38000", "1"]) {
    a = reduceMission(a, { type: "answer", value: answer });
    a = reduceMission(a, { type: "confirm" });
    a = reduceMission(a, { type: "next" });
  }
  a = reduceMission(a, {
    type: "evidence",
    value:
      "Registro anterior: el crédito del caso se descuenta del débito para determinar el saldo.",
  });
  a = reduceMission(a, { type: "complete" });
  const restored = importAttempt(a, randomUUID());
  assert.equal(scoreAttempt(restored), 3);
  assert.equal(restored.iva, undefined);
});
test("IVA: mobile-friendly labeled game and evidence render with preserved character photo, without exposing the calculated IVA", () => {
  let a = freshAttempt(randomUUID(), "mision-iva");
  a = reduceMission(a, event(stages[0]));
  a = reduceMission(a, { type: "next" });
  const noop = () => {};
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <IvaGame
        attempt={a}
        onAction={noop}
        onNext={noop}
        evidence=""
        onEvidence={noop}
        onSaveEvidence={noop}
        onComplete={noop}
      />
    </MemoryRouter>,
  );
  assert.ok(html.includes("La calculadora del mes"));
  assert.ok(html.includes("Por calcular"));
  assert.ok(html.includes('inputMode="numeric"'));
  assert.ok(html.includes('aria-pressed="false"'));
  assert.ok(!html.includes("$38.000"));
  assert.ok(html.includes("tributos-vecinos.webp"));
  const done = completed();
  assert.ok(
    renderToStaticMarkup(<IvaOutcome attempt={done} />).includes(
      "Los tres encargos",
    ),
  );
});
