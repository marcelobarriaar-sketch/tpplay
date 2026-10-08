import {allChallenges,allItems,contentVersion,missions,concepts,type Challenge,type ConceptId} from './content';
import {avatars} from './world';
export const storageKey='tpplay.coihue.tributos.v1';
export type Answer={value:string;attempts:number;correct:boolean;assisted:boolean};
export type Progress={version:1;contentVersion:number;started:boolean;avatar:string;nickname:string;visited:string[];active:string|null;phase:'intro'|'play';answers:Record<string,Answer>;hints:string[];advanced:string[]};
export function initialProgress():Progress{return {version:1,contentVersion,started:false,avatar:'lago',nickname:'',visited:[],active:null,phase:'intro',answers:{},hints:[],advanced:[]};}
export function needsRescue(state:Progress,missionId:string){const mission=missions.find(m=>m.id===missionId)!;return mission.challenges.some(c=>state.hints.includes(c.id)||c.items.some(i=>state.answers[i.id]?.assisted||!state.answers[i.id]?.correct&&state.advanced.includes(c.id)));}
export function challengesFor(state:Progress,missionId:string):Challenge[]{
 const mission=missions.find(m=>m.id===missionId)!;
 const supported=new Set(mission.challenges.flatMap(c=>c.items.filter(i=>state.hints.includes(c.id)||state.answers[i.id]?.assisted||state.advanced.includes(c.id)&&!state.answers[i.id]?.correct).map(i=>i.concept)));
 const rescue={...mission.rescue,items:mission.rescue.items.filter(i=>supported.has(i.concept))};
 return [...mission.challenges,...needsRescue(state,missionId)&&rescue.items.length?[rescue]:[]];
}
export function completed(state:Progress,missionId:string){return challengesFor(state,missionId).every(c=>state.advanced.includes(c.id));}
export function unlocked(state:Progress,missionId:string){const index=missions.findIndex(m=>m.id===missionId);return index===0||index>0&&completed(state,missions[index-1].id);}
export function currentChallenge(state:Progress,missionId:string){return challengesFor(state,missionId).find(c=>!state.advanced.includes(c.id));}
export function answer(state:Progress,challenge:Challenge,itemId:string,value:string):Progress {
 const item=challenge.items.find(i=>i.id===itemId);if(!item||state.advanced.includes(challenge.id))return state;
 const previous=state.answers[itemId];if(previous?.correct)return state;const correct=challenge.kind==='order'?value===challenge.order!.join(','):value===item.correct;
 return {...state,answers:{...state.answers,[itemId]:{value,attempts:(previous?.attempts||0)+1,correct,assisted:!!previous?.assisted||!!previous&&!previous.correct||state.hints.includes(challenge.id)}}};
}
export function useHint(state:Progress,challengeId:string):Progress{return {...state,hints:[...new Set([...state.hints,challengeId])],answers:Object.fromEntries(Object.entries(state.answers).map(([id,a])=>[id,allChallenges.find(c=>c.id===challengeId)?.items.some(i=>i.id===id)?{...a,assisted:true}:a]))};}
export function advance(state:Progress,challenge:Challenge):Progress {if(challenge.items.some(i=>!state.answers[i.id]))return state;return {...state,advanced:[...new Set([...state.advanced,challenge.id])]};}
export function learning(state:Progress,concept:ConceptId):'Comprendido'|'Comprendido con apoyo'|'Por reforzar'{
 const evidence=allChallenges.filter(c=>state.advanced.includes(c.id)&&c.items.some(i=>i.concept===concept)).map(c=>{const items=c.items.filter(i=>i.concept===concept);return {correct:items.every(i=>state.answers[i.id]?.correct),independent:!state.hints.includes(c.id)&&items.every(i=>state.answers[i.id]?.correct&&!state.answers[i.id]?.assisted)};});
 if(evidence.filter(e=>e.independent).length>=2)return 'Comprendido';
 if(evidence.filter(e=>e.correct).length>=2)return 'Comprendido con apoyo';
 return 'Por reforzar';
}
export function discovered(state:Progress){return concepts.filter(c=>missions.some(m=>state.visited.includes(m.id)&&m.concepts.includes(c.id)));}
/** Reject corrupt/incompatible data instead of trusting arbitrary completion flags. */
export function restore(raw:string|null):{state:Progress;notice:string} {
 if(!raw)return {state:initialProgress(),notice:''};
 try {
  const p=JSON.parse(raw) as Progress;
  const list=(value:unknown,ids:string[])=>Array.isArray(value)&&value.every(id=>typeof id==='string'&&ids.includes(id))&&new Set(value).size===value.length;
  if(!p||p.version!==1||p.contentVersion!==contentVersion||typeof p.started!=='boolean'||!avatars.some(a=>a.id===p.avatar)||typeof p.nickname!=='string'||p.nickname.length>24||!list(p.visited,missions.map(m=>m.id))||!(p.active===null||missions.some(m=>m.id===p.active))||!['intro','play'].includes(p.phase)||!list(p.hints,allChallenges.map(c=>c.id))||!list(p.advanced,allChallenges.map(c=>c.id))||!p.answers||typeof p.answers!=='object'||Array.isArray(p.answers))throw Error('schema');
  for(const [id,a] of Object.entries(p.answers)){
   const item=allItems.find(i=>i.id===id);const challenge=allChallenges.find(c=>c.items.some(i=>i.id===id));
   if(!item||!challenge||!a||typeof a.value!=='string'||!Number.isInteger(a.attempts)||a.attempts<1||a.attempts>10000||typeof a.correct!=='boolean'||typeof a.assisted!=='boolean')throw Error('answer');
   if(challenge.kind==='order') {const order=a.value.split(',');if(!list(order,challenge.order!)||order.length!==challenge.order!.length||a.correct!==(a.value===challenge.order!.join(',')))throw Error('order');}
   else if(!item.options.some(o=>o.id===a.value)||a.correct!==(a.value===item.correct))throw Error('choice');
   if(a.attempts>1&&!a.assisted)throw Error('evidence');
  }
  // A finished check must have a response (correct or explicitly advanced for reinforcement).
  if(p.advanced.some(id=>{const m=missions.find(m=>[...m.challenges,m.rescue].some(c=>c.id===id))!;const c=challengesFor(p,m.id).find(c=>c.id===id);return !c||c.items.some(i=>!p.answers[i.id]);}))throw Error('missing evidence');
  if(!p.started&&(p.visited.length||p.advanced.length||Object.keys(p.answers).length))throw Error('not started');
  for(const m of missions){const plan=challengesFor(p,m.id);if(plan.some(c=>p.advanced.includes(c.id))&&(!p.visited.includes(m.id)||!unlocked(p,m.id)))throw Error('sequence');for(let index=0;index<plan.length;index++)if(p.advanced.includes(plan[index].id)&&plan.slice(0,index).some(c=>!p.advanced.includes(c.id)))throw Error('sequence');}
  const normalized:Progress={...p,answers:Object.fromEntries(Object.entries(p.answers).map(([id,a])=>[id,{...a,assisted:a.assisted||p.hints.some(h=>allChallenges.find(c=>c.id===h)!.items.some(i=>i.id===id))}]))};
  if(normalized.active&&!unlocked(normalized,normalized.active))throw Error('locked');
  return {state:normalized,notice:''};
 }catch{return {state:initialProgress(),notice:'El avance guardado era incompatible o estaba dañado. Recuperamos una aventura nueva; las otras misiones de TP PLAY conservan su progreso.'};}
}
