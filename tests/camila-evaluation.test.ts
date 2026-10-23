import test from "node:test";
import assert from "node:assert/strict";
import {
  contextualEvaluator,
  evaluateNext,
  bestEvaluation,
  canCompleteEvidence,
  evidenceOutcome,
} from "../src/games/inicio/evaluation";
import {
  freshAttempt,
  reduceMission,
  importAttempt,
} from "../server/missionDomain";
import { inicioSteps } from "../src/games/inicio/content";
export const completeNote =
  "Camila, debes informar al SII el inicio de tu actividad comercial y declarar el giro, la fecha y el domicilio. Avenida Coihue 120 es la dirección del local donde funciona el restaurante La Mesa del Coihue. Haría el trámite en la página web del SII. Informar el inicio comunica que comienza el negocio, mientras una revisión posterior comprueba los antecedentes declarados. Además del aviso necesitas la patente municipal y la autorización sanitaria, porque el inicio no significa que tengas todos los permisos.";
const equivalent =
  "Le avisamos a Impuestos Internos que comenzamos a vender comidas e indicamos la ubicación del negocio. El restaurante atiende en Avenida Coihue 120, por eso registramos ese lugar. Presentaría el aviso en la oficina virtual del SII. El aviso comunica el comienzo del negocio al SII; después podrían comprobar los datos informados y las condiciones del local. Aparte del trámite hacen falta otras autorizaciones municipales y sanitarias.";
const wrong =
  "El SII autoriza todos los permisos para abrir el restaurante. Avenida Coihue 120 es la casa de la vecina y no corresponde al local. Haría el trámite en el portal de Tesorería. La verificación es lo mismo que el inicio de actividades y siempre ocurre antes de avisar. No es necesario informar al SII el inicio del negocio.";
const cases: [string, string, (n: number) => boolean][] = [
  ["excellent", completeNote, (n) => n >= 80],
  [
    "incomplete",
    "Debemos informar al SII el inicio del negocio y su actividad comercial. Realizaría el aviso en la página web del SII.",
    (n) => n > 0 && n < 80,
  ],
  [
    "almost achieved",
    "Camila informa al SII el inicio de su actividad comercial y su giro. Avenida Coihue 120 es la dirección de Camila. Presentaría el aviso en la web del SII. El restaurante tiene permisos para el negocio.",
    (n) => n >= 60 && n < 80,
  ],
  [
    "word list",
    "SII, patente, domicilio, internet, verificación, municipalidad.",
    (n) => n < 20,
  ],
  ["conceptual mistakes", wrong, (n) => n < 60],
  [
    "negated permits",
    "No necesita otros permisos municipales ni sanitarios para abrir su restaurante.",
    (n) => n === 0,
  ],
  ["very short", "Avisar al SII.", (n) => n < 20],
  ["empty", "", (n) => n === 0],
  [
    "misspellings",
    completeNote
      .replaceAll("actividad", "actibidad")
      .replaceAll("domicilio", "domisilio")
      .replaceAll("sanitaria", "sanitariaa"),
    (n) => n >= 80,
  ],
  ["equivalent concepts", equivalent, (n) => n >= 80],
  ["random repetition", "sii negocio internet ".repeat(30), (n) => n < 20],
  [
    "copied prompt",
    "Qué información debe comunicar al SII al iniciar su actividad comercial. Por qué en el caso de La Mesa del Coihue se utiliza la dirección Avenida Coihue 120. Qué medio o canal utilizarías para realizar este trámite. Cuál es la diferencia entre informar el inicio de actividades y una posible verificación posterior realizada por el SII.",
    (n) => n < 60,
  ],
];
for (const [name, response, accept] of cases)
  test(`Camila evaluator: ${name}`, () => {
    const e = contextualEvaluator.evaluate(response, 1);
    assert.ok(accept(e.total), `${e.total}: ${JSON.stringify(e.criteria)}`);
    assert.equal(
      e.total,
      e.criteria.reduce((a, c) => a + c.points, 0),
    );
    assert.ok(e.criteria.every((c) => [0, 5, 10, 15, 20].includes(c.points)));
  });
function finalStage() {
  let a = freshAttempt(
    "00000000-0000-4000-8000-000000000001",
    "inicio-actividades",
  );
  for (const step of inicioSteps) {
    a = reduceMission(a, { type: "answer", value: String(step.correct) });
    a = reduceMission(a, { type: "confirm" });
    a = reduceMission(a, { type: "next" });
  }
  return a;
}
test("three attempts retain best grade, complete with support and survive serialization", () => {
  let a = finalStage();
  assert.throws(() => reduceMission(a, { type: "complete" }));
  assert.throws(() =>
    reduceMission(a, { type: "evaluateEvidence", value: "" }),
  );
  assert.equal(a.evidenceEvaluations, undefined);
  for (const value of [cases[1][1], "Avisar al SII.", "Todavía no sé."])
    a = reduceMission(JSON.parse(JSON.stringify(a)), {
      type: "evaluateEvidence",
      value,
    });
  assert.ok(a.completedAt);
  assert.equal(a.evidenceEvaluations?.length, 3);
  assert.equal(bestEvaluation(a.evidenceEvaluations)?.attempt, 1);
  assert.equal(
    evidenceOutcome(a.evidenceEvaluations),
    "Misión completada con apoyo",
  );
  assert.throws(() =>
    reduceMission(a, { type: "evaluateEvidence", value: completeNote }),
  );
});
test("passing note completes automatically and imported grades are recomputed", () => {
  let a = reduceMission(finalStage(), {
    type: "evaluateEvidence",
    value: completeNote,
  });
  assert.ok(a.completedAt);
  assert.equal(evidenceOutcome(a.evidenceEvaluations), "Misión superada");
  const imported = importAttempt(
    {
      ...a,
      evidenceEvaluations: [{ ...a.evidenceEvaluations![0], total: 999 }],
    },
    a.id,
  );
  assert.ok(imported.evidenceEvaluations![0].total <= 100);
  assert.throws(() =>
    reduceMission(freshAttempt(a.id, a.missionSlug), {
      type: "evaluateEvidence",
      value: completeNote,
    }),
  );
});
test("best score and attempt gate cannot be raised by repeating or blank submissions", () => {
  assert.throws(() => evaluateNext(""));
  const history = evaluateNext(completeNote);
  assert.ok(canCompleteEvidence(history));
  assert.throws(() => evaluateNext(completeNote, history));
});
