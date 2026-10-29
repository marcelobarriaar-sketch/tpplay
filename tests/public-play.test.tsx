import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import CloudGame from '../src/accounts/CloudGame';
import CoihueGame from '../src/games/coihue/Game';
import { initialProgress, restore, completed } from '../src/games/coihue/progress';
import { reduceGame } from '../server/learningDomain';
import { missions } from '../src/games/coihue/content';

test('anonymous city route renders a playable game instead of an account gate', () => {
 const html = renderToStaticMarkup(<MemoryRouter initialEntries={['/juegos/mision-tributos']}><CloudGame/></MemoryRouter>);
 assert.match(html, /Explora y aprende sin cuenta/);
 assert.match(html, /Comenzar a jugar/);
 assert.match(html, /Mapa de Valle del Coihue|Valle del Coihue/);
 assert.doesNotMatch(html, /Comprobando tu acceso|Ingresar a mi aventura|Avance recuperado y confirmado/);
});
test('public mode can progress, restore and unlock the next chapter without academic registration', () => {
 let state = reduceGame(initialProgress(), { type:'start' }).state;
 const mission = missions[0];
 state = reduceGame(state,{type:'visit',mission:mission.id}).state;
 state = reduceGame(state,{type:'begin'}).state;
 for (const challenge of mission.challenges) {
  for (const item of challenge.items) state = reduceGame(state,{type:'answer',challenge:challenge.id,item:item.id,value:challenge.kind==='order'?challenge.order!.join(','):item.correct}).state;
  state = reduceGame(state,{type:'advance',challenge:challenge.id}).state;
 }
 const restored=restore(JSON.stringify(state));
 assert.equal(restored.notice,''); assert.equal(completed(restored.state,mission.id),true);
 state=reduceGame(restored.state,{type:'visit',mission:missions[1].id}).state;
 const html=renderToStaticMarkup(<MemoryRouter><CoihueGame state={state} onEvent={()=>{}} guest/></MemoryRouter>);
 assert.doesNotMatch(html,/Guardar mi explicación para el docente|avance en servidor/);
 assert.match(html,/Crear cuenta · registrar aprendizaje/);
});
