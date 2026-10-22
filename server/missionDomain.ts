import { missions } from "../src/data.js";
import { scoreAttempt, type Attempt } from "../src/progress.js";
import { demand, text } from "./learningDomain.js";
export type MissionEvent = { type: string; value?: unknown };
export function missionFor(slug: unknown) {
  const m = missions.find((m) => m.slug === slug);
  demand(m, "Misión no disponible.", 404);
  return m;
}
export function freshAttempt(id: string, slug: string): Attempt {
  const m = missionFor(slug);
  return {
    ...(m.slug === "inicio-actividades" ? {economyVersion:1 as const} : {}),
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
      ["answer", "confirm", "next", "evidence", "complete"].includes(
        event.type,
      ),
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
  if (event.type === "complete") {
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
  for (let i = 0; i < m.steps.length; i++) {
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
  if (v.completedAt) state = reduceMission(state, { type: "complete" });
  return state;
}
export { scoreAttempt };
