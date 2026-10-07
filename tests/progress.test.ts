import assert from 'node:assert/strict';
import { test } from 'node:test';
import { missions } from '../src/data.ts';
import { parseDemoState, summarize, scoreAttempt, type Attempt } from '../src/progress.ts';
function completed(id: string, correct: number, at: string): Attempt {
  const mission = missions[0];
  return { id, missionSlug: mission.slug, version: mission.version, createdAt: at, completedAt: at, index: mission.steps.length, answers: mission.steps.map((step,i) => String(i < correct ? step.correct : step.correct + 1)), confirmed: mission.steps.map(()=>true), evidence: 'Explicación de demostración con datos del caso.' };
}
test('rewards completion once and improvement once, including duplicate records and reload', () => {
  const first=completed('first',1,'2026-10-07T10:00:00Z'); const second=completed('second',2,'2026-10-07T11:00:00Z'); const third=completed('third',3,'2026-10-07T12:00:00Z');
  assert.equal(summarize([first]).xp,100);
  assert.equal(summarize([first,first]).xp,100);
  assert.equal(summarize([first,second]).xp,150);
  assert.equal(summarize([first,second,third]).xp,150);
  const saved=parseDemoState(JSON.stringify({schema:1,attempts:[first,second,third],reducedMotion:false}));
  assert.equal(summarize(saved.attempts).xp,150);
});
test('drafts and unconfirmed answers award no completion XP or criteria', () => {
  const draft=completed('draft',3,'2026-10-07T10:00:00Z'); delete draft.completedAt;
  assert.equal(summarize([draft]).xp,0);
  draft.confirmed=[]; assert.equal(scoreAttempt(draft),0);
  draft.confirmed=[true,true,true]; draft.answers=['','','']; assert.equal(scoreAttempt(draft),0);
});
test('each mission awards its own base XP, retrying a perfect score awards nothing extra', () => {
  const first=completed('a',3,'2026-10-07T10:00:00Z'); const next=completed('b',3,'2026-10-07T11:00:00Z');
  assert.equal(summarize([first,next]).xp,100);
  const all=missions.map((m,i)=>({...first,id:`mission-${i}`,missionSlug:m.slug,answers:m.steps.map(s=>String(s.correct))}));
  assert.equal(summarize(all).xp,300);
});
test('storage parsing recovers the current stage and rejects malformed or incompatible data', () => {
  const draft=completed('draft',1,'2026-10-07T10:00:00Z');delete draft.completedAt;draft.index=1;
  const parsed=parseDemoState(JSON.stringify({schema:1,attempts:[draft],reducedMotion:true}));
  assert.equal(parsed.attempts[0].index,1);assert.equal(parsed.reducedMotion,true);
  assert.throws(()=>parseDemoState('{invalid'));
  assert.throws(()=>parseDemoState(JSON.stringify({schema:2,attempts:[]})));
  assert.throws(()=>parseDemoState(JSON.stringify({schema:1,attempts:[{...draft,index:99}]})));
});
