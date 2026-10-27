import type { Attempt } from "../../progress.js";
import { budgetSummary } from "./economy.js";
export type SimulationPhase =
  | "briefing"
  | "dialogue"
  | "map"
  | "consequence"
  | "folder"
  | "desk"
  | "reward";
export type SimulationAction = {
  action:
    | "begin"
    | "talk"
    | "map"
    | "travel"
    | "investigate"
    | "place"
    | "prepare"
    | "draft"
    | "submit";
  value?: string;
  target?: string;
  person?: string;
  activity?: string;
  procedure?: string;
};
export type SimulationState = {
  version: 1;
  phase: SimulationPhase;
  facts: string[];
  route?: string;
  folder: Record<string, string>;
  draft?: Record<string, string>;
  reviews: number;
  reviewed: string[];
  notice?: string;
  log: SimulationAction[];
};
export type SimulationStage = {
  id: string;
  title: string;
  description: string;
  mission: string;
  scenario: string;
  interactionType: string;
  characters: string[];
  correctActions: string[];
  feedback: string;
  badge: { code: string; name: string };
  nextStage: number;
  xp: { success: number; repair: number };
  reputationImpact: { success: number; detour: number };
};
export const openingMission: SimulationStage = {
  id: "camila-opening-v1",
  title: "El encargo de Camila",
  description:
    "Organiza el primer paso tributario de La Mesa del Coihue y separa los permisos que seguirán pendientes.",
  mission: "Levantar la cortina",
  scenario: "Villa del Coihue, en el Valle del Coihue",
  interactionType: "city-and-workdesk",
  characters: ["Camila", "Paula"],
  correctActions: ["notice:sii", "permit:municipality", "natural:meals:start"],
  feedback:
    "El aviso al SII y los permisos municipales tienen funciones distintas. Preparaste el encargo; el resto del expediente aún debe revisarse.",
  badge: { code: "camila-primer-paso", name: "Primer paso formal" },
  nextStage: 1,
  xp: { success: 40, repair: 20 },
  reputationImpact: { success: 10, detour: -12 },
};
export const openingPlaces = [
  {
    id: "sii",
    title: "Oficina del SII",
    icon: "landmark",
    description:
      "Paula orienta desde el Barrio Cívico. Aquí puedes organizar el encargo tributario y preparar el canal digital.",
    answer: "0",
    col: 1,
    row: 1,
  },
  {
    id: "municipality",
    title: "Municipalidad",
    icon: "building",
    description:
      "Aquí se revisan los permisos municipales del restaurante. ¿Eso comunica también el inicio de actividades al SII?",
    answer: "1",
    col: 3,
    row: 1,
  },
  {
    id: "bank",
    title: "Banco",
    icon: "bank",
    description:
      "Puedes consultar servicios financieros. La apertura de una cuenta no presenta el aviso de inicio de actividades.",
    col: 2,
    row: 2,
  },
  {
    id: "provider",
    title: "Proveedor",
    icon: "truck",
    description:
      "El proveedor espera la futura apertura. Comprar insumos y comunicar el inicio de actividades son gestiones diferentes.",
    col: 3,
    row: 3,
  },
  {
    id: "portal",
    title: "Portal del SII",
    icon: "laptop",
    description:
      "El canal digital permite preparar la gestión tributaria. No necesitas esperar una visita del equipo fiscalizador.",
    answer: "0",
    col: 1,
    row: 3,
  },
  {
    id: "honorarios",
    title: "Atención de honorarios",
    icon: "file",
    description:
      "Una asesoría ofrece preparar una boleta de honorarios como si Camila prestara un servicio profesional. Revisa si corresponde al restaurante.",
    answer: "2",
    col: 2,
    row: 3,
  },
] as const;
export const openingDocuments = [
  {
    id: "notice",
    title: "Aviso de inicio de actividades",
    description: "Comunicar el inicio de la actividad económica de Camila.",
  },
  {
    id: "permit",
    title: "Permisos municipales del restaurante",
    description:
      "Consultar los permisos y exigencias municipales para abrir el local.",
  },
] as const;
export function initialSimulation(): SimulationState {
  return {
    version: 1,
    phase: "briefing",
    facts: [],
    folder: {},
    reviews: 0,
    reviewed: [],
    log: [],
  };
}
function requireState(
  ok: unknown,
  message = "Esa acción no corresponde al momento actual de la misión.",
): asserts ok {
  if (!ok) throw Error(message);
}
export function applySimulation(
  previous: Attempt,
  event: SimulationAction,
): Attempt {
  requireState(
    previous.missionSlug === "inicio-actividades" &&
      previous.index === 0 &&
      !previous.completedAt,
  );
  requireState(
    previous.simulation?.version === 1,
    "Este recorrido conserva la experiencia anterior. Continúa desde su etapa guardada.",
  );
  const a = structuredClone(previous),
    s = a.simulation!;
  requireState(
    event && typeof event === "object" && typeof event.action === "string",
  );
  requireState(
    s.log.length < 80,
    "El registro de acciones llegó a su límite. Retoma la misión en un nuevo recorrido.",
  );
  switch (event.action) {
    case "begin":
      requireState(s.phase === "briefing");
      s.phase = "dialogue";
      break;
    case "talk":
      requireState(
        s.phase === "dialogue" &&
          ["business", "pending"].includes(event.value || "") &&
          !s.facts.includes(event.value!),
      );
      s.facts.push(event.value!);
      break;
    case "map":
      requireState(
        s.phase === "dialogue" && s.facts.length === 2,
        "Escucha el encargo y la actividad de Camila antes de salir.",
      );
      s.phase = "map";
      break;
    case "travel": {
      requireState(s.phase === "map");
      const place = openingPlaces.find((p) => p.id === event.value);
      requireState(
        place && "answer" in place,
        "Explora el lugar y elige una gestión tributaria para el encargo.",
      );
      s.route = place.id;
      a.answers[0] = place.answer;
      a.confirmed[0] = true;
      s.phase = "consequence";
      break;
    }
    case "investigate":
      requireState(s.phase === "consequence");
      s.phase = "folder";
      break;
    case "place":
      requireState(
        s.phase === "folder" &&
          openingDocuments.some((d) => d.id === event.value) &&
          ["sii", "municipality"].includes(event.target || ""),
      );
      s.folder[event.value!] = event.target!;
      s.notice = undefined;
      break;
    case "prepare": {
      requireState(s.phase === "folder");
      const signature = JSON.stringify(s.folder);
      if (s.folder.notice !== "sii" || s.folder.permit !== "municipality") {
        requireState(
          !s.reviewed.includes(signature),
          "Cambia la carpeta antes de volver a revisarla.",
        );
        s.reviews++;
        s.reviewed.push(signature);
        s.notice =
          "La carpeta mezcla gestiones de instituciones diferentes. Camila necesita saber qué se comunica al SII y qué se consulta en la municipalidad.";
      } else {
        s.phase = "desk";
        s.notice = undefined;
      }
      break;
    }
    case "draft": {
      requireState(s.phase === "desk");
      const choices: Record<string, string[]> = {
        person: ["natural", "company"],
        activity: ["meals", "transport", "professional"],
        procedure: ["start", "permit", "honorarios"],
      };
      requireState(
        choices[event.value || ""]?.includes(event.target || ""),
        "Selecciona un dato válido del encargo.",
      );
      s.draft = { ...s.draft, [event.value!]: event.target! };
      s.notice = undefined;
      break;
    }
    case "submit": {
      requireState(s.phase === "desk");
      const draft = s.draft || {};
      const signature = [draft.person, draft.activity, draft.procedure].join(
        ":",
      );
      requireState(
        ["natural", "company"].includes(draft.person || "") &&
          ["meals", "transport", "professional"].includes(
            draft.activity || "",
          ) &&
          ["start", "permit", "honorarios"].includes(draft.procedure || ""),
        "Completa los tres campos del encargo.",
      );
      if (signature !== "natural:meals:start") {
        requireState(
          !s.reviewed.includes(signature),
          "Modifica la ficha antes de volver a presentarla.",
        );
        s.reviews++;
        s.reviewed.push(signature);
        s.notice =
          "Paula devuelve la ficha: alguno de sus datos no corresponde a la persona, a la actividad o al trámite del encargo. Contrástala con lo que contó Camila.";
      } else {
        s.phase = "reward";
        s.notice = undefined;
      }
      break;
    }
    default:
      throw Error("Acción de simulación no disponible.");
  }
  // Keep a canonical action log; imports replay these decisions instead of trusting claimed rewards.
  s.log.push({
    action: event.action,
    ...(event.value ? { value: event.value } : {}),
    ...(event.target ? { target: event.target } : {}),
    ...(event.person ? { person: event.person } : {}),
    ...(event.activity ? { activity: event.activity } : {}),
    ...(event.procedure ? { procedure: event.procedure } : {}),
  });
  return a;
}
export function simulationSummary(a: Attempt) {
  const s = a.simulation;
  const completed = s?.phase === "reward";
  const correct = a.confirmed.map(
    (v, i) => v && ["0", "1", "2", "1", "3", "2", "1", "2"][i] === a.answers[i],
  );
  const completedLater = a.confirmed.slice(1).filter(Boolean).length;
  const correctLater = correct.slice(1).filter(Boolean).length;
  const routeGood = a.answers[0] === "0";
  const xp =
    (completed
      ? routeGood
        ? openingMission.xp.success
        : openingMission.xp.repair
      : 0) +
    correctLater * 10;
  const reputation = Math.max(
    0,
    Math.min(
      100,
      75 +
        (a.confirmed[0] ? (routeGood ? 10 : -12) : 0) +
        (completed ? 5 : 0) -
        (s?.reviews || 0) * 4 +
        correctLater * 2 -
        (completedLater - correctLater) * 5,
    ),
  );
  return {
    xp,
    reputation,
    day:
      1 +
      (a.confirmed[0] && !routeGood ? 1 : 0) +
      (s?.reviews || 0) +
      completedLater,
    balance: budgetSummary(a).balance,
    badges: completed ? [openingMission.badge] : [],
    tasks: [
      s?.facts.length === 2,
      !!a.confirmed[0],
      s?.folder.notice === "sii" && s?.folder.permit === "municipality",
      completed,
    ],
  };
}
