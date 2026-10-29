import test from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import ChallengeBoard from "../src/games/coihue/ChallengeBoard";
import { ChapterBrief, chapters, TributeHUD } from "../src/games/coihue/story";
import { allChallenges, missions } from "../src/games/coihue/content";
import {
  initialProgress,
  currentChallenge,
  restore,
  completed,
} from "../src/games/coihue/progress";
import { reduceGame } from "../server/learningDomain";
import { tributeReactions } from "../src/games/coihue/reactions";

test("each chapter has a contextual brief and every challenge type has a playable desk", () => {
  for (const mission of missions) {
    assert.ok(chapters[mission.id]?.setup);
    assert.ok(chapters[mission.id]?.ending);
    const html = renderToStaticMarkup(
      <MemoryRouter>
        <ChapterBrief mission={mission} disabled={false} onBegin={() => {}} />
      </MemoryRouter>,
    );
    assert.match(html, /Comenzar investigación/);
    assert.match(html, /tributos-vecinos.webp/);
  }
  for (const challenge of allChallenges) {
    const html = renderToStaticMarkup(
      <ChallengeBoard
        challenge={challenge}
        state={initialProgress()}
        onAnswer={() => {}}
      />,
    );
    assert.doesNotMatch(html, /type="radio"/);
    assert.match(html, /button/);
    for (const item of challenge.items)
      if (challenge.kind !== "order")
        assert.match(
          html,
          new RegExp(
            `(?:Ficha|Sobre|Vecino|${item.prompt.split(":")[0].replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
          ),
        );
  }
});
test("the new desks keep the existing persistent assessment for all seven chapters and celebrate once", () => {
  let state = initialProgress();
  let reactions = 0;
  for (const mission of missions) {
    state = reduceGame(state, { type: "visit", mission: mission.id }).state;
    state = reduceGame(state, { type: "begin" }).state;
    let challenge = currentChallenge(state, mission.id);
    while (challenge) {
      for (const item of challenge.items)
        state = reduceGame(state, {
          type: "answer",
          challenge: challenge.id,
          item: item.id,
          value:
            challenge.kind === "order"
              ? challenge.order!.join(",")
              : item.correct,
        }).state;
      const before = state;
      state = reduceGame(state, {
        type: "advance",
        challenge: challenge.id,
      }).state;
      reactions += tributeReactions(before, state).length;
      assert.deepEqual(restore(JSON.stringify(state)).state, state);
      assert.deepEqual(tributeReactions(state, state), []);
      challenge = currentChallenge(state, mission.id);
    }
    assert.equal(completed(state, mission.id), true);
  }
  assert.equal(reactions, 7);
  const html = renderToStaticMarkup(<TributeHUD state={state} />);
  assert.match(html, /Capítulos completados/);
  assert.match(html, /7 \/ 7/);
});
