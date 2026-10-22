import assert from 'node:assert/strict';
import test from 'node:test';
import {renderToStaticMarkup} from 'react-dom/server';
import {CamilaChapter, InicioStoryGate, camilaChapters} from '../src/games/inicio/story';

test('Camila has an introduction before decisions, nine story beats, consistent art and an honest ending',()=>{
 const introduction=renderToStaticMarkup(<InicioStoryGate enabled><div>DECISION_TEST</div></InicioStoryGate>);
 assert.match(introduction,/Camila tiene un sueño/);
 assert.match(introduction,/Aceptar el encargo de Camila/);
 assert.doesNotMatch(introduction,/DECISION_TEST/);
 assert.match(renderToStaticMarkup(<InicioStoryGate enabled={false}><div>DECISION_TEST</div></InicioStoryGate>),/DECISION_TEST/);
 assert.equal(camilaChapters.length,9);
 assert.equal(new Set(camilaChapters.map(c=>c.title)).size,9);
 assert.deepEqual([...new Set(camilaChapters.map(c=>c.look))].sort(),[0,1,2]);
 for(let index=0;index<9;index++){
  const html=renderToStaticMarkup(<CamilaChapter index={index}/>);
  assert.match(html,/camila-fotografia.webp/);
  assert.match(html,/alt="Camila,/);
 }
 assert.match(renderToStaticMarkup(<CamilaChapter ending/>),/permisos que deberá consultar por separado/);
 assert.doesNotMatch(introduction,/fictici/i);
});
