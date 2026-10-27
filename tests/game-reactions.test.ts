import test from "node:test";
import assert from "node:assert/strict";
import {
  freshAttempt,
  reduceMission,
  scoreAttempt,
} from "../server/missionDomain";
import {
  gameReactions,
  openingReactions,
  enqueueReactions,
  reactionPosition,
} from "../src/games/reactions/reactions";
import { budgetSummary } from "../src/games/inicio/economy";
import type { SimulationAction } from "../src/games/inicio/simulation";
const fresh = () => freshAttempt("reaction-test", "inicio-actividades");
const step = (a: ReturnType<typeof fresh>, event: SimulationAction) =>
  reduceMission(a, { type: "simulation", value: JSON.stringify(event) });
function route(place: string) {
  let a = fresh();
  for (const e of [
    { action: "begin" },
    { action: "talk", value: "business" },
    { action: "talk", value: "pending" },
    { action: "map" },
  ] as SimulationAction[])
    a = step(a, e);
  return { before: a, after: step(a, { action: "travel", value: place }) };
}
test("accepted route emits actual monetary and reputation changes, without changing the attempt or score", () => {
  for (const [place, kind, amount] of [
    ["sii", "success", 0],
    ["portal", "success", 0],
    ["municipality", "loss", -20],
    ["honorarios", "loss", -25],
  ] as const) {
    const { before, after } = route(place);
    const snapshot = JSON.stringify(after);
    const events = openingReactions(before, after);
    assert.equal(events.length, 1);
    assert.equal(events[0].type, kind);
    assert.equal(events[0].amount, amount);
    assert.equal(events[0].xp, 0);
    assert.equal(JSON.stringify(after), snapshot);
    assert.equal(budgetSummary(after).balance, 300 + amount);
    assert.equal(scoreAttempt(after), kind === "success" ? 1 : 0);
    assert.deepEqual(openingReactions(after, after), []);
  }
});
test("document correction emits loss; folder success and tributary preparation emit distinct reactions with real XP", () => {
  let a = step(route("sii").after, { action: "investigate" });
  let b = step(a, { action: "prepare" });
  assert.equal(openingReactions(a, b)[0].type, "loss");
  assert.equal(openingReactions(a, b)[0].amount, 0);
  assert.equal(openingReactions(a, b)[0].reputation, -4);
  a = b;
  for (const e of [
    { action: "place", value: "notice", target: "sii" },
    { action: "place", value: "permit", target: "municipality" },
  ] as SimulationAction[])
    a = step(a, e);
  b = step(a, { action: "prepare" });
  assert.equal(openingReactions(a, b)[0].type, "success");
  a = b;
  for (const e of [
    { action: "draft", value: "person", target: "natural" },
    { action: "draft", value: "activity", target: "meals" },
    { action: "draft", value: "procedure", target: "start" },
  ] as SimulationAction[]) {
    b = step(a, e);
    assert.deepEqual(openingReactions(a, b), []);
    a = b;
  }
  b = step(a, { action: "submit" });
  const events = openingReactions(a, b);
  assert.equal(events[0].type, "siiSuccess");
  assert.equal(events[0].xp, 40);
  assert.match(events[0].message, /preparado/);
  assert.equal(budgetSummary(b).balance, 300);
  assert.deepEqual(openingReactions(b, reduceMission(b, { type: "next" })), []);
  assert.deepEqual(openingReactions(b, { ...b, id: "different" }), []);
});
test("queue preserves order, drops duplicate IDs and never combines reactions", () => {
  const { before, after } = route("municipality");
  const loss = openingReactions(before, after)[0];
  const success = { ...loss, id: "next", type: "success" as const };
  assert.deepEqual(enqueueReactions([loss], [loss, success, success]), [
    loss,
    success,
  ]);
  assert.equal(gameReactions.loss.duration, 3200);
  assert.equal(gameReactions.siiSuccess.sound, null);
});
test("overlay prefers a free corner and moves away from buttons at mobile and desktop widths", () => {
  for (const [width, height, size] of [
    [390, 844, 171.6],
    [1280, 720, 320],
  ]) {
    const initial = reactionPosition(width, height, size, []);
    assert.ok(initial.left > width / 2);
    const moved = reactionPosition(width, height, size, [
      { left: initial.left, top: initial.top, right: width, bottom: height },
    ]);
    assert.ok(moved.left < initial.left);
    assert.ok(moved.left >= 0 && moved.top >= 0 && moved.left + size <= width);
  }
});
