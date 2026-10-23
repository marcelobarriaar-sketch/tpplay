import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {BusinessBudget} from '../src/games/inicio/Budget';
import {budgetSummary,decisionImpact} from '../src/games/inicio/economy';
import {freshAttempt,reduceMission,importAttempt} from '../server/missionDomain';
import {managementRewards,rankingSummary} from '../server/ranking';
const correct=['0','1','2','1','3','2','1','2'];
test('business costs apply once on confirmation, survive reload and cannot be forged through import',()=>{
 let a=freshAttempt('00000000-0000-4000-8000-000000000001','inicio-actividades');assert.equal(a.economyVersion,1);assert.equal(budgetSummary(a).balance,300);
 a=reduceMission(a,{type:'answer',value:'1'});assert.equal(budgetSummary(a).balance,300);
 const preview=renderToStaticMarkup(<BusinessBudget attempt={a} index={0} answer="1"/>);assert.match(preview,/Si confirmas: −\$20/);assert.match(preview,/\$300 Coihues disponibles/);
 a=reduceMission(a,{type:'confirm'});assert.equal(budgetSummary(a).balance,280);assert.throws(()=>reduceMission(a,{type:'confirm'}));
 a=importAttempt({...JSON.parse(JSON.stringify(a)),balance:9999,spent:0},a.id);assert.equal(budgetSummary(a).balance,280);assert.equal(budgetSummary(a).entries.length,1);
 const html=renderToStaticMarkup(<BusinessBudget attempt={a} index={0} answer="1" confirmed/>);assert.match(html,/Gasto confirmado: −\$20/);assert.match(html,/Siguiente paso/);
});
test('all choices have a defined cost, correct choices preserve budget and legacy attempts are not charged retroactively',()=>{
 for(let i=0;i<8;i++){assert.equal(decisionImpact(i,correct[i])?.cost,0);for(let j=0;j<(i===4?16:3);j++){const impact=decisionImpact(i,String(j));assert.ok(impact);assert.ok(impact.cost>=0);}}
 const a={missionSlug:'inicio-actividades',answers:correct,confirmed:Array(8).fill(true)};assert.equal(budgetSummary(a).balance,300);
 assert.match(renderToStaticMarkup(<BusinessBudget attempt={a}/>),/comenzó antes del presupuesto/);
 assert.equal(decisionImpact(4,'16'),null);
});
test('management ranking uses best completed budget without farming repeated attempts or accepting old and malformed records',()=>{
 const row={id:'one',student_id:'student',completed_at:'2026-10-22T10:00:00Z',economyVersion:1,answers:['1',...correct.slice(1)],confirmed:Array(8).fill(true)};
 const improved={...row,id:'two',completed_at:'2026-10-22T11:00:00Z',answers:correct};
 const events=managementRewards([row,improved,{...improved,id:'three'}, {...row,id:'old',economyVersion:0},{...row,id:'bad',answers:['999']}]);assert.deepEqual(events.map(e=>e.amount),[280,20]);assert.equal(rankingSummary(events,'student').you.coins,300);
});
