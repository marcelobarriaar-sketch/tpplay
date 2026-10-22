import type {Mission} from './data';
export function publicMissions(items:readonly Mission[]):Mission[]{
 return items.filter(m=>m.publication==='published').sort((a,b)=>(b.publishedAt||'').localeCompare(a.publishedAt||''));
}
