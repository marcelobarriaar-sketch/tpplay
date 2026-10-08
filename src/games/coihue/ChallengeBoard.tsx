import {useState} from 'react';
import {Building} from './Map';
import type {Challenge,Item} from './content';
import type {Progress} from './progress';
const orderLabels:Record<string,string>={revisar:'Revisar los antecedentes',declarar:'Presentar la declaración',pagar:'Pagar si corresponde',guardar:'Guardar los comprobantes'};
export default function ChallengeBoard({challenge,state,onAnswer}:{challenge:Challenge;state:Progress;onAnswer:(id:string,value:string)=>void}) {
 const [order,setOrder]=useState(()=>state.answers[challenge.items[0].id]?.value.split(',')||['guardar','pagar','revisar','declarar']);
 const [page,setPage]=useState(0);const paged=challenge.items.length>3;const visible=paged?challenge.items.slice(page*2,page*2+2):challenge.items;
 if(challenge.kind==='order'){
  const result=state.answers[challenge.items[0].id];
  const move=(index:number,change:number)=>{const next=[...order];[next[index],next[index+change]]=[next[index+change],next[index]];setOrder(next);};
  return <div className="valley-order"><p className="valley-simulation">CARPETA DE ROSA · SIMULACIÓN EDUCATIVA</p><p>Reordena las acciones con los botones subir y bajar. No necesitas arrastrar.</p><ol>{order.map((id,index)=><li key={id}><span className="valley-number">{index+1}</span><strong>{orderLabels[id]}</strong><div><button className="button secondary" aria-label={`Subir: ${orderLabels[id]}`} disabled={index===0||result?.correct} onClick={()=>move(index,-1)}>↑</button><button className="button secondary" aria-label={`Bajar: ${orderLabels[id]}`} disabled={index===order.length-1||result?.correct} onClick={()=>move(index,1)}>↓</button></div></li>)}</ol><button className="button" disabled={result?.correct} onClick={()=>onAnswer(challenge.items[0].id,order.join(','))}>Comprobar orden</button>{result&&<p className={`valley-feedback ${result.correct?'good':'review'}`} role="status"><strong>{result.correct?'✓ Carpeta organizada.':'↻ Revisa el orden.'}</strong> {result.correct?challenge.items[0].explanation:'Primero revisa los antecedentes; después declara, paga si corresponde y guarda los comprobantes. Declarar no acredita que hayas pagado.'}</p>}</div>;
 }
 return <><div className={`valley-workboard type-${challenge.kind}`}>{visible.map(item=><ChoiceCard key={item.id} item={item} kind={challenge.kind} answer={state.answers[item.id]} onAnswer={onAnswer}/>)}</div>{paged&&<nav className="valley-actions" aria-label="Rondas de la investigación"><button className="button secondary" disabled={page===0} onClick={()=>setPage(page-1)}>Ronda anterior</button><span>Ronda {page+1} de {Math.ceil(challenge.items.length/2)}</span><button className="button secondary" disabled={page>=Math.ceil(challenge.items.length/2)-1} onClick={()=>setPage(page+1)}>Siguiente ronda</button></nav>}</>;
}
function ChoiceCard({item,kind,answer,onAnswer}:{item:Item;kind:Challenge['kind'];answer:Progress['answers'][string]|undefined;onAnswer:(id:string,value:string)=>void}) {
 const [selected,setSelected]=useState(answer?.value||'');const [exploring,setExploring]=useState(kind!=='explore');
 return <article className={`valley-task ${answer?.correct?'solved':''}`}>
 {kind==='explore'&&<button className="valley-building-button" onClick={()=>setExploring(!exploring)} aria-expanded={exploring}><Building kind={item.visual||'shop'}/><span>{exploring?'Cerrar observación':'Observar lugar'}</span></button>}
 {kind==='deliver'&&<p className="valley-simulation">✉ CORRESPONDENCIA · VALLE DEL COIHUE</p>}{kind==='channel'&&<p className="valley-simulation">▣ PORTAL FICTICIO · SIN TRÁMITES REALES</p>}{kind==='match'&&<p className="valley-simulation">◈ TARJETA POR RECONSTRUIR</p>}
 <h3>{item.prompt}</h3>{exploring&&<><fieldset disabled={!!answer?.correct}><legend className="sr-only">{item.prompt}</legend>{item.options.map(option=><label key={option.id} className={`valley-choice ${selected===option.id?'chosen':''}`}><input type="radio" name={item.id} value={option.id} checked={selected===option.id} onChange={()=>setSelected(option.id)}/><span>{kind==='deliver'?'Entregar a ':kind==='channel'?'Elegir: ':''}{option.label}</span></label>)}</fieldset><button className="button secondary" disabled={!selected||answer?.correct} onClick={()=>onAnswer(item.id,selected)}>{kind==='deliver'?'Entregar sobre':kind==='channel'?'Confirmar canal':kind==='match'?'Asociar tarjeta':'Comprobar decisión'}</button></>}
 {answer&&<p className={`valley-feedback ${answer.correct?'good':'review'}`} role="status"><strong>{answer.correct?'✓ Decisión fundamentada.':'↻ Hay una idea por revisar.'}</strong> {answer.correct?item.explanation:item.options.find(o=>o.id===answer.value)?.feedback}{answer.assisted&&<span className="valley-support">Con apoyo registrado</span>}</p>}
 </article>;
}
