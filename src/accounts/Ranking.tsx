import {useEffect,useState,useRef} from 'react';
import {Link} from 'react-router-dom';
import {Guard} from './Identity';
import {useAccount} from './Session';
import {learningApi} from './client';
type Row={alias:string;coins:number;position:number|null;isYou:boolean};
type Board={total:number;updatedAt:string;you:{alias:string;coins:number;position:number|null;previousPosition:number|null;movement:number|null;referenceAt:string|null};rows:Row[]};
export function CoinRanking({compact=false}:{compact?:boolean}){
 const {profile}=useAccount();const [data,setData]=useState<Board|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const owner=useRef(profile?.id);owner.current=profile?.id;
 useEffect(()=>{setData(null);setError('');},[profile?.id]);
 async function load(){const own=profile?.id;setBusy(true);try{const next=await learningApi<Board>('ranking');if(own===owner.current){setData(next);setError('');}}catch(e){if(own===owner.current)setError((e as Error).message);}finally{if(own===owner.current)setBusy(false);}}
 useEffect(()=>{if(profile?.role!=='student')return;let active=true;
 const refresh=async()=>{try{const next=await learningApi<Board>('ranking');if(active){setData(next);setError('');}}catch(e){if(active)setError((e as Error).message);}};
 void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh();},30000);return()=>{active=false;clearInterval(timer);};},[profile?.id,profile?.role]);
 if(profile?.role!=='student')return <section className="panel spaced"><h2>Coihues y ranking</h2><p>Los Coihues son puntos de Villa del Coihue, sin valor monetario. Ingresa con una cuenta de estudiante para ver tu saldo y comparar tu avance con otros participantes. El avance como invitado no entra al ranking.</p><Link className="button" to="/cuenta/ingresar">Ingresar</Link></section>;
 return <section className="panel spaced coin-ranking" aria-label="Coihues y ranking"><p className="eyebrow">VILLA DEL COIHUE · TU RECORRIDO</p><h2>{compact?'Tus Coihues y tu posición':'Ranking de Coihues'}</h2><p>100 Coihues al completar una misión por primera vez y 50 al mejorarla una vez. Conservas los puntos ganados anteriormente: 1 XP equivale a 1 Coihue. No tienen valor monetario.</p>
 {error&&<p role="alert">{error} El ranking no se pudo actualizar.</p>}
 {!data&&!error&&<p role="status">Consultando recompensas del servidor…</p>}
 {data&&<><div className="stats-grid"><div className="stat"><strong>◈ {data.you.coins}</strong><span>Coihues acumulados</span></div><div className="stat"><strong>{data.you.position?`#${data.you.position}`:'Sin puesto aún'}</strong><span>{data.total} participantes con recompensas</span></div></div><p aria-live="polite">{data.you.movement===null?'Tu primer puesto se establece al ganar Coihues.':data.you.movement>0?`Subiste ${data.you.movement} puestos.`:data.you.movement<0?`Bajaste ${-data.you.movement} puestos.`:'Mantienes tu puesto.'} {data.you.previousPosition!==null&&'Comparación con tu puesto antes de la última recompensa; para la primera, se usa el puesto al obtenerla.'}</p><p className="small muted">Tu alias: {data.you.alias}. Puedes bajar de puesto cuando otros avanzan; no pierdes Coihues por equivocarte. Los empates comparten puesto.</p>
 {!compact&&<div className="ranking-table"><table><caption>Primeros 50 participantes · solo alias</caption><thead><tr><th scope="col">Puesto</th><th scope="col">Participante</th><th scope="col">Coihues</th></tr></thead><tbody>{data.rows.map(row=><tr key={row.alias} className={row.isYou?'ranking-you':''}><td>{row.position}</td><th scope="row">{row.alias}{row.isYou?' · Tú':''}</th><td>{row.coins}</td></tr>)}</tbody></table>{data.rows.length===0&&<p>Todavía no hay recompensas registradas. Completa tu primera misión para comenzar.</p>}</div>}
 <p className="small muted">Consultado: {new Date(data.updatedAt).toLocaleString('es-CL',{timeZone:'America/Santiago'})}. Se actualiza cada 30 segundos mientras esta pestaña está visible.</p></>}
 <button className="button secondary" onClick={load} disabled={busy}>{busy?'Actualizando…':'Actualizar posición'}</button> {compact&&<Link className="text-link" to="/ranking">Ver ranking completo</Link>}</section>;
}
export default function Ranking(){return <Guard roles={['student']}><CoinRanking/></Guard>;}
