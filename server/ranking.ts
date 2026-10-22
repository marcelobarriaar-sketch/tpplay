import { createHash } from 'node:crypto';
export type Reward = {student_id:string;amount:number;created_at:string};
export function rankingSummary(events:Reward[],actor:string){
 const totals=new Map<string,number>();
 for(const event of events)totals.set(event.student_id,(totals.get(event.student_id)||0)+event.amount);
 const score=totals.get(actor)||0;
 const rank=(scores:Map<string,number>,who:string)=>{const own=scores.get(who)||0;return own>0?1+[...scores.values()].filter(n=>n>own).length:null;};
 const latest=events.filter(e=>e.student_id===actor&&e.amount>0).reduce<string|null>((d,e)=>!d||e.created_at>d?e.created_at:d,null);
 const previous=new Map<string,number>();
 if(latest)for(const e of events)if(e.created_at<latest)previous.set(e.student_id,(previous.get(e.student_id)||0)+e.amount);
 const position=rank(totals,actor);
 let before=rank(previous,actor);
 if(before===null&&latest){const first=new Map<string,number>();for(const e of events)if(e.created_at<=latest)first.set(e.student_id,(first.get(e.student_id)||0)+e.amount);before=rank(first,actor);}
 const alias=(id:string)=>`Vecino ${createHash('sha256').update('tpplay-ranking:'+id).digest('hex').slice(0,12).toUpperCase()}`;
 const rows=[...totals].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]||alias(a[0]).localeCompare(alias(b[0])));
 return {currency:'Coihues',total:rows.length,updatedAt:new Date().toISOString(),you:{alias:alias(actor),coins:score,position,previousPosition:before,movement:position!==null&&before!==null?before-position:null,referenceAt:latest},rows:rows.slice(0,50).map(([id,coins])=>({alias:alias(id),coins,position:rank(totals,id),isYou:id===actor}))};
}
