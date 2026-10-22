import test from 'node:test';
import assert from 'node:assert/strict';
import {rankingSummary,type Reward} from '../server/ranking';
test('ranking uses immutable rewards, shares ties and exposes no identity fields',()=>{
 const events:Reward[]=[{student_id:'private-a',amount:100,created_at:'2026-01-01T00:00:00Z'},{student_id:'private-b',amount:100,created_at:'2026-01-02T00:00:00Z'},{student_id:'private-a',amount:50,created_at:'2026-01-03T00:00:00Z'}];
 const board=rankingSummary(events,'private-a');assert.equal(board.you.coins,150);assert.equal(board.you.position,1);assert.equal(board.you.previousPosition,1);assert.equal(board.you.movement,0);assert.doesNotMatch(JSON.stringify(board),/private-a|private-b|student_id|email/);
 const tie=rankingSummary(events.slice(0,2),'private-b');assert.deepEqual(tie.rows.map(r=>r.position),[1,1]);
 assert.equal(rankingSummary([],'new').you.position,null);
});
test('position can rise or fall without losing coins and own row remains visible outside top 50',()=>{
 const events:Reward[]=[{student_id:'a',amount:100,created_at:'2026-01-01'},{student_id:'b',amount:100,created_at:'2026-01-02'},{student_id:'a',amount:100,created_at:'2026-01-03'}];
 const fallen=rankingSummary(events,'b');assert.equal(fallen.you.coins,100);assert.equal(fallen.you.position,2);assert.equal(fallen.you.movement,-1);
 const rising=rankingSummary([{student_id:'a',amount:100,created_at:'2026-01-01'},{student_id:'b',amount:150,created_at:'2026-01-02'},{student_id:'a',amount:100,created_at:'2026-01-03'}],'a');assert.equal(rising.you.movement,1);
 const many=rankingSummary(Array.from({length:60},(_,i)=>({student_id:String(i),amount:i+1,created_at:'2026-01-01'})),'0');assert.equal(many.rows.length,50);assert.equal(many.you.position,60);assert.equal(many.total,60);
});
