import {
  allChallenges,
  concepts,
  contentVersion,
  missions,
  type ConceptId,
} from "../src/games/coihue/content.js";
import {
  advance,
  answer,
  completed,
  currentChallenge,
  initialProgress,
  learning,
  unlocked,
  useHint,
  type Progress,
} from "../src/games/coihue/progress.js";
import { avatars } from "../src/games/coihue/world.js";
import type { Evaluation, Profile, Rubric } from "../src/accounts/model.js";
export class LearningError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export function demand(
  condition: unknown,
  message = "Solicitud inválida.",
  status = 400,
): asserts condition {
  if (!condition) throw new LearningError(message, status);
}
export function text(value: unknown, max = 120, min = 1) {
  demand(
    typeof value === "string" &&
      value.trim().length >= min &&
      value.length <= max,
  );
  return value.trim();
}
export function uuid(value: unknown) {
  demand(
    typeof value === "string" &&
      /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(value),
  );
  return value;
}
export function requireRole(profile: Profile, ...roles: Profile["role"][]) {
  demand(
    profile.active && roles.includes(profile.role),
    "No tienes permiso para acceder a este espacio.",
    403,
  );
}
export type GameEvent = {
  type:
    | "start"
    | "avatar"
    | "nickname"
    | "visit"
    | "begin"
    | "hint"
    | "answer"
    | "advance"
    | "justify"
    | "restart";
  mission?: string;
  challenge?: string;
  item?: string;
  value?: string;
};
export function reduceGame(state: Progress, event: GameEvent) {
  demand(
    [
      "start",
      "avatar",
      "nickname",
      "visit",
      "begin",
      "hint",
      "answer",
      "advance",
      "justify",
      "restart",
    ].includes(event.type),
    "Acción inválida.",
  );
  demand(
    state.contentVersion === contentVersion,
    "El contenido cambió. Solicita al docente revisar la versión antes de continuar.",
    409,
  );
  let next = state;
  let details: Record<string, unknown> = {
    mission_id: state.active,
    kind: event.type,
  };
  if (event.type === "start") next = { ...state, started: true };
  else if (event.type === "avatar") {
    demand(avatars.some((a) => a.id === event.value));
    next = { ...state, avatar: event.value! };
  } else if (event.type === "nickname")
    next = { ...state, nickname: text(event.value, 24, 0) };
  else if (event.type === "restart")
    next = initialProgress(); // Evidence history remains immutable.
  else {
    if (event.type === "visit") {
      demand(
        typeof event.mission === "string" &&
          missions.some((m) => m.id === event.mission) &&
          unlocked(state, event.mission),
        "La misión aún no está disponible.",
      );
      next = {
        ...state,
        started: true,
        active: event.mission,
        phase:
          completed(state, event.mission) ||
          state.visited.includes(event.mission)
            ? "play"
            : "intro",
      };
      details.mission_id = event.mission;
    } else {
      demand(state.started, "Comienza la aventura antes de responder.");
      demand(
        state.active && unlocked(state, state.active),
        "Selecciona una misión disponible.",
      );
      if (event.type === "begin")
        next = {
          ...state,
          phase: "play",
          visited: [...new Set([...state.visited, state.active])],
        };
      else if (event.type === "justify") {
        demand(
          completed(state, state.active),
          "Termina la misión antes de entregar tu explicación.",
        );
        details = {
          ...details,
          response: text(event.value, 2000, 10),
          concepts: missions.find((m) => m.id === state.active)!.concepts,
          completed: true,
        };
      } else {
        const challenge = currentChallenge(state, state.active);
        demand(
          state.phase === "play" &&
            challenge &&
            event.challenge === challenge.id,
          "La actividad no corresponde al avance actual.",
        );
        details = {
          ...details,
          challenge_id: challenge.id,
          challenge_title: challenge.title,
          concepts: challenge.items.map((i) => i.concept),
        };
        if (event.type === "hint") next = useHint(state, challenge.id);
        else if (event.type === "advance") {
          demand(
            challenge.items.every((i) => state.answers[i.id]),
            "Comprueba las tarjetas antes de continuar.",
          );
          next = advance(state, challenge);
          details.completed = true;
          details.responses = challenge.items.map((i) => ({
            item: i.id,
            ...next.answers[i.id],
          }));
        } else if (event.type === "answer") {
          const item = challenge.items.find((i) => i.id === event.item);
          demand(
            item &&
              typeof event.value === "string" &&
              event.value.length <= 500,
          );
          if (challenge.kind === "order") {
            const items = event.value.split(",");
            demand(
              items.length === challenge.order!.length &&
                new Set(items).size === items.length &&
                items.every((i) => challenge.order!.includes(i)),
            );
          } else demand(item.options.some((o) => o.id === event.value));
          demand(
            !state.answers[item.id]?.correct,
            "Esta respuesta ya fue comprobada.",
          );
          next = answer(state, challenge, item.id, event.value);
          details = {
            ...details,
            item_id: item.id,
            prompt: item.prompt,
            response_label:
              challenge.kind === "order"
                ? event.value.split(",").join(" → ")
                : item.options.find((o) => o.id === event.value)!.label,
            concepts: [item.concept],
            ...next.answers[item.id],
            hints: next.hints.filter((h) => h === challenge.id),
            completed: false,
          };
        } else throw new LearningError("Acción inválida.");
      }
    }
  }
  return { state: next, details };
}
export function validateRubric(input: unknown): Rubric {
  const r = input as Rubric;
  demand(
    r &&
      Number.isInteger(r.version) &&
      r.version > 0 &&
      Array.isArray(r.criteria) &&
      r.criteria.length >= 1 &&
      r.criteria.length <= 12,
  );
  const ids = new Set<string>();
  for (const c of r.criteria) {
    text(c.id, 50);
    demand(!ids.has(c.id));
    ids.add(c.id);
    text(c.title, 200);
    demand(Number.isFinite(c.weight) && c.weight > 0 && c.weight <= 100);
    demand(Array.isArray(c.levels) && c.levels.length === 4);
    c.levels.forEach((d) => text(d, 800));
    demand(
      Array.isArray(c.concepts) &&
        c.concepts.every((id) => concepts.some((concept) => concept.id === id)),
    );
  }
  return r;
}
export function validateEvaluation(input: unknown, rubric: Rubric): Evaluation {
  const e = input as Evaluation;
  demand(e && typeof e.published === "boolean");
  uuid(e.student_id);
  uuid(e.course_id);
  demand(
    e.ratings &&
      e.comments &&
      typeof e.overall === "string" &&
      e.overall.length <= 4000,
  );
  for (const criterion of rubric.criteria) {
    const rating = e.ratings[criterion.id];
    demand(
      rating === null ||
        (Number.isInteger(rating) && rating >= 1 && rating <= 4),
    );
    text(e.comments[criterion.id] ?? "", 2000, 0);
    if (e.published)
      demand(
        (e.comments[criterion.id] ?? "").trim().length >= 5,
        "Para publicar, justifica cada criterio, incluido “Sin evidencia suficiente”.",
      );
  }
  demand(
    Object.keys(e.ratings).every((id) =>
      rubric.criteria.some((c) => c.id === id),
    ),
  );
  return {
    student_id: e.student_id,
    course_id: e.course_id,
    rubric,
    ratings: e.ratings,
    comments: e.comments,
    overall: e.overall,
    published: e.published,
  };
}
export function suggestions(state: Progress, rubric: Rubric) {
  return rubric.criteria.map((c) => {
    const ids = c.concepts as ConceptId[];
    const checks = allChallenges.filter(
      (ch) =>
        state.advanced.includes(ch.id) &&
        ch.items.some((i) => ids.includes(i.concept)),
    );
    const status = ids.map((id) => learning(state, id));
    return {
      criterion: c.id,
      level: !checks.length
        ? null
        : status.every((s) => s === "Comprendido")
          ? 3
          : status.every((s) => s !== "Por reforzar")
            ? 2
            : 1,
      activities: checks.map((ch) => ch.id),
      rule: "Sin actividad: sin evidencia. Todos los conceptos comprendidos en dos casos autónomos: sugiere Logrado; todos con apoyo: En desarrollo; evidencia restante: Inicial. Avanzado y transferencia requieren revisar justificaciones. El docente decide.",
    };
  });
}
export function csvCell(value: unknown) {
  let s = String(value ?? "");
  if (/^[\s]*[=+\-@]/.test(s)) s = "'" + s;
  return '"' + s.replace(/"/g, '""') + '"';
}
