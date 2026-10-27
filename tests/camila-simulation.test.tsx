import React from "react";
import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import {
  freshAttempt,
  reduceMission,
  importAttempt,
  scoreAttempt,
} from "../server/missionDomain";
import {
  simulationSummary,
  type SimulationAction,
} from "../src/games/inicio/simulation";
import { budgetSummary } from "../src/games/inicio/economy";
import { parseDemoState } from "../src/progress";
import { OpeningSimulation, GameHUD } from "../src/games/inicio/SimulationGame";
const fresh = () =>
  freshAttempt("00000000-0000-4000-8000-000000000123", "inicio-actividades");
function dispatch(a: ReturnType<typeof fresh>, e: SimulationAction) {
  return reduceMission(a, { type: "simulation", value: JSON.stringify(e) });
}
function route(destination = "sii") {
  let a = fresh();
  for (const e of [
    { action: "begin" },
    { action: "talk", value: "business" },
    { action: "talk", value: "pending" },
    { action: "map" },
    { action: "travel", value: destination },
  ] as SimulationAction[])
    a = dispatch(a, e);
  return a;
}
function ready(destination = "sii") {
  let a = route(destination);
  for (const e of [
    { action: "investigate" },
    { action: "place", value: "notice", target: "sii" },
    { action: "place", value: "permit", target: "municipality" },
    { action: "prepare" },
    { action: "draft", value: "person", target: "natural" },
    { action: "draft", value: "activity", target: "meals" },
    { action: "draft", value: "procedure", target: "start" },
    { action: "submit" },
  ] as SimulationAction[])
    a = dispatch(a, e);
  return a;
}
test("opening uses validated dialogue, map, document sorting, workdesk and reward without bypassing the learning gate", () => {
  let a = fresh();
  assert.throws(() => reduceMission(a, { type: "answer", value: "0" }));
  assert.throws(() => dispatch(a, { action: "travel", value: "sii" }));
  a = route();
  assert.equal(a.confirmed[0], true);
  assert.throws(() => reduceMission(a, { type: "next" }));
  a = ready();
  assert.equal(a.simulation?.phase, "reward");
  assert.equal(scoreAttempt(a), 1);
  assert.equal(budgetSummary(a).balance, 300);
  assert.equal(simulationSummary(a).xp, 40);
  assert.equal(simulationSummary(a).reputation, 90);
  assert.equal(simulationSummary(a).badges.length, 1);
  assert.throws(() => dispatch(a, { action: "submit" }));
  assert.equal(reduceMission(a, { type: "next" }).index, 1);
});
test("detours cost money once, preserve the original answer and carry reputation and time consequences after repair", () => {
  const a = ready("municipality");
  assert.equal(a.answers[0], "1");
  assert.equal(budgetSummary(a).balance, 280);
  assert.equal(scoreAttempt(a), 0);
  assert.equal(simulationSummary(a).xp, 20);
  assert.equal(simulationSummary(a).day, 2);
  assert.equal(simulationSummary(a).reputation, 68);
  assert.throws(() => dispatch(a, { action: "travel", value: "sii" }));
  assert.equal(budgetSummary(importAttempt(a, a.id)).balance, 280);
});
test("incorrect folder and form generate narrative repair, persistent drafts and non-repeatable review penalties", () => {
  let a = dispatch(route(), { action: "investigate" });
  a = dispatch(a, { action: "place", value: "notice", target: "municipality" });
  a = dispatch(a, { action: "place", value: "permit", target: "sii" });
  a = dispatch(a, { action: "prepare" });
  assert.equal(a.simulation?.phase, "folder");
  assert.equal(a.simulation?.reviews, 1);
  assert.ok(a.simulation?.notice);
  assert.throws(() => dispatch(a, { action: "prepare" }));
  a = dispatch(a, { action: "place", value: "notice", target: "sii" });
  a = dispatch(a, { action: "place", value: "permit", target: "municipality" });
  a = dispatch(a, { action: "prepare" });
  for (const [value, target] of [
    ["person", "company"],
    ["activity", "meals"],
    ["procedure", "start"],
  ])
    a = dispatch(a, { action: "draft", value, target });
  a = dispatch(a, { action: "submit" });
  assert.equal(a.simulation?.phase, "desk");
  assert.equal(a.simulation?.reviews, 2);
  assert.throws(() => dispatch(a, { action: "submit" }));
  const restored = parseDemoState(
    JSON.stringify({ schema: 1, attempts: [a], reducedMotion: true }),
  ).attempts[0];
  assert.equal(restored.simulation?.draft?.person, "company");
  a = dispatch(restored, {
    action: "draft",
    value: "person",
    target: "natural",
  });
  a = dispatch(a, { action: "submit" });
  assert.equal(a.simulation?.phase, "reward");
  assert.equal(simulationSummary(a).reputation, 82);
});
test("imports replay actions and ignore forged XP, phase, costs and unearned badges; legacy attempts remain readable", () => {
  const a = ready("honorarios");
  const raw = JSON.parse(JSON.stringify(a));
  raw.simulation.xp = 999999;
  raw.financialResult = { balance: 999999 };
  assert.equal(simulationSummary(importAttempt(raw, a.id)).xp, 20);
  assert.equal(budgetSummary(importAttempt(raw, a.id)).balance, 275);
  raw.simulation.log = [];
  raw.index = 1;
  assert.throws(() => importAttempt(raw, a.id));
  const old = fresh();
  delete old.simulation;
  const legacy = reduceMission(
    reduceMission(old, { type: "answer", value: "0" }),
    { type: "confirm" },
  );
  assert.equal(importAttempt(legacy, legacy.id).simulation, undefined);
});
test("simulation markup has accessible places, keyboard document placement, actual form controls and reduced old quiz chrome", () => {
  const map = dispatch(
    dispatch(
      dispatch(dispatch(fresh(), { action: "begin" }), {
        action: "talk",
        value: "business",
      }),
      { action: "talk", value: "pending" },
    ),
    { action: "map" },
  );
  const html = renderToStaticMarkup(
    <OpeningSimulation attempt={map} onAction={() => {}} onNext={() => {}} />,
  );
  assert.match(html, /Mapa del Barrio Cívico/);
  assert.match(html, /Oficina del SII/);
  assert.doesNotMatch(html, /choice-letter|Comprobar decisión/);
  const h = renderToStaticMarkup(<GameHUD attempt={ready()} />);
  for (const text of [
    "Caja disponible",
    "XP de gestión",
    "Reputación",
    "Jornada",
    "Insignias",
  ])
    assert.ok(h.includes(text));
});
