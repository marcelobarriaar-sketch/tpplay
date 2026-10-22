import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter} from 'react-router-dom';
import {publicMissions} from '../src/publication';
import {missions} from '../src/data';
import {DemoProvider} from '../src/store';
import {Home,Catalog} from '../src/pages';
import {missionFor} from '../server/missionDomain';
test('published missions appear automatically in both homepage and explorer, newest first and without drafts',()=>{
 const camila=missions.find(m=>m.slug==='inicio-actividades')!;
 const future={...camila,slug:'new-published',title:'Otra misión publicada',publishedAt:'2026-10-23'};
 const draft={...future,slug:'draft',title:'Borrador oculto',publication:'draft' as const};
 const list=publicMissions([...missions,future,draft]);assert.equal(list[0].slug,'new-published');assert.ok(!list.some(m=>m.slug==='draft'));
 missions.push(future,draft);
 try{
  for(const Page of [Home,Catalog]){const html=renderToStaticMarkup(<MemoryRouter><DemoProvider><Page/></DemoProvider></MemoryRouter>);assert.match(html,/Otra misión publicada/);assert.doesNotMatch(html,/Borrador oculto/);assert.match(html,/La primera apertura: expediente Coihue/);assert.match(html,/Rescate del invernadero/);assert.ok(html.indexOf('Otra misión publicada')<html.indexOf('La primera apertura: expediente Coihue'));}
  assert.throws(()=>missionFor('draft'));assert.equal(missionFor('new-published').slug,'new-published');
 }finally{missions.splice(-2);}
});
