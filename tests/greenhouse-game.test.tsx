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
import {
  applyGreenhouse,
  greenhouseFeedback,
  type FieldDraft,
} from "../src/games/invernadero/domain";
import {
  GreenhouseGame,
  GreenhouseCurriculum,
  GreenhouseOutcome,
} from "../src/games/invernadero/Game";
import { greenhouseCurriculum } from "../src/games/invernadero/content";
import { parseDemoState, summarize } from "../src/progress";
import { missions } from "../src/data";
const rounds: FieldDraft[] = [
  {
    temperature: "seen",
    soil: "seen",
    ventilation: "seen",
    leaves: "seen",
    hypothesis: "heat",
    evidence1: "temperature",
    evidence2: "ventilation",
  },
  {
    authorization: "seen",
    ventilation: "open",
    irrigation: "hold",
    products: "none",
    record: "record",
  },
  { temperature: "25", trend: "down", crop: "partial", next: "consult" },
];
const event = (fields: FieldDraft, action = "check") => ({
  type: "greenhouse",
  value: JSON.stringify({ action, fields }),
});
function finish(wrong = false) {
  let a = freshAttempt(randomUUID(), "rescate-invernadero");
  for (const [i, fields] of rounds.entries()) {
    a = reduceMission(
      a,
      event(
        wrong && i === 1 ? { ...fields, irrigation: "continuous" } : fields,
      ),
    );
    a = reduceMission(a, { type: "next" });
  }
  a = reduceMission(a, {
    type: "evidence",
    value:
      "Teresa, relacioné los 32 °C con las ventanas cerradas. El suelo húmedo no justificaba regar más. Tras la ventilación hubo una mejoría parcial y consultaría por las plantas que siguen decaídas.",
  });
  return reduceMission(a, { type: "complete" });
}
test("fieldwork requires four observations and a hypothesis supported by two different signals; clicks alone do not award mastery", () => {
  const a = freshAttempt(randomUUID(), "rescate-invernadero");
  const explored = reduceMission(
    a,
    event(
      {
        temperature: "seen",
        soil: "seen",
        ventilation: "seen",
        leaves: "seen",
      },
      "save",
    ),
  );
  assert.equal(scoreAttempt(explored), 0);
  assert.equal(explored.confirmed[0], undefined);
  assert.throws(() =>
    reduceMission(explored, event({ ...rounds[0], evidence2: "temperature" })),
  );
  assert.throws(() =>
    reduceMission(explored, event({ ...rounds[0], soil: "" })),
  );
  for (const fields of [
    { ...rounds[0], hypothesis: "water" },
    { ...rounds[0], hypothesis: "pest" },
    { ...rounds[0], evidence2: "leaves" },
  ])
    assert.equal(scoreAttempt(reduceMission(a, event(fields))), 0);
  assert.equal(scoreAttempt(reduceMission(a, event(rounds[0]))), 1);
});
test("fieldwork validates the whole supervised plan and acknowledges that the supervisor corrects unsuccessful proposals", () => {
  let a = reduceMission(
    freshAttempt(randomUUID(), "rescate-invernadero"),
    event(rounds[0]),
  );
  a = reduceMission(a, { type: "next" });
  assert.throws(() =>
    reduceMission(a, event({ ...rounds[1], authorization: "" })),
  );
  for (const fields of [
    { ...rounds[1], ventilation: "closed" },
    { ...rounds[1], irrigation: "continuous" },
    { ...rounds[1], products: "apply" },
    { ...rounds[1], record: "skip" },
  ]) {
    const bad = reduceMission(a, event(fields));
    assert.notEqual(bad.answers[1], "2");
    assert.match(greenhouseFeedback(1, fields), /corrige/);
  }
  assert.equal(reduceMission(a, event(rounds[1])).answers[1], "2");
});
test("fieldwork compares measured change, partial improvement and follow-up instead of treating a lower temperature as a diagnosis", () => {
  let a = freshAttempt(randomUUID(), "rescate-invernadero");
  for (const fields of rounds.slice(0, 2)) {
    a = reduceMission(a, event(fields));
    a = reduceMission(a, { type: "next" });
  }
  for (const fields of [
    { ...rounds[2], temperature: "32" },
    { ...rounds[2], trend: "up" },
    { ...rounds[2], crop: "resolved" },
    { ...rounds[2], next: "water" },
  ])
    assert.notEqual(reduceMission(a, event(fields)).answers[2], "1");
  assert.match(
    greenhouseFeedback(2, rounds[2]),
    /no una temperatura objetivo universal/,
  );
  assert.throws(() => reduceMission(a, { type: "complete" }));
});
test("fieldwork saves and restores observation drafts, recomputes imported answers and rejects unknown fields, invalid missions and edits after delivery", () => {
  let a = freshAttempt(randomUUID(), "rescate-invernadero");
  assert.throws(() => reduceMission(a, event({ ...rounds[0], fake: "999" })));
  assert.throws(() =>
    applyGreenhouse(
      { ...a, missionSlug: "mision-iva" },
      { action: "check", fields: rounds[0] },
    ),
  );
  a = reduceMission(a, event({ temperature: "seen" }, "save"));
  const restored = parseDemoState(JSON.stringify({ schema: 1, attempts: [a] }))
    .attempts[0];
  assert.deepEqual(restored.greenhouse, a.greenhouse);
  assert.throws(() => reduceMission(restored, { type: "answer", value: "1" }));
  assert.throws(() => reduceMission(restored, { type: "confirm" }));
  a = reduceMission(a, event(rounds[0]));
  assert.throws(() => reduceMission(a, event(rounds[0])));
  assert.equal(
    importAttempt({ ...a, answers: ["2"] }, randomUUID()).answers[0],
    "1",
  );
  assert.equal(
    parseDemoState(
      JSON.stringify({ schema: 1, attempts: [{ ...a, answers: ["2"] }] }),
    ).attempts[0].answers[0],
    "1",
  );
  assert.throws(() =>
    parseDemoState(
      JSON.stringify({
        schema: 1,
        attempts: [
          {
            ...a,
            greenhouse: {
              version: 1,
              drafts: { 0: { temperature: "invented" } },
            },
          },
        ],
      }),
    ),
  );
});
test("fieldwork completion retains the original three-criterion grade and reward rules and preserves legacy attempts", () => {
  const first = finish(true),
    best = finish();
  assert.equal(scoreAttempt(first), 2);
  assert.equal(scoreAttempt(best), 3);
  assert.deepEqual(best.answers, ["1", "2", "1"]);
  assert.deepEqual(
    importAttempt(best, randomUUID()).greenhouse,
    best.greenhouse,
  );
  assert.equal(summarize([first, best, best]).xp, 150);
  let legacy = freshAttempt(randomUUID(), "rescate-invernadero");
  for (const answer of ["1", "2", "1"]) {
    legacy = reduceMission(legacy, { type: "answer", value: answer });
    legacy = reduceMission(legacy, { type: "confirm" });
    legacy = reduceMission(legacy, { type: "next" });
  }
  legacy = reduceMission(legacy, {
    type: "evidence",
    value:
      "Evidencia del recorrido anterior: observamos, ventilamos con autorización y comprobamos los cambios.",
  });
  legacy = reduceMission(legacy, { type: "complete" });
  const imported = importAttempt(legacy, randomUUID());
  assert.equal(scoreAttempt(imported), 3);
  assert.equal(imported.greenhouse, undefined);
});
test("agriculture curriculum identifies fourth-year OA1 and AE3/3.6 without claiming full-module assessment; public play starts before the story", () => {
  const a = freshAttempt(randomUUID(), "rescate-invernadero"),
    noop = () => {};
  const html = renderToStaticMarkup(
    <MemoryRouter>
      <GreenhouseGame
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
  assert.ok(
    html.indexOf("Entrar al invernadero y jugar") <
      html.indexOf("En la Huerta del Coihue"),
  );
  assert.ok(html.includes("invernadero-huerta-coihue.webp"));
  assert.equal(
    missions.find((m) => m.slug === "rescate-invernadero")?.level,
    "4",
  );
  assert.equal(greenhouseCurriculum.grade, 4);
  const curriculum = renderToStaticMarkup(<GreenhouseCurriculum />);
  assert.match(curriculum, /3\.6/);
  assert.match(curriculum, /no representa la evaluación completa/);
  assert.match(
    renderToStaticMarkup(<GreenhouseOutcome attempt={finish()} />),
    /mejoría parcial/,
  );
});
