import {
  applySimulation,
  initialSimulation,
} from "../src/games/inicio/simulation.js";
import {
  evaluateNext,
  canCompleteEvidence,
  summarizeEvidence,
} from "../src/games/inicio/evaluation.js";
import { missions } from "../src/data.js";
import { scoreAttempt, type Attempt } from "../src/progress.js";
import { demand, text } from "./learningDomain.js";
export type MissionEvent = { type: string; value?: unknown };
export function missionFor(slug: unknown) {
  const m = missions.find(
    (m) => m.slug === slug && m.publication === "published",
  );
  demand(m, "Misión no disponible.", 404);
  return m;
}
export function freshAttempt(id: string, slug: string): Attempt {
  const m = missionFor(slug);
  return {
    ...(m.slug === "inicio-actividades"
      ? { economyVersion: 1 as const, simulation: initialSimulation() }
      : {}),
    id,
    missionSlug: m.slug,
    version: m.version,
    createdAt: new Date().toISOString(),
    answers: [],
    confirmed: [],
    index: 0,
    evidence: "",
  };
}
export function reduceMission(previous: Attempt, event: MissionEvent): Attempt {
  const m = missionFor(previous.missionSlug);
  demand(
    previous.version === m.version,
    "La versión de esta misión cambió.",
    409,
  );
  demand(!previous.completedAt, "Este intento ya está terminado.", 409);
  demand(
    event &&
      [
        "simulation",
        "answer",
        "confirm",
        "next",
        "evidence",
        "evaluateEvidence",
        "complete",
      ].includes(event.type),
  );
  if (event.type === "simulation") {
    try {
      const value = text(event.value, 1000);
      const source = !previous.simulation && previous.index===0 && !previous.confirmed[0] ? {...previous,simulation:initialSimulation()} : previous;
      return applySimulation(source, JSON.parse(value));
    } catch (error) {
      demand(false, (error as Error).message);
    }
  }
  demand(
    !(
      previous.simulation?.version === 1 &&
      previous.index === 0 &&
      ["answer", "confirm"].includes(event.type)
    ),
    "Utiliza el mapa y la mesa de gestión para preparar el encargo.",
  );
  const a = structuredClone(previous);
  const step = m.steps[a.index];
  if (event.type === "answer") {
    demand(step && !a.confirmed[a.index]);
    const value = text(event.value, 40);
    demand(
      step.kind === "number"
        ? /^\d{1,12}$/.test(value)
        : /^\d+$/.test(value) && Number(value) < (step.options?.length || 0),
    );
    a.answers[a.index] = value;
  }
  if (event.type === "confirm") {
    demand(
      step && !a.confirmed[a.index] && !!a.answers[a.index]?.trim(),
      "Responde antes de comprobar.",
    );
    a.confirmed[a.index] = true;
  }
  if (event.type === "next") {
    demand(
      !(a.simulation?.version === 1 && a.index === 0) ||
        a.simulation?.phase === "reward",
      "Completa la ficha de gestión antes de continuar.",
    );
    demand(
      step && a.confirmed[a.index],
      "Comprueba la respuesta antes de continuar.",
    );
    a.index++;
  }
  if (event.type === "evidence") {
    demand(a.index === m.steps.length);
    a.evidence =
      typeof event.value === "string" && event.value.length === 0
        ? ""
        : text(event.value, 2500, 0);
  }
  if (event.type === "evaluateEvidence") {
    demand(
      m.slug === "inicio-actividades" &&
        a.index === m.steps.length &&
        m.steps.every((_, i) => a.confirmed[i]),
    );
    const response = text(event.value, 2500, 0);
    try {
      a.evidenceEvaluations = evaluateNext(response, a.evidenceEvaluations);
    } catch (e) {
      demand(false, (e as Error).message);
    }
    a.evidenceResult = summarizeEvidence(a.evidenceEvaluations!);
    a.evidence = response;
    if (canCompleteEvidence(a.evidenceEvaluations))
      a.completedAt = new Date().toISOString();
  }
  if (event.type === "complete") {
    demand(
      m.slug !== "inicio-actividades" ||
        canCompleteEvidence(a.evidenceEvaluations),
      "Evalúa tu nota para Camila antes de terminar.",
    );
    demand(
      a.index === m.steps.length &&
        a.evidence.trim().length >= 25 &&
        m.steps.every((_, i) => a.confirmed[i]),
      "Completa las decisiones y escribe una explicación de al menos 25 caracteres.",
    );
    a.completedAt = new Date().toISOString();
  }
  return a;
}
export function importAttempt(raw: unknown, id: string): Attempt {
  const v = raw as Attempt;
  demand(v && typeof v === "object");
  const m = missionFor(v.missionSlug);
  demand(v.version === m.version, "La versión local no se puede importar.");
  demand(Array.isArray(v.answers) && Array.isArray(v.confirmed));
  let state = freshAttempt(id, m.slug);
  if (m.slug === "inicio-actividades") {
    if (v.simulation?.version === 1) {
      demand(Array.isArray(v.simulation.log) && v.simulation.log.length <= 80);
      for (const event of v.simulation.log)
        state = reduceMission(state, {
          type: "simulation",
          value: JSON.stringify(event),
        });
    } else delete state.simulation;
  }
  for (let i = 0; i < m.steps.length; i++) {
    if (i === 0 && state.simulation?.version === 1) {
      if (v.index > 0) {
        state = reduceMission(state, { type: "next" });
        continue;
      }
      break;
    }
    if (v.answers[i] !== undefined && v.answers[i] !== "")
      state = reduceMission(state, { type: "answer", value: v.answers[i] });
    if (v.confirmed[i] === true) {
      state = reduceMission(state, { type: "confirm" });
      if (v.index > i || v.completedAt)
        state = reduceMission(state, { type: "next" });
      else break;
    } else break;
  }
  if (state.index === m.steps.length && typeof v.evidence === "string")
    state = reduceMission(state, { type: "evidence", value: v.evidence });
  // Never trust client-provided points, outcomes, timestamps or evaluation count.
  if (m.slug === "inicio-actividades" && state.index === m.steps.length) {
    const history = Array.isArray(v.evidenceEvaluations)
      ? v.evidenceEvaluations.slice(0, 3)
      : [];
    for (const evaluation of history) {
      demand(evaluation && typeof evaluation.response === "string");
      state = reduceMission(state, {
        type: "evaluateEvidence",
        value: evaluation.response,
      });
      if (state.completedAt) break;
    }
    // Legacy demos receive a fresh evaluation; a claimed completion cannot bypass the gate.
    if (v.completedAt && !history.length && state.evidence.trim())
      state = reduceMission(state, {
        type: "evaluateEvidence",
        value: state.evidence,
      });
  } else if (v.completedAt) state = reduceMission(state, { type: "complete" });
  return state;
}
export { scoreAttempt };
