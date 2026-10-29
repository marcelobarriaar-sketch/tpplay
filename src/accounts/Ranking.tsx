import {useEffect,useState,useRef} from 'react';
import {Link,useSearchParams} from 'react-router-dom';
import {Guard} from './Identity';
import {useAccount} from './Session';
import {learningApi} from './client';
type Row={alias:string;coins:number;position:number|null;isYou:boolean};
type Board={management?:Board;total:number;updatedAt:string;you:{alias:string;coins:number;position:number|null;previousPosition:number|null;movement:number|null;referenceAt:string|null};rows:Row[]};
export function CoinRanking({compact=false}:{compact?:boolean}){
 const [params]=useSearchParams(); const free=params.get("modo")==="libre";
 const {profile}=useAccount();const [data,setData]=useState<Board|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [mode,setMode]=useState<'rewards'|'management'>('rewards');
 const owner=useRef(profile?.id);owner.current=profile?.id;
 useEffect(()=>{setData(null);setError('');},[profile?.id]);
 async function load(){const own=profile?.id;setBusy(true);try{const next=await learningApi<Board>('ranking');if(own===owner.current){setData(next);setError('');}}catch(e){if(own===owner.current)setError((e as Error).message);}finally{if(own===owner.current)setBusy(false);}}
 useEffect(()=>{if(free||profile?.role!=='student')return;let active=true;
 const refresh=async()=>{try{const next=await learningApi<Board>('ranking');if(active){setData(next);setError('');}}catch(e){if(active)setError((e as Error).message);}};
 void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);return()=>{active=false;clearInterval(timer);};},[profile?.id,profile?.role,free]);
 if(free||profile?.role!=='student')return <section className="panel spaced"><h2>Coihues y ranking</h2><p>Además de aprender, irás acumulando Coihues, la moneda de Villa del Coihue. Ingresa con una cuenta de estudiante para ver tu saldo y comparar tu avance con otros participantes. El avance como invitado no entra al ranking.</p><Link className="button" to="/cuenta/ingresar">Ingresar</Link></section>;
 const selected=mode==='management'?data?.management:data;
 const board=selected;
 return <section className="panel spaced coin-ranking" aria-label="Coihues y ranking"><p className="eyebrow">VILLA DEL COIHUE · TU RECORRIDO</p><h2>{compact?'Tus Coihues y tu posición':'Ranking de Coihues'}</h2><div className="valley-actions"><button className="button secondary" aria-pressed={mode==='rewards'} onClick={()=>setMode('rewards')}>Participación</button><button className="button secondary" aria-pressed={mode==='management'} onClick={()=>setMode('management')}>Gestión del negocio</button></div>{mode==='management'&&<p>Clasificación por el mayor presupuesto conservado al terminar Inicio de actividades. Se cuenta tu mejor intento verificado por el servidor, sin sumar partidas repetidas. Los intentos anteriores a esta mecánica y las importaciones locales no participan.</p>}<p>Además de aprender, irás acumulando Coihues, la moneda de Villa del Coihue: $100 Coihues al completar una misión por primera vez y $50 Coihues adicionales al mejorarla una vez. Conservas tu saldo anterior: cada punto de experiencia equivale a $1 Coihue.</p>
 {error&&<p role="alert">{error} El ranking no se pudo actualizar.</p>}
 {!data&&!error&&<p role="status">Consultando recompensas del servidor…</p>}
 {board&&<><div className="stats-grid"><div className="stat"><strong>◈ ${board.you.coins}</strong><span>{mode==='management'?'Mejor presupuesto conservado':'Coihues acumulados'}</span></div><div className="stat"><strong>{board.you.position?`#${board.you.position}`:'Sin puesto aún'}</strong><span>{board.total} participantes con saldo registrado</span></div></div><p aria-live="polite">{board.you.movement===null?mode==='management'?'Completa una misión con presupuesto para establecer tu puesto.':'Tu primer puesto se establece al acumular Coihues.':board.you.movement>0?`Subiste ${board.you.movement} puestos.`:board.you.movement<0?`Bajaste ${-board.you.movement} puestos.`:'Mantienes tu puesto.'} {board.you.previousPosition!==null&&'Comparación con tu puesto antes de la última acumulación de Coihues; para la primera, se usa el puesto al registrarla.'}</p><p className="small muted">Tu alias: {board.you.alias}. Puedes bajar de puesto cuando otros avanzan. Los gastos del negocio se descuentan de su presupuesto, mientras tu saldo personal de Coihues se conserva. Los empates comparten puesto.</p>
 {!compact&&<div className="ranking-table"><table><caption>Primeros 50 participantes · solo alias</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Participante</th><th scope="col">Coihues</th></tr></thead><tbody>{board.rows.map(row=><tr key={row.alias} className={row.isYou?'ranking-you':''}><td>{row.position}</td><th scope="row">{row.alias}{row.isYou?' · Tú':''}</th><td>${row.coins}</td></tr>)}</tbody></table>{board.rows.length===0&&<p>Todavía no hay saldos de Coihues registrados. Completa tu primera misión para comenzar.</p>}</div>}
 <p className="small muted">Consultado: {new Date(board.updatedAt).toLocaleString('es-CL',{timeZone:'America/Santiago'})}. Se actualiza cada 30 segundos mientras esta pestaña está visible.</p></>}
 <button className="button secondary" onClick={load} disabled={busy}>{busy?'Actualizando…':'Actualizar posición'}</button> {compact&&<Link className="text-link" to="/ranking">Ver ranking completo</Link>}</section>;
}
export default function Ranking(){return <Guard roles={['student']}><CoinRanking/></Guard>;}
