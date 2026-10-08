import { test } from "node:test";
import assert from "node:assert/strict";
import {
  reduceGame,
  validateEvaluation,
  validateRubric,
  requireRole,
  csvCell,
  suggestions,
} from "../server/learningDomain";
import {
  initialProgress,
  currentChallenge,
} from "../src/games/coihue/progress";
import { initialRubric, type Profile } from "../src/accounts/model";
const student: Profile = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test",
  role: "student",
  active: true,
  city_id: null,
  school_id: null,
};
test("server validates mission order and computes responses instead of claimed results", () => {
  let state = initialProgress();
  assert.throws(() => reduceGame(state, { type: "visit", mission: "feria" }));
  state = reduceGame(state, { type: "visit", mission: "pagos" }).state;
  assert.throws(() =>
    reduceGame(state, {
      type: "answer",
      challenge: "plaza-1",
      item: "x",
      value: "0",
    }),
  );
  state = reduceGame(state, { type: "begin" }).state;
  const check = currentChallenge(state, "pagos")!;
  const item = check.items[0];
  assert.throws(() =>
    reduceGame(state, {
      type: "answer",
      challenge: "forged",
      item: item.id,
      value: item.correct,
    }),
  );
  assert.throws(() =>
    reduceGame(state, {
      type: "answer",
      challenge: check.id,
      item: item.id,
      value: "malicious",
    }),
  );
  const wrong = item.options.find((o) => o.id !== item.correct)!;
  state = reduceGame(state, {
    type: "answer",
    challenge: check.id,
    item: item.id,
    value: wrong.id,
  }).state;
  assert.equal(state.answers[item.id].correct, false);
  const data = reduceGame(state, {
    type: "answer",
    challenge: check.id,
    item: item.id,
    value: item.correct,
  });
  assert.equal(data.state.answers[item.id].attempts, 2);
  assert.equal(data.state.answers[item.id].assisted, true);
  assert.equal(data.details.mission_id, "pagos");
  assert.throws(() =>
    reduceGame(data.state, {
      type: "answer",
      challenge: check.id,
      item: item.id,
      value: item.correct,
    }),
  );
  assert.throws(() =>
    reduceGame(data.state, {
      type: "justify",
      value: "Una explicación antes de terminar.",
    }),
  );
});
test("rubric distinguishes missing evidence and preserves human confirmation requirements", () => {
  assert.deepEqual(validateRubric(initialRubric), initialRubric);
  assert.ok(
    suggestions(initialProgress(), initialRubric).every(
      (s) => s.level === null,
    ),
  );
  const evaluation = {
    student_id: student.id,
    course_id: student.id,
    rubric: initialRubric,
    ratings: Object.fromEntries(
      initialRubric.criteria.map((c) => [c.id, null]),
    ),
    comments: {},
    overall: "",
    published: false,
  };
  assert.ok(
    validateEvaluation(evaluation, initialRubric).ratings.tributo === null,
  );
  assert.throws(() =>
    validateEvaluation(
      { ...evaluation, ratings: { ...evaluation.ratings, tributo: 0 } },
      initialRubric,
    ),
  );
  assert.throws(() =>
    validateEvaluation({ ...evaluation, published: true }, initialRubric),
  );
  const comments = Object.fromEntries(
    initialRubric.criteria.map((c) => [
      c.id,
      "Aún falta evidencia en este criterio.",
    ]),
  );
  const saved = validateEvaluation(
    {
      ...evaluation,
      comments,
      published: true,
      confirmed: true,
      teacher_id: "forged",
    },
    initialRubric,
  );
  assert.equal("confirmed" in saved, false);
  assert.equal("teacher_id" in saved, false);
  assert.throws(() =>
    validateRubric({
      ...initialRubric,
      criteria: [{ ...initialRubric.criteria[0], weight: 0 }],
    }),
  );
});
test("roles and export cells reject unsafe privilege or spreadsheet interpretation", () => {
  assert.throws(() => requireRole(student, "teacher", "admin"));
  assert.throws(() =>
    requireRole({ ...student, role: "admin", active: false }, "admin"),
  );
  requireRole({ ...student, role: "teacher" }, "teacher");
  assert.equal(csvCell('=HYPERLINK("x")'), '"\'=HYPERLINK(""x"")"');
  assert.equal(csvCell(" @SUM(1)"), '"\' @SUM(1)"');
  assert.equal(csvCell("Nombre, apellido"), '"Nombre, apellido"');
});

test("complete server-driven adventure records new-case explanations and never treats time or clicks as mastery", async () => {
  const { missions } = await import("../src/games/coihue/content");
  const { completed } = await import("../src/games/coihue/progress");
  let state = initialProgress();
  const explanations: unknown[] = [];
  for (const mission of missions) {
    state = reduceGame(state, { type: "visit", mission: mission.id }).state;
    state = reduceGame(state, { type: "begin" }).state;
    let check = currentChallenge(state, mission.id);
    while (check) {
      for (const item of check.items) {
        state = reduceGame(state, {
          type: "answer",
          challenge: check.id,
          item: item.id,
          value: check.kind === "order" ? check.order!.join(",") : item.correct,
        }).state;
      }
      state = reduceGame(state, { type: "advance", challenge: check.id }).state;
      check = currentChallenge(state, mission.id);
    }
    assert.ok(completed(state, mission.id));
    const proof = reduceGame(state, {
      type: "justify",
      value:
        "En una nueva situación explicaría la obligación y consultaría el canal oficial antes de actuar.",
    });
    explanations.push(proof.details);
    assert.equal(proof.details.completed, true);
    assert.equal(proof.details.mission_id, mission.id);
    assert.ok(Array.isArray(proof.details.concepts));
  }
  assert.equal(explanations.length, 7);
  const advice = suggestions(state, initialRubric);
  assert.equal(
    advice.find((a) => a.criterion === "transferencia")!.level,
    null,
  );
  assert.ok(advice.every((a) => a.level === null || a.level <= 3));
  assert.deepEqual(
    reduceGame(state, { type: "restart" }).state,
    initialProgress(),
  );
});
