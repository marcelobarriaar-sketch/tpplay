import {
  initialProgress,
  restore,
  challengesFor,
  completed,
} from "../src/games/coihue/progress.js";
import { missions } from "../src/games/coihue/content.js";
import { reduceGame, demand, type GameEvent } from "./learningDomain.js";
export function replayLocalCoihue(raw: unknown) {
  const checked = restore(JSON.stringify(raw));
  demand(
    !checked.notice,
    "El recorrido local es incompatible. Conservamos sus datos.",
  );
  const target = checked.state;
  let state = initialProgress();
  const apply = (event: GameEvent) => {
    state = reduceGame(state, event).state;
  };
  apply({ type: "start" });
  apply({ type: "avatar", value: target.avatar });
  apply({ type: "nickname", value: target.nickname });
  for (const mission of missions) {
    if (!target.visited.includes(mission.id)) break;
    apply({ type: "visit", mission: mission.id });
    apply({ type: "begin" });
    for (const challenge of challengesFor(target, mission.id)) {
      const answered = challenge.items.some((i) => target.answers[i.id]);
      if (!answered) break;
      if (
        target.hints.includes(challenge.id) ||
        challenge.items.some((i) => target.answers[i.id]?.assisted)
      )
        apply({ type: "hint", challenge: challenge.id });
      for (const item of challenge.items) {
        const a = target.answers[item.id];
        if (a)
          apply({
            type: "answer",
            challenge: challenge.id,
            item: item.id,
            value: a.value,
          });
      }
      if (target.advanced.includes(challenge.id))
        apply({ type: "advance", challenge: challenge.id });
      else break;
    }
  }
  return {
    state,
    details: {
      kind: "local_import",
      source: "browser",
      history_reconstructed: false,
      missions: missions
        .filter((m) => state.visited.includes(m.id))
        .map((m) => {
          const plan = challengesFor(state, m.id),
            step = plan.filter((c) => state.advanced.includes(c.id)).length;
          return {
            id: m.id,
            completed: completed(state, m.id),
            percentage: Math.round((step / plan.length) * 100),
            step,
          };
        }),
    },
  };
}
