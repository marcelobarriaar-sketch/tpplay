import type { ReactionEvent } from "../reactions/reactions";
import { missions } from "./content";
import { completed, type Progress } from "./progress";
/** Celebrate only newly accepted chapter completions, never a restored checkpoint. */
export function tributeReactions(
  before: Progress,
  after: Progress,
): ReactionEvent[] {
  if (!before.started || !after.started) return [];
  return missions
    .filter((m) => !completed(before, m.id) && completed(after, m.id))
    .map((m) => ({
      id: `tributos:${m.id}:${after.advanced.length}`,
      type: "success",
      message: `¡${m.badge}!`,
      detail:
        "Completaste este capítulo. Revisa lo aprendido en tu pasaporte y prepara el siguiente encargo.",
    }));
}
