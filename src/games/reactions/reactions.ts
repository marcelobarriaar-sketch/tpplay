import type { Attempt } from "../../progress.js";
import { simulationSummary } from "../inicio/simulation.js";
export const gameReactions = {
  success: {
    asset: "/game-reactions/pig_dance_success.webp",
    duration: 3200,
    sound: null,
  },
  loss: {
    asset: "/game-reactions/pig_loss_crying.webp",
    duration: 3200,
    sound: null,
  },
  siiSuccess: {
    asset: "/game-reactions/pig_sii_success.webp",
    duration: 3500,
    sound: null,
  },
} as const;
export type ReactionType = keyof typeof gameReactions;
export type ReactionEvent = {
  id: string;
  type: ReactionType;
  message: string;
  detail: string;
  amount?: number;
  xp?: number;
  reputation?: number;
};
// Only accepted state transitions produce reactions. Mounting/restoring an attempt is silent.
export function openingReactions(
  before: Attempt,
  after: Attempt,
): ReactionEvent[] {
  if (
    before.id !== after.id ||
    after.missionSlug !== "inicio-actividades" ||
    before.index !== 0 ||
    after.index !== 0 ||
    !before.simulation ||
    !after.simulation ||
    after.simulation.log.length <= before.simulation.log.length
  )
    return [];
  const old = simulationSummary(before),
    now = simulationSummary(after);
  const base = {
    id: `${after.id}:${after.simulation.log.length}`,
    amount: now.balance - old.balance,
    xp: now.xp - old.xp,
    reputation: now.reputation - old.reputation,
  };
  if (
    after.simulation.phase === "reward" &&
    before.simulation.phase !== "reward"
  )
    return [
      {
        ...base,
        type: "siiSuccess",
        message: "¡Encargo tributario preparado!",
        detail: "Paula revisó tu ficha. Continúa con el expediente de Camila.",
      },
    ];
  if (base.amount < 0 || base.reputation < 0)
    return [
      {
        ...base,
        type: "loss",
        message:
          base.amount < 0
            ? "¡Ups! El desvío tuvo un costo."
            : "La gestión necesita una corrección.",
        detail: "Revisa la consecuencia y decide cómo continuar.",
      },
    ];
  if (
    (!before.confirmed[0] && after.confirmed[0]) ||
    (before.simulation.phase === "folder" && after.simulation.phase === "desk")
  )
    return [
      {
        ...base,
        type: "success",
        message: "¡Excelente gestión!",
        detail:
          before.simulation.phase === "folder"
            ? "Separaste las gestiones de cada institución."
            : "Conservaste los recursos de Camila.",
      },
    ];
  return [];
}
export function enqueueReactions(
  queue: ReactionEvent[],
  incoming: ReactionEvent[],
) {
  const ids = new Set(queue.map((e) => e.id));
  return [
    ...queue,
    ...incoming.filter((e) => {
      if (ids.has(e.id)) return false;
      ids.add(e.id);
      return true;
    }),
  ];
}
export type ReactionRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};
// Prefer the requested bottom-right corner; move around visible controls and headings.
export function reactionPosition(
  width: number,
  height: number,
  size: number,
  obstacles: ReactionRect[],
) {
  const margin = width < 700 ? 12 : 20;
  const candidates = [
    { left: width - size - margin, top: height - size - margin },
    { left: margin, top: height - size - margin },
    { left: width - size - margin, top: margin },
    { left: margin, top: margin },
    { left: (width - size) / 2, top: margin },
  ];
  const overlap = (p: { left: number; top: number }) =>
    obstacles.reduce(
      (sum, r) =>
        sum +
        Math.max(
          0,
          Math.min(p.left + size, r.right) - Math.max(p.left, r.left),
        ) *
          Math.max(
            0,
            Math.min(p.top + size, r.bottom) - Math.max(p.top, r.top),
          ),
      0,
    );
  return candidates.reduce((best, p) =>
    overlap(p) < overlap(best) ? p : best,
  );
}
