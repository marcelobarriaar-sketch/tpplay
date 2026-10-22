import {test} from 'node:test';
import assert from 'node:assert/strict';
import {missions,allChallenges,allItems,concepts,sources} from '../src/games/coihue/content';
import {places} from '../src/games/coihue/world';
import {initialProgress,answer,advance,completed,currentChallenge,learning,restore,unlocked,useHint,challengesFor} from '../src/games/coihue/progress';
function solve(state:ReturnType<typeof initialProgress>,challenge:typeof allChallenges[number]){for(const i of challenge.items)state=answer(state,challenge,i.id,challenge.kind==='order'?challenge.order!.join(','):i.correct);return advance(state,challenge);}
test('content has seven missions, eight shared places, valid feedback and distinct transfer cases',()=>{
 assert.equal(missions.length,7);assert.equal(places.length,8);assert.equal(new Set(allChallenges.map(c=>c.id)).size,allChallenges.length);assert.equal(new Set(allItems.map(c=>c.id)).size,allItems.length);
 for(const m of missions){assert.ok(m.lesson.length);assert.ok(places.some(p=>p.id===m.place));assert.ok(m.challenges.length>=2);for(const c of [...m.challenges,m.rescue]){assert.ok(c.hint);for(const i of c.items){assert.ok(concepts.some(k=>k.id===i.concept));assert.ok(i.options.some(o=>o.id===i.correct));assert.ok(i.explanation);assert.ok(i.options.every(o=>!!o.feedback));}}}
 for(const c of concepts){assert.ok(c.sources.every(id=>sources.some(s=>s.id===id)));assert.ok(new Set(allChallenges.filter(x=>x.items.some(i=>i.concept===c.id)).map(x=>x.id)).size>=2);}
});
test('full adventure unlocks sequentially and records understanding separately from completion',()=>{
 let state=initialProgress();state.started=true;
 for(const m of missions){assert.ok(unlocked(state,m.id));state={...state,active:m.id,phase:'play',visited:[...state.visited,m.id]};let c=currentChallenge(state,m.id);while(c){state=solve(state,c);c=currentChallenge(state,m.id);}assert.ok(completed(state,m.id));}
 assert.ok(missions.every(m=>completed(state,m.id)));for(const c of concepts)assert.equal(learning(state,c.id),'Comprendido');assert.deepEqual(restore(JSON.stringify(state)).state,state);
});
test('guessing and hints cannot be presented as independent understanding; a fresh case is offered',()=>{
 let s=initialProgress();s.started=true;s.visited=['pagos'];const m=missions[0];for(const c of m.challenges){s=useHint(s,c.id);s=solve(s,c);}assert.equal(learning(s,'pagos'),'Comprendido con apoyo');assert.equal(completed(s,m.id),false);assert.equal(currentChallenge(s,m.id)?.id,m.rescue.id);s=solve(s,m.rescue);assert.equal(completed(s,m.id),true);assert.equal(learning(s,'pagos'),'Comprendido con apoyo');
 let other=initialProgress();const c=m.challenges[0];const i=c.items[0];other=answer(other,c,i.id,i.options.find(o=>o.id!==i.correct)!.id);other=answer(other,c,i.id,i.correct);assert.ok(other.answers[i.id].assisted);assert.equal(learning(other,'pagos'),'Por reforzar');
});
test('two fresh autonomous cases after support provide new independent evidence',()=>{
 let s=initialProgress();s.started=true;s.visited=['pagos'];s=useHint(s,missions[0].challenges[0].id);for(const c of missions[0].challenges)s=solve(s,c);s=solve(s,missions[0].rescue);assert.equal(learning(s,'pagos'),'Comprendido');
});
test('incorrect answers can advance without blocking, but completion never implies mastery',()=>{
 let s=initialProgress();s.started=true;
 for(const m of missions){s={...s,visited:[...s.visited,m.id]};for(const c of challengesFor(s,m.id)){for(const i of c.items)s=answer(s,c,i.id,c.kind==='order'?[...c.order!].reverse().join(','):i.options.find(o=>o.id!==i.correct)!.id);s=advance(s,c);}const rescue=currentChallenge(s,m.id);if(rescue){for(const i of rescue.items)s=answer(s,rescue,i.id,i.options.find(o=>o.id!==i.correct)!.id);s=advance(s,rescue);}assert.ok(completed(s,m.id));}
 for(const c of concepts)assert.equal(learning(s,c.id),'Por reforzar');
});
test('restores valid checkpoints and recovers corrupt, incompatible or invalid evidence safely',()=>{
 let s=initialProgress();s.started=true;s.visited=['pagos'];s.active='pagos';s.phase='play';s=solve(s,missions[0].challenges[0]);assert.deepEqual(restore(JSON.stringify(s)).state,s);
 for(const raw of ['bad JSON',JSON.stringify({...s,version:100}),JSON.stringify({...s,answers:{unknown:{}}}),JSON.stringify({...s,advanced:['missing']}),JSON.stringify({...s,answers:{...s.answers,nicolas:{value:'1',attempts:1,correct:true,assisted:false}}})])assert.equal(restore(raw).state.started,false);
 assert.equal(restore(null).notice,'');assert.ok(restore('bad').notice);
});

test('targeted fresh cases after support survive reload without requiring unrelated answers',()=>{let s=initialProgress();s.started=true;for(const m of missions){s={...s,visited:[...s.visited,m.id]};for(const c of m.challenges){if(m.id==='archivo'&&c.id==='archivo-1')s=useHint(s,c.id);s=solve(s,c);}const rescue=currentChallenge(s,m.id);if(rescue){assert.ok(rescue.items.length< m.rescue.items.length);s=solve(s,rescue);}assert.deepEqual(restore(JSON.stringify(s)).state,s);}});
