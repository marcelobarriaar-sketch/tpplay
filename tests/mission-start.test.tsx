import test from 'node:test';
import assert from 'node:assert/strict';
import {renderToStaticMarkup} from 'react-dom/server';
import {MemoryRouter,Routes,Route} from 'react-router-dom';
import {missions} from '../src/data';
import {DemoProvider} from '../src/store';
import {MissionDetail} from '../src/pages';
import {MissionCard} from '../src/ui';
import {InicioStoryGate} from '../src/games/inicio/story';
import CoihueGame from '../src/games/coihue/Game';
import {initialProgress} from '../src/games/coihue/progress';
test('every published mission has a labelled play link and a start action before long detail content',()=>{
 for(const mission of missions){
 const card=renderToStaticMarkup(<MemoryRouter><MissionCard mission={mission}/></MemoryRouter>);
 assert.match(card,new RegExp(`/desafios/${mission.slug}/jugar`));assert.match(card,/Jugar:/);
 const page=renderToStaticMarkup(<MemoryRouter initialEntries={[`/desafios/${mission.slug}`]}><DemoProvider><Routes><Route path="/desafios/:slug" element={<MissionDetail/>}/></Routes></DemoProvider></MemoryRouter>);
 assert.equal((page.match(/Comenzar a jugar/g)||[]).length,1);assert.ok(page.indexOf('Comenzar a jugar')<page.indexOf('EL CASO'));
 }
});
test('story and tributary adventure expose the initial play button before long reading and optional choices',()=>{
 const camila=renderToStaticMarkup(<InicioStoryGate enabled><p>decision</p></InicioStoryGate>);
 assert.equal((camila.match(/Comenzar a jugar/g)||[]).length,1);assert.ok(camila.indexOf('Comenzar a jugar')<camila.indexOf('Una idea empieza a tomar forma'));
 const coihue=renderToStaticMarkup(<MemoryRouter><CoihueGame state={initialProgress()} onEvent={()=>{}}/></MemoryRouter>);
 assert.equal((coihue.match(/Comenzar a jugar/g)||[]).length,1);assert.ok(coihue.indexOf('Comenzar a jugar')<coihue.indexOf('Elige tu símbolo'));
});
