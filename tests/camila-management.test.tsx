import { EvaluationCard } from "../src/games/inicio/EvaluationCard";
import { contextualEvaluator } from "../src/games/inicio/evaluation";
import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import {
  freshAttempt,
  reduceMission,
  importAttempt,
  scoreAttempt,
} from "../server/missionDomain";
import {
  managementAnswer,
  managementRecord,
  savedManagementFields,
  type ManagementFields,
} from "../src/games/inicio/management";
import {
  ManagementGame,
  ManagementRecord,
} from "../src/games/inicio/ManagementGame";
import { budgetSummary, decisionImpact } from "../src/games/inicio/economy";
const correct: Record<number, ManagementFields> = {
  1: { origin: "office", channel: "portal" },
  2: { food: "1", sale: "1", catalog: "yes" },
  3: { first: "oct", second: "nov", deadline: "month-end" },
  4: {
    arriendo: "folder",
    equipamiento: "folder",
    antiguo: "outside",
    clave: "outside",
  },
  5: { activity: "meals", address: "120", date: "2026-09-12" },
  6: {
    opened: "yes",
    documents: "truthful",
    privacy: "private",
    scope: "review",
  },
  7: { receipt: "archived", municipal: "consult", health: "consult" },
};
function beginning() {
  let a = freshAttempt(
    "00000000-0000-4000-8000-000000000199",
    "inicio-actividades",
  );
  delete a.simulation;
  a = reduceMission(a, { type: "answer", value: "0" });
  a = reduceMission(a, { type: "confirm" });
  return reduceMission(a, { type: "next" });
}
function fields(a: ReturnType<typeof beginning>, f: ManagementFields) {
  for (const [field, value] of Object.entries(f))
    a = reduceMission(a, {
      type: "manage",
      value: JSON.stringify({ field, value }),
    });
  return a;
}
test("seven distinct management stages save every gesture, import canonically, preserve original outcomes and reach the written evidence", () => {
  let a = beginning();
  for (let i = 1; i <= 7; i++) {
    assert.equal(a.index, i);
    a = fields(a, correct[i]);
    const answer = managementAnswer(i, correct[i]);
    assert.equal(a.answers[i], answer);
    assert.equal(decisionImpact(i, answer)?.cost, 0);
    a = importAttempt(JSON.parse(JSON.stringify(a)), a.id);
    assert.deepEqual(a.management?.drafts[i], correct[i]);
    a = reduceMission(a, { type: "confirm" });
    assert.equal(budgetSummary(a).balance, 300);
    assert.throws(() => reduceMission(a, { type: "confirm" }));
    assert.throws(() => fields(a, correct[i]));
    a = reduceMission(a, { type: "next" });
  }
  assert.equal(a.index, 8);
  assert.equal(scoreAttempt(a), 8);
  assert.equal(a.completedAt, undefined);
  assert.throws(() => reduceMission(a, { type: "complete" }));
  const imported = importAttempt(a, a.id);
  assert.equal(scoreAttempt(imported), 8);
  assert.equal(managementRecord(imported).length, 7);
  const record = renderToStaticMarkup(
    <MemoryRouter>
      <ManagementRecord attempt={imported} />
    </MemoryRouter>,
  );
  assert.match(record, /Avenida Coihue 120/);
  assert.match(record, /Antecedentes verdaderos/);
});
test("unfinished interactions remain unfinished after reload; forged answers and fields cannot bypass a workbench", () => {
  let a = fields(beginning(), { origin: "restaurant" });
  assert.equal(a.answers[1], "");
  assert.throws(() => reduceMission(a, { type: "confirm" }));
  const restored = importAttempt(
    { ...a, answers: ["0", "1"], xp: 999, balance: 999 },
    a.id,
  );
  assert.equal(restored.answers[1], "");
  assert.equal(savedManagementFields(restored).origin, "restaurant");
  assert.throws(() => reduceMission(a, { type: "answer", value: "1" }));
  assert.throws(() => fields(a, { origin: "unknown" }));
  assert.throws(() => fields(a, { amount: "999" }));
  assert.throws(() =>
    importAttempt(
      {
        ...a,
        management: {
          version: 1,
          drafts: { 1: { origin: "restaurant", award: "999" } },
        },
      },
      a.id,
    ),
  );
});
test("inefficient decisions preserve existing costs and consequences exactly once, including dossier privacy mistakes", () => {
  const wrong: Record<number, ManagementFields> = {
    1: { origin: "restaurant", channel: "wait" },
    2: { transport: "1", catalog: "no" },
    3: { first: "sep", second: "oct", deadline: "month-end" },
    4: {
      arriendo: "folder",
      equipamiento: "outside",
      antiguo: "folder",
      clave: "folder",
    },
    5: { activity: "meals", address: "210", date: "2026-09-12" },
    6: {
      opened: "yes",
      documents: "truthful",
      privacy: "share",
      scope: "review",
    },
    7: { receipt: "archived", municipal: "approved", health: "consult" },
  };
  let a = beginning(),
    cost = 0;
  for (let i = 1; i <= 7; i++) {
    a = fields(a, wrong[i]);
    const answer = a.answers[i];
    cost += decisionImpact(i, answer)!.cost;
    a = reduceMission(a, { type: "confirm" });
    assert.equal(budgetSummary(a).spent, cost);
    a = importAttempt(JSON.parse(JSON.stringify(a)), a.id);
    assert.equal(budgetSummary(a).spent, cost);
    if (i < 7) a = reduceMission(a, { type: "next" });
  }
  assert.equal(a.answers[4], "13");
  assert.equal(a.answers[6], "0");
  assert.equal(scoreAttempt(a), 1);
});
test("historical unfinished and confirmed choices resume without losing saved answers", () => {
  let a = reduceMission(beginning(), { type: "answer", value: "2" });
  assert.equal(savedManagementFields(a).channel, "treasury");
  a = fields(a, { origin: "restaurant" });
  assert.equal(a.answers[1], "2");
  a = reduceMission(a, { type: "confirm" });
  const original = JSON.stringify(a);
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <ManagementGame
        attempt={a}
        onAction={() => {}}
        onConfirm={() => {}}
        onNext={() => {}}
      />
    </MemoryRouter>,
  );
  assert.match(html, /EL EXPEDIENTE TIENE UNA CONSECUENCIA/);
  assert.match(html, /Continuar a la siguiente misión/);
  assert.equal(JSON.stringify(a), original);
});
test("workspaces expose tasks rather than A/B/C radio forms; all initial actions require a constructed response", () => {
  let a = beginning();
  for (let i = 1; i <= 7; i++) {
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ManagementGame
          attempt={a}
          onAction={() => {}}
          onConfirm={() => {}}
          onNext={() => {}}
        />
      </MemoryRouter>,
    );
    assert.doesNotMatch(html, /type="radio"/);
    assert.match(html, /Completa el encargo/);
    assert.match(html, /disabled=""/);
    a = fields(a, correct[i]);
    a = reduceMission(a, { type: "confirm" });
    a = reduceMission(a, { type: "next" });
  }
});

test("a closed low explanation no longer offers retries inside a finished attempt", () => {
  const note = contextualEvaluator.evaluate(
    "Camila debe informar al SII el inicio de su negocio.",
    1,
  );
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <EvaluationCard history={[note]} closed />
    </MemoryRouter>,
  );
  assert.match(html, /Este intento quedó cerrado/);
  assert.doesNotMatch(html, /Te quedan/);
});
